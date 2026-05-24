import { eventBus, EVENTS } from '../events/EventBus';
import { logger } from '../debug';
import env from '../../env';
import { bleManager } from '@core/ble';
import type { BLEDevice, BLEScanConfig } from '@core/ble';

export type { BLEDevice };

export interface BLEPacket {
  obstacle_type: string;
  distance_cm: number;
  direction: 'left' | 'center' | 'right';
  severity: 'safe' | 'caution' | 'danger';
  voice_instruction: string;
  timestamp: string;
}

interface BLEServiceConfig {
  mockMode: boolean;
  scanTimeout: number;
  reconnectDelay: number;
}

abstract class BLEServiceBase {
  abstract initialize(): void;
  abstract startScan(config?: Partial<BLEScanConfig>): Promise<void>;
  abstract stopScan(): Promise<void>;
  abstract connect(deviceId: string): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract getConnectedDevice(): Promise<BLEDevice | null>;
  abstract getDiscoveredDevices(): BLEDevice[];
  abstract isConnected(): boolean;
}

class BLEManagerService extends BLEServiceBase {
  initialize(): void {
    bleManager.initialize();
    logger.info('[BLEService] BLEManager initialized');
  }

  async startScan(config?: Partial<BLEScanConfig>): Promise<void> {
    eventBus.publish(EVENTS.BLE_DEVICE_CONNECTED, { status: 'scanning' }, 'normal');
    logger.info('[BLEService] Starting scan');
    await bleManager.startScan();
  }

  async stopScan(): Promise<void> {
    logger.info('[BLEService] Stopping scan');
    await bleManager.stopScan();
  }

  async connect(deviceId: string): Promise<boolean> {
    logger.info(`[BLEService] Connecting to ${deviceId}`);
    const device = bleManager.discoveredDevices.find(d => d.id === deviceId);
    if (!device) {
      logger.error(`[BLEService] Device not found: ${deviceId}`);
      return false;
    }
    return bleManager.connectToDevice(device);
  }

  async disconnect(): Promise<void> {
    logger.info('[BLEService] Disconnecting');
    await bleManager.disconnect('user_initiated');
  }

  async getConnectedDevice(): Promise<BLEDevice | null> {
    if (!bleManager.isConnected) return null;
    const info = bleManager.deviceInfo;
    return info.deviceId
      ? {
          id: info.deviceId,
          name: info.deviceName ?? 'Unknown',
          rssi: info.rssi,
          isConnected: true,
          batteryLevel: info.batteryLevel ?? undefined,
          lastSeen: Date.now(),
        }
      : null;
  }

  getDiscoveredDevices(): BLEDevice[] {
    return bleManager.discoveredDevices;
  }

  isConnected(): boolean {
    return bleManager.isConnected;
  }

  simulateObstacleDetection(): void {
    const mockPacket: BLEPacket = {
      obstacle_type: 'person',
      distance_cm: 150,
      direction: 'center',
      severity: 'caution',
      voice_instruction: 'Person detected, 1.5 meters ahead',
      timestamp: new Date().toISOString(),
    };

    const priority = mockPacket.severity === 'danger' ? 'critical' as const : 'normal' as const;
    eventBus.publish(EVENTS.AI_OBSTACLE_DETECTED, mockPacket, priority);
  }
}

class FallbackService extends BLEServiceBase {
  initialize(): void {
    logger.warn('[BLEService] Fallback service initialized (BLEManager unavailable)');
  }
  async startScan(): Promise<void> {
    logger.info('[BLEService] Fallback: startScan');
  }
  async stopScan(): Promise<void> {
    logger.info('[BLEService] Fallback: stopScan');
  }
  async connect(_deviceId: string): Promise<boolean> {
    logger.info('[BLEService] Fallback: connect');
    return false;
  }
  async disconnect(): Promise<void> {
    logger.info('[BLEService] Fallback: disconnect');
  }
  async getConnectedDevice(): Promise<BLEDevice | null> {
    return null;
  }
  getDiscoveredDevices(): BLEDevice[] {
    return [];
  }
  isConnected(): boolean {
    return false;
  }
}

const config: BLEServiceConfig = {
  mockMode: env.MOCK_BLE_DEVICE,
  scanTimeout: env.BLE_SCAN_TIMEOUT,
  reconnectDelay: env.BLE_RECONNECT_DELAY,
};

let bleServiceInstance: BLEServiceBase;

try {
  bleServiceInstance = new BLEManagerService();
} catch {
  logger.warn('[BLEService] Falling back to FallbackService');
  bleServiceInstance = new FallbackService();
}

export const bleService = bleServiceInstance;

if (env.MOCK_BLE_DEVICE) {
  bleService.initialize();
}

export type { BLEServiceConfig };
