import { eventBus, EVENTS } from '@core/events/EventBus';
import { logger } from '@core/debug';
import env from '../../env';
import type {
  BLEConnectionState,
  BLEConnectionConfig,
  BLEConnectionInfo,
  BLEDevice,
} from './types';
import { BLE_LIMITS } from './constants';
import { bleScanner } from './BLEScanner';
import { bleSubscriptionManager } from './BLESubscriptionManager';
import { bleReconnectionManager } from './BLEReconnectionManager';

type ConnectionStateChangeHandler = (
  state: BLEConnectionState,
  info: BLEConnectionInfo,
) => void;

export class BLEConnectionManager {
  private state: BLEConnectionState = 'idle';
  private connectionInfo: BLEConnectionInfo = {
    state: 'idle',
    deviceId: null,
    deviceName: null,
    mtu: BLE_LIMITS.MIN_MTU,
    rssi: -127,
    batteryLevel: null,
    chargingStatus: null,
    connectedAt: null,
    disconnectedAt: null,
    reconnectAttempts: 0,
    lastError: null,
  };

  private stateChangeHandlers: Set<ConnectionStateChangeHandler> = new Set();
  private connectTimer: ReturnType<typeof setTimeout> | null = null;
  private disconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private rssiTimer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;
  private deviceRef: BLEDevice | null = null;

  onStateChange(handler: ConnectionStateChangeHandler): () => void {
    this.stateChangeHandlers.add(handler);
    return () => this.stateChangeHandlers.delete(handler);
  }

  get currentState(): BLEConnectionState {
    return this.state;
  }

  get info(): Readonly<BLEConnectionInfo> {
    return { ...this.connectionInfo };
  }

  get isConnected(): boolean {
    return this.state === 'connected';
  }

  get connectedDeviceId(): string | null {
    return this.connectionInfo.deviceId;
  }

  async connect(config: BLEConnectionConfig): Promise<boolean> {
    if (this.destroyed) return false;

    if (this.state === 'connected' && this.connectionInfo.deviceId === config.deviceId) {
      logger.debug('[BLEConnection] Already connected to device');
      return true;
    }

    this.transitionTo('connecting');
    this.connectionInfo = {
      ...this.connectionInfo,
      deviceId: config.deviceId,
      deviceName: config.deviceName,
      lastError: null,
    };

    logger.info(`[BLEConnection] Connecting to ${config.deviceName} (${config.deviceId})`);

    this.connectTimer = setTimeout(() => {
      if (this.state === 'connecting') {
        this.onError(BLE_LIMITS.CONNECTION_TIMEOUT_MS, 'Connection timeout');
      }
    }, config.timeout || BLE_LIMITS.CONNECTION_TIMEOUT_MS);

    if (env.MOCK_BLE_DEVICE) {
      return this.simulateConnect(config);
    }

    this.onError(-1, 'Real BLE not implemented yet');
    return false;
  }

  async disconnect(reason: string = 'user_initiated'): Promise<void> {
    if (this.state !== 'connected' && this.state !== 'reconnecting') {
      logger.debug('[BLEConnection] Not connected, ignoring disconnect');
      return;
    }

    this.transitionTo('disconnecting');

    bleReconnectionManager.stop();
    this.stopRSSIMonitoring();

    this.disconnectTimer = setTimeout(() => {
      if (this.state === 'disconnecting') {
        this.transitionTo('disconnected');
        this.finalizeDisconnect(reason);
      }
    }, BLE_LIMITS.DISCONNECT_TIMEOUT_MS);

    if (env.MOCK_BLE_DEVICE) {
      setTimeout(() => {
        this.transitionTo('disconnected');
        this.finalizeDisconnect(reason);
      }, 300);
      return;
    }

    this.transitionTo('disconnected');
    this.finalizeDisconnect(reason);
  }

  startRSSIMonitoring(intervalMs: number = 2000): void {
    this.stopRSSIMonitoring();
    this.rssiTimer = setInterval(() => {
      if (this.state !== 'connected') return;

      const simulatedRssi = this.connectionInfo.rssi + Math.round((Math.random() - 0.5) * 10);
      const clampedRssi = Math.max(-100, Math.min(-30, simulatedRssi));
      this.updateRSSI(clampedRssi);
    }, intervalMs);
  }

  private stopRSSIMonitoring(): void {
    if (this.rssiTimer) {
      clearInterval(this.rssiTimer);
      this.rssiTimer = null;
    }
  }

  updateRSSI(rssi: number): void {
    const oldRssi = this.connectionInfo.rssi;
    this.connectionInfo.rssi = rssi;

    eventBus.publish(EVENTS.BLE_SIGNAL_WEAK, { rssi }, rssi <= BLE_LIMITS.SIGNAL_CRITICAL_THRESHOLD ? 'high' : 'normal');

    if (rssi <= BLE_LIMITS.SIGNAL_CRITICAL_THRESHOLD && oldRssi > BLE_LIMITS.SIGNAL_CRITICAL_THRESHOLD) {
      eventBus.publish(EVENTS.BLE_SIGNAL_WEAK, { rssi }, 'high');
      logger.warn(`[BLEConnection] Signal critical: ${rssi}dBm`);
    } else if (rssi <= BLE_LIMITS.SIGNAL_WEAK_THRESHOLD && oldRssi > BLE_LIMITS.SIGNAL_WEAK_THRESHOLD) {
      eventBus.publish(EVENTS.BLE_SIGNAL_WEAK, { rssi }, 'normal');
      logger.warn(`[BLEConnection] Signal weak: ${rssi}dBm`);
    }
  }

  updateBattery(level: number, chargingStatus: BLEConnectionInfo['chargingStatus']): void {
    this.connectionInfo.batteryLevel = level;
    this.connectionInfo.chargingStatus = chargingStatus;

    if (level <= BLE_LIMITS.BATTERY_CRITICAL_THRESHOLD) {
      eventBus.publish(EVENTS.LOW_BATTERY_WARNING, { level, chargingStatus }, 'high');
    } else if (level <= BLE_LIMITS.BATTERY_LOW_THRESHOLD) {
      eventBus.publish(EVENTS.LOW_BATTERY_WARNING, { level, chargingStatus }, 'normal');
    }
  }

  private async simulateConnect(config: BLEConnectionConfig): Promise<boolean> {
    return new Promise(resolve => {
      setTimeout(() => {
        if (this.destroyed || this.state !== 'connecting') {
          resolve(false);
          return;
        }

        const mtu = Math.min(config.requestMTU || BLE_LIMITS.REQUEST_MTU, BLE_LIMITS.MAX_MTU);

        this.connectionInfo = {
          ...this.connectionInfo,
          mtu,
          rssi: -45,
          batteryLevel: 85,
          chargingStatus: 'discharging',
          connectedAt: Date.now(),
          disconnectedAt: null,
          reconnectAttempts: 0,
          lastError: null,
        };

        this.deviceRef = {
          id: config.deviceId,
          name: config.deviceName,
          rssi: -45,
          isConnected: true,
          batteryLevel: 85,
          lastSeen: Date.now(),
        };

        this.transitionTo('connected');

        eventBus.publish(EVENTS.BLE_DEVICE_CONNECTED, {
          deviceId: config.deviceId,
          deviceName: config.deviceName,
          rssi: -45,
        }, 'high');

        logger.info('[BLEConnection] Mock connection established');
        resolve(true);
      }, 500);
    });
  }

  private transitionTo(newState: BLEConnectionState): void {
    const oldState = this.state;
    if (oldState === newState) return;

    this.state = newState;
    this.connectionInfo.state = newState;

    logger.debug(`[BLEConnection] State: ${oldState} → ${newState}`);

    this.notifyStateChangeHandlers(newState);

    if (this.connectTimer && newState !== 'connecting') {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }

    if (this.disconnectTimer && newState !== 'disconnecting') {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
    }
  }

  private finalizeDisconnect(reason: string): void {
    this.connectionInfo.disconnectedAt = Date.now();
    bleSubscriptionManager.stopAllMonitoring();
    bleScanner.updateRSSI(this.connectionInfo.deviceId!, -127);

    eventBus.publish(EVENTS.BLE_DEVICE_DISCONNECTED, { reason }, 'high');

    logger.info(`[BLEConnection] Disconnected: ${reason}`);
  }

  private onError(code: number, message: string): void {
    this.connectionInfo.lastError = message;
    this.transitionTo('error');

    eventBus.publish(EVENTS.BLE_ERROR, {
      deviceId: this.connectionInfo.deviceId ?? undefined,
      error: message,
      code,
    }, 'high');

    logger.error(`[BLEConnection] Error: ${message}`);

    setTimeout(() => {
      if (this.state === 'error') {
        this.transitionTo('idle');
      }
    }, 2000);
  }

  private notifyStateChangeHandlers(newState: BLEConnectionState): void {
    this.stateChangeHandlers.forEach(handler => {
      try {
        handler(newState, { ...this.connectionInfo });
      } catch (error) {
        logger.error('[BLEConnection] State change handler error:', error);
      }
    });
  }

  destroy(): void {
    this.destroyed = true;
    this.stopRSSIMonitoring();

    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }

    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
    }

    this.stateChangeHandlers.clear();
    this.state = 'idle';
    this.deviceRef = null;
  }
}

export const bleConnectionManager = new BLEConnectionManager();
