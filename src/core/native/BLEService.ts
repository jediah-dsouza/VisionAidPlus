import { eventBus, EVENTS, EventPriority } from '../events/EventBus';
import { logger } from '../debug';
import env from '../../env';

export interface BLEDevice {
  id: string;
  name: string;
  rssi: number;
  isConnected: boolean;
  batteryLevel?: number;
}

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
  abstract startScan(): Promise<void>;
  abstract stopScan(): Promise<void>;
  abstract connect(deviceId: string): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract getConnectedDevice(): Promise<BLEDevice | null>;
}

class MockBLEService extends BLEServiceBase {
  private connected = false;
  private scanning = false;
  private mockDevices: BLEDevice[] = [
    { id: 'vision-aid-001', name: 'VisionAid Pro', rssi: -45, isConnected: false },
    { id: 'vision-aid-002', name: 'VisionAid Mini', rssi: -60, isConnected: false },
  ];

  async startScan(): Promise<void> {
    this.scanning = true;
    logger.info('BLE: Starting scan (mock)');

    eventBus.publish(EVENTS.BLE_DEVICE_CONNECTED, { status: 'scanning' }, 'normal');

    setTimeout(() => {
      this.mockDevices.forEach(device => {
        eventBus.publish('BLE_DEVICE_FOUND', device, 'normal');
      });
    }, 1000);
  }

  async stopScan(): Promise<void> {
    this.scanning = false;
    logger.info('BLE: Stopping scan (mock)');
  }

  async connect(deviceId: string): Promise<void> {
    logger.info(`BLE: Connecting to ${deviceId} (mock)`);
    const device = this.mockDevices.find(d => d.id === deviceId);
    if (device) {
      device.isConnected = true;
      this.connected = true;
      eventBus.publish(EVENTS.BLE_DEVICE_CONNECTED, device, 'high');
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.mockDevices.forEach(d => (d.isConnected = false));
    eventBus.publish(EVENTS.BLE_DEVICE_DISCONNECTED, {}, 'high');
  }

  async getConnectedDevice(): Promise<BLEDevice | null> {
    return this.mockDevices.find(d => d.isConnected) ?? null;
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

    const priority: EventPriority = mockPacket.severity === 'danger' ? 'critical' : 'normal';
    eventBus.publish(EVENTS.AI_OBSTACLE_DETECTED, mockPacket, priority);
  }
}

class RealBLEService extends BLEServiceBase {
  async startScan(): Promise<void> {
    logger.info('BLE: Real implementation - startScan');
  }
  async stopScan(): Promise<void> {
    logger.info('BLE: Real implementation - stopScan');
  }
  async connect(_deviceId: string): Promise<void> {
    logger.info('BLE: Real implementation - connect');
  }
  async disconnect(): Promise<void> {
    logger.info('BLE: Real implementation - disconnect');
  }
  async getConnectedDevice(): Promise<BLEDevice | null> {
    return null;
  }
}

const config: BLEServiceConfig = {
  mockMode: env.MOCK_BLE_DEVICE,
  scanTimeout: env.BLE_SCAN_TIMEOUT,
  reconnectDelay: env.BLE_RECONNECT_DELAY,
};

export const bleService = config.mockMode ? new MockBLEService() : new RealBLEService();

export type { BLEServiceConfig };
