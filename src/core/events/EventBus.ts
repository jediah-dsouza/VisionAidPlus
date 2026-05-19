type EventPriority = 'critical' | 'high' | 'normal' | 'low';

type EventHandler<T = unknown> = (payload: T) => void;

interface EventSubscription {
  id: string;
  event: string;
  handler: EventHandler;
  priority: EventPriority;
}

interface EventBusConfig {
  maxQueueSize: number;
  defaultPriority: EventPriority;
}

const PRIORITY_ORDER: Record<EventPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

class EventBus {
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private eventQueue: Array<{ event: string; payload: unknown; priority: EventPriority }> = [];
  private config: EventBusConfig;
  private subscriptionId = 0;

  constructor(config: Partial<EventBusConfig> = {}) {
    this.config = {
      maxQueueSize: config.maxQueueSize ?? 100,
      defaultPriority: config.defaultPriority ?? 'normal',
    };
  }

  subscribe<T = unknown>(
    event: string,
    handler: EventHandler<T>,
    priority: EventPriority = this.config.defaultPriority,
  ): () => void {
    const id = `${this.subscriptionId++}`;
    const subscription: EventSubscription = {
      id,
      event,
      handler: handler as EventHandler,
      priority,
    };

    const existing = this.subscriptions.get(event) ?? [];
    const withPriority = [...existing, subscription].sort(
      (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
    );
    this.subscriptions.set(event, withPriority);

    return () => {
      const subs = this.subscriptions.get(event);
      if (subs) {
        this.subscriptions.set(
          event,
          subs.filter(s => s.id !== id),
        );
      }
    };
  }

  publish<T = unknown>(event: string, payload: T, priority?: EventPriority): void {
    const resolvedPriority = priority ?? this.config.defaultPriority;

    const subscription = this.subscriptions.get(event);
    if (subscription) {
      subscription.forEach(sub => {
        try {
          sub.handler(payload);
        } catch (error) {
          console.error(`Event handler error for ${event}:`, error);
        }
      });
    }

    if (this.eventQueue.length < this.config.maxQueueSize) {
      this.eventQueue.push({ event, payload, priority: resolvedPriority });
    }
  }

  once<T = unknown>(event: string, handler: EventHandler<T>, priority?: EventPriority): void {
    const unsubscribe = this.subscribe<T>(
      event,
      payload => {
        unsubscribe();
        handler(payload);
      },
      priority,
    );
  }

  getQueue(): ReadonlyArray<{ event: string; payload: unknown; priority: EventPriority }> {
    return this.eventQueue;
  }

  clearQueue(): void {
    this.eventQueue = [];
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.subscriptions.delete(event);
    } else {
      this.subscriptions.clear();
    }
  }
}

export const eventBus = new EventBus();

export const EVENTS = {
  BLE_DEVICE_CONNECTED: 'BLE_DEVICE_CONNECTED',
  BLE_DEVICE_DISCONNECTED: 'BLE_DEVICE_DISCONNECTED',
  BLE_SIGNAL_WEAK: 'BLE_SIGNAL_WEAK',
  BLE_ERROR: 'BLE_ERROR',
  AI_OBSTACLE_DETECTED: 'AI_OBSTACLE_DETECTED',
  AI_DANGER_DETECTED: 'AI_DANGER_DETECTED',
  AI_ERROR: 'AI_ERROR',
  TTS_PLAYBACK_STARTED: 'TTS_PLAYBACK_STARTED',
  TTS_PLAYBACK_COMPLETED: 'TTS_PLAYBACK_COMPLETED',
  TTS_ERROR: 'TTS_ERROR',
  EMERGENCY_TRIGGERED: 'EMERGENCY_TRIGGERED',
  EMERGENCY_CANCELLED: 'EMERGENCY_CANCELLED',
  CAMERA_INITIALIZED: 'CAMERA_INITIALIZED',
  CAMERA_ERROR: 'CAMERA_ERROR',
  LOW_BATTERY_WARNING: 'LOW_BATTERY_WARNING',
  NAVIGATION_STARTED: 'NAVIGATION_STARTED',
  NAVIGATION_STOPPED: 'NAVIGATION_STOPPED',
  SETTINGS_CHANGED: 'SETTINGS_CHANGED',
  ALERT_RECEIVED: 'ALERT_RECEIVED',
} as const;

export type AppEvent = (typeof EVENTS)[keyof typeof EVENTS];
export type { EventPriority, EventHandler, EventSubscription, EventBusConfig };
