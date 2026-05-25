import { eventBus, EVENTS } from '../../../src/core/events/EventBus';
import type { BLEConnectionState } from '../../../src/core/ble/types';
import { bleConnectionManager } from '../../../src/core/ble/BLEConnectionManager';
import { bleSubscriptionManager } from '../../../src/core/ble/BLESubscriptionManager';
import { BLE_CHARACTERISTIC_UUIDS } from '../../../src/core/ble/constants';

type EventPayload = Record<string, unknown>;

interface BLEEventLog {
  event: string;
  payload: unknown;
  timestamp: number;
}

export class BLESimulationHarness {
  private eventLog: BLEEventLog[] = [];
  private deviceId = 'test-device-001';
  private deviceName = 'Test Device Pro';

  generateObstaclePacket(overrides?: {
    distanceCm?: number;
    direction?: string;
    severity?: string;
    obstacleType?: string;
  }): string {
    const { distanceCm = 150, direction = 'center', severity = 'caution', obstacleType = 'person' } = overrides || {};
    return `t=${obstacleType},d=${distanceCm},dir=${direction},sev=${severity},ts=${Date.now()}`;
  }

  generateBatteryPacket(level?: number): string {
    const batteryLevel = level ?? 85;
    return `t=battery,bl=${batteryLevel},cs=discharging,v=3.7,ts=${Date.now()}`;
  }

  generateSignalPacket(rssi?: number): string {
    const signal = rssi ?? -65;
    return `t=signal,rssi=${signal},ts=${Date.now()}`;
  }

  async simulateConnect(): Promise<void> {
    const config = {
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      requestMTU: 512,
      timeout: 15000,
      autoReconnect: true,
    };
    await bleConnectionManager.connect(config);
  }

  async simulateDisconnect(reason: string = 'test'): Promise<void> {
    await bleConnectionManager.disconnect(reason);
  }

  simulateLowBattery(level: number = 10): void {
    bleConnectionManager.updateBattery(level, 'discharging');
  }

  simulatePacketReceived(characteristicUUID: string, data: string): void {
    bleSubscriptionManager.simulateNotification(characteristicUUID, data);
    this.eventLog.push({
      event: 'packet_received',
      payload: { characteristicUUID, data },
      timestamp: Date.now(),
    });
  }

  simulateObstacleNotification(distanceCm?: number): void {
    const packet = this.generateObstaclePacket({ distanceCm });
    this.simulatePacketReceived(BLE_CHARACTERISTIC_UUIDS.OBSTACLE, packet);
  }

  simulateBatteryNotification(level?: number): void {
    const packet = this.generateBatteryPacket(level);
    this.simulatePacketReceived(BLE_CHARACTERISTIC_UUIDS.BATTERY, packet);
  }

  get log(): BLEEventLog[] {
    return [...this.eventLog];
  }

  clearLog(): void {
    this.eventLog = [];
  }

  destroy(): void {
    this.clearLog();
    bleConnectionManager.destroy();
  }
}
