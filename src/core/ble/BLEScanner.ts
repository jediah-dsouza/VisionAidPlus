import { eventBus, EVENTS } from '@core/events/EventBus';
import { logger } from '@core/debug';
import env from '../../env';
import type { BLEDevice, BLEDeviceDiscovery, BLEScanConfig } from './types';
import { BLE_LIMITS } from './constants';
import { DEFAULT_SCAN_CONFIG } from './types';

export type ScanListener = (discovery: BLEDeviceDiscovery) => void;

export class BLEScanner {
  private isScanning = false;
  private scanStartTime: number | null = null;
  private scanTimer: ReturnType<typeof setTimeout> | null = null;
  private mockTimer: ReturnType<typeof setTimeout> | null = null;
  private discoveredDevices: Map<string, BLEDevice> = new Map();
  private listeners: Set<ScanListener> = new Set();
  private config: BLEScanConfig;

  constructor(config: Partial<BLEScanConfig> = {}) {
    this.config = { ...DEFAULT_SCAN_CONFIG, ...config };
  }

  get scanning(): boolean {
    return this.isScanning;
  }

  get discovered(): BLEDevice[] {
    const now = Date.now();
    return Array.from(this.discoveredDevices.values())
      .filter(d => now - d.lastSeen < BLE_LIMITS.DISCOVERY_CACHE_TTL_MS)
      .sort((a, b) => b.rssi - a.rssi);
  }

  onScan(listener: ScanListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async start(config?: Partial<BLEScanConfig>): Promise<void> {
    if (this.isScanning) {
      logger.debug('[BLEScanner] Already scanning, ignoring duplicate start');
      return;
    }

    if (config) {
      this.config = { ...DEFAULT_SCAN_CONFIG, ...config };
    }

    this.isScanning = true;
    this.scanStartTime = Date.now();

    logger.info('[BLEScanner] Starting scan', {
      mode: this.config.scanMode,
      duration: this.config.duration,
    });

    this.emitEvent('ble:scanStarted', { mode: this.config.scanMode });

    if (env.MOCK_BLE_DEVICE) {
      this.simulateDiscovery();
    }

    if (this.config.duration > 0) {
      this.scanTimer = setTimeout(() => {
        this.stop('timeout');
      }, this.config.duration);
    }
  }

  async stop(reason: string = 'user_requested'): Promise<void> {
    if (!this.isScanning) return;

    this.isScanning = false;
    this.scanStartTime = null;

    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }

    if (this.mockTimer) {
      clearTimeout(this.mockTimer);
      this.mockTimer = null;
    }

    logger.info('[BLEScanner] Scan stopped', { reason });
    this.emitEvent('ble:scanStopped', { reason });
  }

  updateRSSI(deviceId: string, rssi: number): void {
    const device = this.discoveredDevices.get(deviceId);
    if (device) {
      device.rssi = rssi;
      device.lastSeen = Date.now();
    }
  }

  private emitEvent(event: string, payload: unknown): void {
    eventBus.publish(event, payload, 'normal');
  }

  private notifyListeners(discovery: BLEDeviceDiscovery): void {
    this.listeners.forEach(listener => {
      try {
        listener(discovery);
      } catch (error) {
        logger.error('[BLEScanner] Listener error:', error);
      }
    });
  }

  private addOrUpdateDevice(discovery: BLEDeviceDiscovery): void {
    const existing = this.discoveredDevices.get(discovery.device.id);
    if (existing) {
      existing.rssi = discovery.device.rssi;
      existing.lastSeen = Date.now();
      existing.isConnected = discovery.device.isConnected;
    } else {
      this.discoveredDevices.set(discovery.device.id, { ...discovery.device });
    }
  }

  private simulateDiscovery(): void {
    const mockDevices: BLEDeviceDiscovery[] = [
      {
        device: {
          id: 'vision-aid-001',
          name: 'VisionAid Pro',
          rssi: -45,
          isConnected: false,
          batteryLevel: 85,
          serviceUUIDs: ['0000FFE0-0000-1000-8000-00805F9B34FB'],
          lastSeen: Date.now(),
        },
        advertisementData: {
          localName: 'VisionAid Pro',
          rssi: -45,
          isConnectable: true,
          serviceUUIDs: ['0000FFE0-0000-1000-8000-00805F9B34FB'],
        },
        timestamp: Date.now(),
      },
      {
        device: {
          id: 'vision-aid-002',
          name: 'VisionAid Mini',
          rssi: -60,
          isConnected: false,
          batteryLevel: 60,
          serviceUUIDs: ['0000FFE0-0000-1000-8000-00805F9B34FB'],
          lastSeen: Date.now(),
        },
        advertisementData: {
          localName: 'VisionAid Mini',
          rssi: -60,
          isConnectable: true,
          serviceUUIDs: ['0000FFE0-0000-1000-8000-00805F9B34FB'],
        },
        timestamp: Date.now(),
      },
    ];

    const lastIndex = mockDevices.length - 1;
    mockDevices.forEach((discovery, index) => {
      const timer = setTimeout(() => {
        if (!this.isScanning) return;
        this.addOrUpdateDevice(discovery);
        this.notifyListeners(discovery);
        logger.debug(`[BLEScanner] Mock device discovered: ${discovery.device.name}`);
      }, (index + 1) * 500);
      if (index === lastIndex) {
        this.mockTimer = timer;
      }
    });
  }

  clearCache(): void {
    this.discoveredDevices.clear();
    logger.debug('[BLEScanner] Device cache cleared');
  }

  destroy(): void {
    if (this.mockTimer) {
      clearTimeout(this.mockTimer);
      this.mockTimer = null;
    }
    this.stop('destroy');
    this.clearCache();
    this.listeners.clear();
  }
}

export const bleScanner = new BLEScanner();
