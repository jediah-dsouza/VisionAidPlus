import { AppState, AppStateStatus, Platform } from 'react-native';
import { eventBus, EVENTS } from '@core/events/EventBus';
import { logger } from '@core/debug';
import env from '../../env';
import type {
  BLEConnectionState,
  BLEConnectionConfig,
  BLEDevice,
  BLEDeviceDiscovery,
  BLEBackgroundConfig,
  BLEMetrics,
} from './types';
import { BLE_LIMITS } from './constants';
import { DEFAULT_BACKGROUND_CONFIG } from './types';
import { bleScanner } from './BLEScanner';
import { bleConnectionManager } from './BLEConnectionManager';
import { bleSubscriptionManager } from './BLESubscriptionManager';
import { bleReconnectionManager } from './BLEReconnectionManager';
import { blePacketParser } from './BLEPacketParser';

export type BLEManagerState = BLEConnectionState;

export interface BLEManagerConfig {
  backgroundConfig: BLEBackgroundConfig;
  scanDuration: number;
  connectionTimeout: number;
  requestMTU: number;
}

const DEFAULT_MANAGER_CONFIG: BLEManagerConfig = {
  backgroundConfig: DEFAULT_BACKGROUND_CONFIG,
  scanDuration: BLE_LIMITS.SCAN_DURATION_MS,
  connectionTimeout: BLE_LIMITS.CONNECTION_TIMEOUT_MS,
  requestMTU: BLE_LIMITS.REQUEST_MTU,
};

export class BLEManager {
  private config: BLEManagerConfig;
  private isInitialized = false;
  private destroyed = false;
  private appStateSubscription: (() => void) | null = null;
  private metrics: BLEMetrics = {
    totalPacketsReceived: 0,
    totalPacketsParsed: 0,
    totalParseErrors: 0,
    averageParseTimeMs: 0,
    totalReconnections: 0,
    totalDisconnections: 0,
    uptime: 0,
    lastPacketAt: null,
  };
  private startTime: number | null = null;
  private pendingTargetDevice: BLEDevice | null = null;

  get state(): BLEConnectionState {
    return bleConnectionManager.currentState;
  }

  get isConnected(): boolean {
    return bleConnectionManager.isConnected;
  }

  get connectedDeviceId(): string | null {
    return bleConnectionManager.connectedDeviceId;
  }

  get deviceInfo(): import('./types').BLEConnectionInfo {
    return bleConnectionManager.info;
  }

  get discoveredDevices(): BLEDevice[] {
    return bleScanner.discovered;
  }

  get metricsSnapshot(): Readonly<BLEMetrics> {
    const parserMetrics = blePacketParser.getMetrics();
    return {
      ...this.metrics,
      averageParseTimeMs: parserMetrics.averageParseTimeMs,
      uptime: this.startTime ? Date.now() - this.startTime : 0,
    };
  }

  initialize(config?: Partial<BLEManagerConfig>): void {
    if (this.destroyed) return;
    if (this.isInitialized) {
      logger.debug('[BLEManager] Already initialized');
      return;
    }

    this.config = { ...DEFAULT_MANAGER_CONFIG, ...config };
    this.startTime = Date.now();

    bleConnectionManager.onStateChange((state, info) => {
      this.onConnectionStateChange(state, info);
    });

    this.setupAppStateListener();

    this.isInitialized = true;
    logger.info('[BLEManager] Initialized');
  }

  async startScan(): Promise<void> {
    this.ensureInitialized();
    await bleScanner.start({ duration: this.config.scanDuration });
  }

  async stopScan(): Promise<void> {
    await bleScanner.stop('user_requested');
  }

  async connectToDevice(device: BLEDevice): Promise<boolean> {
    this.ensureInitialized();

    if (bleConnectionManager.isConnected) {
      logger.warn('[BLEManager] Already connected, disconnecting first');
      await this.disconnect();
    }

    this.pendingTargetDevice = device;

    const config: BLEConnectionConfig = {
      deviceId: device.id,
      deviceName: device.name,
      requestMTU: this.config.requestMTU,
      timeout: this.config.connectionTimeout,
      autoReconnect: true,
    };

    const success = await bleConnectionManager.connect(config);

    if (success) {
      bleConnectionManager.startRSSIMonitoring();
      await this.subscribeToDeviceServices(device.id);
      this.metrics.totalReconnections = bleConnectionManager.info.reconnectAttempts;
    } else {
      this.pendingTargetDevice = null;
    }

    return success;
  }

  async disconnect(reason: string = 'user_initiated'): Promise<void> {
    bleReconnectionManager.reset();
    await bleConnectionManager.disconnect(reason);
    this.metrics.totalDisconnections++;
    this.pendingTargetDevice = null;
  }

  async attemptReconnect(): Promise<boolean> {
    const deviceId = bleConnectionManager.connectedDeviceId;
    if (!deviceId) return false;

    logger.info('[BLEManager] Attempting reconnect');

    const config: BLEConnectionConfig = {
      deviceId,
      deviceName: bleConnectionManager.info.deviceName ?? 'Unknown',
      requestMTU: this.config.requestMTU,
      timeout: this.config.connectionTimeout,
      autoReconnect: true,
    };

    const success = await bleConnectionManager.connect(config);

    if (success) {
      this.metrics.totalReconnections++;
      bleConnectionManager.startRSSIMonitoring();
      await this.subscribeToDeviceServices(deviceId);
    }

    return success;
  }

  sendControlCommand(command: string): void {
    if (!bleConnectionManager.isConnected) {
      logger.warn('[BLEManager] Cannot send command: not connected');
      return;
    }

    logger.debug('[BLEManager] Sending control command:', command);
  }

  handlePacketReceived(
    serviceUUID: string,
    characteristicUUID: string,
    base64Data: string,
  ): void {
    this.metrics.totalPacketsReceived++;

    const rawString = blePacketParser.parseRaw(serviceUUID, characteristicUUID, base64Data);
    const result = blePacketParser.parse(characteristicUUID, rawString);

    this.metrics.lastPacketAt = Date.now();

    if ('error' in result) {
      this.metrics.totalParseErrors++;
      return;
    }

    this.metrics.totalPacketsParsed++;

    const { packet } = result;

    switch (packet.type) {
      case 'battery':
        bleConnectionManager.updateBattery(packet.batteryLevel, packet.chargingStatus);
        eventBus.publish(EVENTS.LOW_BATTERY_WARNING, {
          level: packet.batteryLevel,
          chargingStatus: packet.chargingStatus,
        }, 'normal');
        break;

      case 'signal':
        bleConnectionManager.updateRSSI(packet.rssi);
        break;

      case 'status':
        if (packet.deviceState === 'low_power') {
          eventBus.publish(EVENTS.LOW_BATTERY_WARNING, {
            state: 'low_power',
            uptime: packet.uptime,
          }, 'high');
        }
        break;

      case 'obstacle':
        if (packet.severity === 'danger') {
          eventBus.publish(EVENTS.AI_DANGER_DETECTED, packet, 'critical');
        } else {
          eventBus.publish(EVENTS.AI_OBSTACLE_DETECTED, packet, 'normal');
        }
        break;

      case 'navigation':
        eventBus.publish(EVENTS.NAVIGATION_STARTED, packet, 'high');
        break;
    }
  }

  private async subscribeToDeviceServices(deviceId: string): Promise<void> {
    if (env.MOCK_BLE_DEVICE) {
      logger.debug('[BLEManager] Mock device, setting up simulated subscriptions');
      return;
    }

    logger.info(`[BLEManager] Subscribing to device services: ${deviceId}`);
  }

  private onConnectionStateChange(state: BLEConnectionState, info: any): void {
    switch (state) {
      case 'disconnected':
        if (info.lastError) {
          this.startReconnection();
        }
        break;

      case 'connected':
        bleReconnectionManager.stop();
        break;

      case 'error':
        this.startReconnection();
        break;
    }
  }

  private startReconnection(): void {
    const deviceId = bleConnectionManager.connectedDeviceId;
    if (!deviceId) return;

    const settings = { autoReconnect: true };
    if (!settings.autoReconnect) return;

    bleReconnectionManager.start(deviceId, () => this.attemptReconnect());
  }

  private setupAppStateListener(): void {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'background') {
        this.onAppBackground();
      } else if (nextState === 'active') {
        this.onAppForeground();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    this.appStateSubscription = () => subscription.remove();
  }

  private onAppBackground(): void {
    const bgConfig = this.config.backgroundConfig;
    logger.debug('[BLEManager] App backgrounded');

    if (!bgConfig.keepConnection && bleConnectionManager.isConnected) {
      bleConnectionManager.disconnect('background');
    }
  }

  private onAppForeground(): void {
    const bgConfig = this.config.backgroundConfig;
    logger.debug('[BLEManager] App foregrounded');

    if (bgConfig.subscribeOnForeground && bleConnectionManager.isConnected) {
      const deviceId = bleConnectionManager.connectedDeviceId;
      if (deviceId) {
        this.subscribeToDeviceServices(deviceId);
      }
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('[BLEManager] Not initialized. Call initialize() first.');
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.isInitialized = false;

    bleReconnectionManager.destroy();
    bleSubscriptionManager.destroy();
    bleConnectionManager.destroy();
    bleScanner.destroy();

    if (this.appStateSubscription) {
      this.appStateSubscription();
      this.appStateSubscription = null;
    }

    this.pendingTargetDevice = null;
    this.startTime = null;

    logger.info('[BLEManager] Destroyed');
  }
}

export const bleManager = new BLEManager();
