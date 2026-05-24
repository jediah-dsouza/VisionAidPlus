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

let eventBusInstanceCounter = 0;

class EventBus {
  private instanceId: number;
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private eventQueue: Array<{ event: string; payload: unknown; priority: EventPriority }> = [];
  private config: EventBusConfig;
  private subscriptionId = 0;
  private lastPublishTime: Map<string, number> = new Map();
  private readonly PUBLISH_THROTTLE_MS = 50;

  constructor(config: Partial<EventBusConfig> = {}) {
    eventBusInstanceCounter++;
    this.instanceId = eventBusInstanceCounter;
    console.log(`[EventBus] 🚀 INSTANCE ${this.instanceId} CREATED`);
    console.log(`[EventBus] Stack trace:`, new Error().stack);
    this.config = {
      maxQueueSize: config.maxQueueSize ?? 100,
      defaultPriority: config.defaultPriority ?? 'normal',
    };
  }

  getInstanceId(): number {
    return this.instanceId;
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

    console.log(`[EventBus#${this.instanceId}] ✅ SUBSCRIBED: ${event} (${withPriority.length} total handlers)`);
    console.log(`[EventBus#${this.instanceId}] All subscriptions:`, Array.from(this.subscriptions.keys()));

    return () => {
      const subs = this.subscriptions.get(event);
      if (subs) {
        this.subscriptions.set(
          event,
          subs.filter(s => s.id !== id),
        );
        console.log(`[EventBus#${this.instanceId}] UNSUBSCRIBED: ${event}`);
      }
    };
  }

  publish<T = unknown>(event: string, payload: T, priority?: EventPriority): void {
    const resolvedPriority = priority ?? this.config.defaultPriority;
    const now = Date.now();
    const lastTime = this.lastPublishTime.get(event);

    if (lastTime !== undefined && now - lastTime < this.PUBLISH_THROTTLE_MS) {
      return;
    }

    this.lastPublishTime.set(event, now);

    console.log(`[EventBus#${this.instanceId}] 📤 PUBLISH: ${event}`, { priority: resolvedPriority });
    console.log(`[EventBus#${this.instanceId}] All subscriptions:`, Array.from(this.subscriptions.keys()));

    const subscription = this.subscriptions.get(event);
    if (subscription) {
      console.log(`[EventBus#${this.instanceId}] ✅ ${subscription.length} handler(s) for ${event}`);
      subscription.forEach(sub => {
        try {
          console.log(`[EventBus#${this.instanceId}] → Calling handler for ${event}`);
          sub.handler(payload);
        } catch (error) {
          console.error(`[EventBus#${this.instanceId}] Handler error for ${event}:`, error);
        }
      });
    } else {
      console.log(`[EventBus#${this.instanceId}] ⚠️ NO HANDLERS for ${event}`);
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
      this.lastPublishTime.delete(event);
    } else {
      this.subscriptions.clear();
      this.lastPublishTime.clear();
    }
  }

  clearThrottleCache(): void {
    this.lastPublishTime.clear();
  }
}

export const eventBus = new EventBus();

export const EVENTS = {
  BLE_DEVICE_CONNECTED: 'BLE_DEVICE_CONNECTED',
  BLE_DEVICE_DISCONNECTED: 'BLE_DEVICE_DISCONNECTED',
  BLE_DEVICE_RECONNECTING: 'BLE_DEVICE_RECONNECTING',
  BLE_DEVICE_SCANNING: 'BLE_DEVICE_SCANNING',
  BLE_DEVICE_FOUND: 'BLE_DEVICE_FOUND',
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
