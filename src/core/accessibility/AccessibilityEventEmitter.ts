import { EventPriority } from '../events/EventBus';
import { logger } from '../debug';

export type AccessibilityEventType =
  | 'screen_reader_changed'
  | 'reduce_motion_changed'
  | 'high_contrast_changed'
  | 'bold_text_changed'
  | 'grayscale_changed'
  | 'invert_colors_changed'
  | 'announcement_started'
  | 'announcement_completed'
  | 'announcement_interrupted'
  | 'focus_changed'
  | 'haptic_triggered'
  | 'voice_priority_changed'
  | 'emergency_mode_entered'
  | 'emergency_mode_exited';

export interface AccessibilityEvent {
  type: AccessibilityEventType;
  timestamp: number;
  payload?: Record<string, unknown>;
  priority?: EventPriority;
}

type AccessibilityEventHandler = (event: AccessibilityEvent) => void;

interface EventSubscription {
  id: string;
  eventType: AccessibilityEventType;
  handler: AccessibilityEventHandler;
}

const MAX_HISTORY_SIZE = 100;
const MAX_SUBSCRIPTIONS_PER_EVENT = 50;

class AccessibilityEventEmitter {
  private subscriptions: Map<AccessibilityEventType, EventSubscription[]> = new Map();
  private globalSubscriptions: EventSubscription[] = [];
  private eventHistory: AccessibilityEvent[] = [];
  private maxHistorySize = MAX_HISTORY_SIZE;
  private subscriptionId = 0;
  private destroyed = false;

  subscribe(eventType: AccessibilityEventType, handler: AccessibilityEventHandler): () => void {
    if (this.destroyed) {
      return () => {};
    }

    const existingCount = this.subscriptions.get(eventType)?.length ?? 0;
    if (existingCount >= MAX_SUBSCRIPTIONS_PER_EVENT) {
      logger.warn(`AccessibilityEventEmitter: Max subscriptions reached for ${eventType}`);
      return () => {};
    }

    const id = `sub_${this.subscriptionId++}`;
    const subscription: EventSubscription = {
      id,
      eventType,
      handler,
    };

    const existing = this.subscriptions.get(eventType) ?? [];
    this.subscriptions.set(eventType, [...existing, subscription]);

    logger.debug(`AccessibilityEventEmitter: Subscribed to ${eventType}`);

    return () => {
      this.unsubscribe(eventType, id);
    };
  }

  subscribeAll(handler: AccessibilityEventHandler): () => void {
    if (this.destroyed) {
      return () => {};
    }

    const id = `global_${this.subscriptionId++}`;
    const subscription: EventSubscription = {
      id,
      eventType: '*' as AccessibilityEventType,
      handler,
    };

    this.globalSubscriptions.push(subscription);

    return () => {
      this.globalSubscriptions = this.globalSubscriptions.filter(s => s.id !== id);
    };
  }

  private unsubscribe(eventType: AccessibilityEventType, subscriptionId: string): void {
    if (this.destroyed) return;

    const subs = this.subscriptions.get(eventType);
    if (subs) {
      this.subscriptions.set(
        eventType,
        subs.filter(s => s.id !== subscriptionId),
      );
      logger.debug(`AccessibilityEventEmitter: Unsubscribed from ${eventType}`);
    }
  }

  emit(
    type: AccessibilityEventType,
    payload?: Record<string, unknown>,
    priority?: EventPriority,
  ): void {
    if (this.destroyed) return;

    const event: AccessibilityEvent = {
      type,
      timestamp: Date.now(),
      payload,
      priority,
    };

    this.eventHistory.unshift(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(0, this.maxHistorySize);
    }

    logger.debug(`AccessibilityEventEmitter: Emitted ${type}`);

    const specificSubs = this.subscriptions.get(type) ?? [];
    const handlers = [...specificSubs, ...this.globalSubscriptions];

    handlers.forEach(sub => {
      try {
        sub.handler(event);
      } catch (error) {
        logger.error(`AccessibilityEventEmitter: Handler error for ${type}`, error);
      }
    });
  }

  emitScreenReaderChanged(enabled: boolean): void {
    this.emit('screen_reader_changed', { enabled }, enabled ? 'high' : 'normal');
  }

  emitReduceMotionChanged(enabled: boolean): void {
    this.emit('reduce_motion_changed', { enabled });
  }

  emitHighContrastChanged(enabled: boolean): void {
    this.emit('high_contrast_changed', { enabled });
  }

  emitBoldTextChanged(enabled: boolean): void {
    this.emit('bold_text_changed', { enabled });
  }

  emitAnnouncementStarted(message: string, priority: EventPriority): void {
    this.emit('announcement_started', { message, priority }, priority);
  }

  emitAnnouncementCompleted(message: string): void {
    this.emit('announcement_completed', { message });
  }

  emitAnnouncementInterrupted(message: string, reason?: string): void {
    this.emit('announcement_interrupted', { message, reason }, 'high');
  }

  emitFocusChanged(elementId: string, label?: string): void {
    this.emit('focus_changed', { elementId, label });
  }

  emitHapticTriggered(pattern: string, triggeredBy: string): void {
    this.emit('haptic_triggered', { pattern, triggeredBy });
  }

  emitEmergencyModeEntered(): void {
    this.emit('emergency_mode_entered', {}, 'critical');
  }

  emitEmergencyModeExited(): void {
    this.emit('emergency_mode_exited', {}, 'high');
  }

  getEventHistory(eventType?: AccessibilityEventType): ReadonlyArray<AccessibilityEvent> {
    if (eventType) {
      return this.eventHistory.filter(e => e.type === eventType);
    }
    return [...this.eventHistory];
  }

  getRecentEvents(count = 10): ReadonlyArray<AccessibilityEvent> {
    return this.eventHistory.slice(0, count);
  }

  clearHistory(): void {
    this.eventHistory = [];
    logger.debug(`AccessibilityEventEmitter: Cleared event history`);
  }

  getSubscriberCount(eventType?: AccessibilityEventType): number {
    if (eventType) {
      return (this.subscriptions.get(eventType)?.length ?? 0) + this.globalSubscriptions.length;
    }
    return this.globalSubscriptions.length;
  }

  removeAllListeners(eventType?: AccessibilityEventType): void {
    if (this.destroyed) return;

    if (eventType) {
      this.subscriptions.delete(eventType);
    } else {
      this.subscriptions.clear();
      this.globalSubscriptions = [];
    }
    logger.debug(
      `AccessibilityEventEmitter: Removed all listeners${eventType ? ` for ${eventType}` : ''}`,
    );
  }

  getEventTypes(): AccessibilityEventType[] {
    return [
      'screen_reader_changed',
      'reduce_motion_changed',
      'high_contrast_changed',
      'bold_text_changed',
      'grayscale_changed',
      'invert_colors_changed',
      'announcement_started',
      'announcement_completed',
      'announcement_interrupted',
      'focus_changed',
      'haptic_triggered',
      'voice_priority_changed',
      'emergency_mode_entered',
      'emergency_mode_exited',
    ];
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    this.subscriptions.clear();
    this.globalSubscriptions = [];
    this.eventHistory = [];

    logger.debug('AccessibilityEventEmitter: Destroyed');
  }
}

export const accessibilityEventEmitter = new AccessibilityEventEmitter();
