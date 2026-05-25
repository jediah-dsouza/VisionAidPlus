import type { AnalyticsEvent, AnalyticsCategory, AnalyticsSeverity, AnalyticsSource } from './types';
import { EVENTS } from '@core/events/EventBus';

interface EventBusInterface {
  subscribe(event: string, handler: (payload: unknown) => void): () => void;
  publish(event: string, payload: unknown): void;
  removeAllListeners(event?: string): void;
}

const EVENT_MAP: Array<{
  event: string;
  category: AnalyticsCategory;
  source: AnalyticsSource;
  severity: AnalyticsSeverity;
}> = [
  { event: EVENTS.ALERT_RECEIVED, category: 'alert', source: 'system', severity: 'critical' },
  { event: EVENTS.AI_OBSTACLE_DETECTED, category: 'obstacle', source: 'ai', severity: 'warning' },
  { event: EVENTS.AI_DANGER_DETECTED, category: 'safety', source: 'ai', severity: 'critical' },
  { event: EVENTS.AI_ERROR, category: 'performance', source: 'ai', severity: 'warning' },
  { event: EVENTS.BLE_DEVICE_CONNECTED, category: 'session', source: 'ble', severity: 'info' },
  { event: EVENTS.BLE_DEVICE_DISCONNECTED, category: 'session', source: 'ble', severity: 'info' },
  { event: EVENTS.BLE_DEVICE_RECONNECTING, category: 'session', source: 'ble', severity: 'warning' },
  { event: EVENTS.BLE_ERROR, category: 'performance', source: 'ble', severity: 'warning' },
  { event: EVENTS.BLE_SIGNAL_WEAK, category: 'performance', source: 'ble', severity: 'warning' },
  { event: EVENTS.EMERGENCY_TRIGGERED, category: 'safety', source: 'emergency', severity: 'critical' },
  { event: EVENTS.EMERGENCY_CANCELLED, category: 'safety', source: 'emergency', severity: 'info' },
  { event: EVENTS.LOW_BATTERY_WARNING, category: 'performance', source: 'system', severity: 'warning' },
  { event: EVENTS.NAVIGATION_STARTED, category: 'usage', source: 'navigation', severity: 'info' },
  { event: EVENTS.NAVIGATION_STOPPED, category: 'usage', source: 'navigation', severity: 'info' },
  { event: EVENTS.TTS_PLAYBACK_STARTED, category: 'usage', source: 'voice', severity: 'info' },
  { event: EVENTS.TTS_PLAYBACK_COMPLETED, category: 'usage', source: 'voice', severity: 'info' },
  { event: EVENTS.TTS_ERROR, category: 'performance', source: 'voice', severity: 'warning' },
  { event: EVENTS.CAMERA_INITIALIZED, category: 'performance', source: 'system', severity: 'info' },
  { event: EVENTS.CAMERA_ERROR, category: 'performance', source: 'system', severity: 'warning' },
  { event: EVENTS.SETTINGS_CHANGED, category: 'usage', source: 'system', severity: 'info' },
];

let sequenceCounter = 0;

function nextSequence(): number {
  return ++sequenceCounter;
}

export class AnalyticsEventBridge {
  private eventBus: EventBusInterface | null = null;
  private unsubscribers: Array<() => void> = [];
  private destroyed = false;

  onAnalyticsEvent: ((event: AnalyticsEvent) => void) | null = null;

  constructor() {
    console.log('[AnalyticsEventBridge] Bridge initialized');
  }

  connect(eventBus: EventBusInterface): void {
    if (this.destroyed) {
      console.warn('[AnalyticsEventBridge] Cannot connect on destroyed bridge');
      return;
    }

    if (this.eventBus) {
      console.warn('[AnalyticsEventBridge] Already connected, disconnecting first');
      this.disconnect();
    }

    this.eventBus = eventBus;

    for (const mapping of EVENT_MAP) {
      const unsubscribe = eventBus.subscribe(mapping.event, (payload: unknown) => {
        this.handleEvent(mapping, payload);
      });
      this.unsubscribers.push(unsubscribe);
    }

    console.log(`[AnalyticsEventBridge] Connected to EventBus (${EVENT_MAP.length} subscriptions)`);
  }

  disconnect(): void {
    if (this.destroyed) return;

    for (const unsubscribe of this.unsubscribers) {
      try {
        unsubscribe();
      } catch (error) {
        console.error('[AnalyticsEventBridge] Unsubscribe error:', error);
      }
    }

    this.unsubscribers = [];
    this.eventBus = null;
    console.log('[AnalyticsEventBridge] Disconnected from EventBus');
  }

  private handleEvent(
    mapping: { event: string; category: AnalyticsCategory; source: AnalyticsSource; severity: AnalyticsSeverity },
    payload: unknown,
  ): void {
    if (this.destroyed) return;

    const analyticsEvent: AnalyticsEvent = {
      id: `analytics_${Date.now()}_${nextSequence()}`,
      timestamp: Date.now(),
      category: mapping.category,
      severity: mapping.severity,
      source: mapping.source,
      eventType: mapping.event,
      sessionId: '',
      sequence: nextSequence(),
      payload: payload !== undefined ? { data: payload } as Record<string, unknown> : {},
      metadata: {},
    };

    if (this.onAnalyticsEvent) {
      try {
        this.onAnalyticsEvent(analyticsEvent);
      } catch (error) {
        console.error('[AnalyticsEventBridge] onAnalyticsEvent callback error:', error);
      }
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.disconnect();
    this.onAnalyticsEvent = null;
    console.log('[AnalyticsEventBridge] Destroyed');
  }
}

export const analyticsEventBridge = new AnalyticsEventBridge();
