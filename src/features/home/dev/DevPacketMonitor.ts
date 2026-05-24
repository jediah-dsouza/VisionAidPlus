import { eventBus, EVENTS } from '@core/events/EventBus';

export interface PacketMonitorEntry {
  id: string;
  timestamp: number;
  direction: 'incoming' | 'outgoing';
  characteristicUUID: string;
  payloadType: string;
  raw: string;
  parseStatus: 'success' | 'error';
  packet?: unknown;
}

const MONITOR_EVENTS = [
  EVENTS.BLE_DEVICE_CONNECTED,
  EVENTS.BLE_DEVICE_DISCONNECTED,
  EVENTS.BLE_DEVICE_RECONNECTING,
  EVENTS.BLE_DEVICE_SCANNING,
  EVENTS.BLE_DEVICE_FOUND,
  EVENTS.BLE_SIGNAL_WEAK,
  EVENTS.BLE_ERROR,
  EVENTS.LOW_BATTERY_WARNING,
  'ble:scanStarted',
  'ble:scanStopped',
] as const;

class DevPacketMonitor {
  private log: PacketMonitorEntry[] = [];
  private maxLogSize = 200;
  private unsubscribers: (() => void)[] = [];
  private initialized = false;

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    if (!__DEV__) return;

    for (const event of MONITOR_EVENTS) {
      const unsub = eventBus.subscribe(event, (payload: unknown) => {
        this.push({
          direction: 'incoming',
          characteristicUUID: 'event',
          payloadType: event,
          raw: JSON.stringify(payload),
          parseStatus: 'success',
        });
      });
      this.unsubscribers.push(unsub);
    }
  }

  push(entry: Omit<PacketMonitorEntry, 'id' | 'timestamp'>): void {
    this.log.unshift({
      id: `pkt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      ...entry,
    });
    if (this.log.length > this.maxLogSize) {
      this.log.pop();
    }
  }

  getLog(): PacketMonitorEntry[] {
    return [...this.log];
  }

  clear(): void {
    this.log = [];
  }

  destroy(): void {
    this.unsubscribers.forEach(u => u());
    this.unsubscribers = [];
    this.log = [];
    this.initialized = false;
  }
}

export const devPacketMonitor = new DevPacketMonitor();
