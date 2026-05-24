import { eventBus, EVENTS, EventPriority } from '../events/EventBus';
import { logger } from '../debug';
import { emergencyStateMachine } from './EmergencyStateMachine';

export const EMERGENCY_EVENTS = {
  EMERGENCY_COUNTDOWN_STARTED: 'EMERGENCY_COUNTDOWN_STARTED',
  EMERGENCY_COUNTDOWN_TICK: 'EMERGENCY_COUNTDOWN_TICK',
  EMERGENCY_COUNTDOWN_CANCELLED: 'EMERGENCY_COUNTDOWN_CANCELLED',
  EMERGENCY_TRIGGERED: 'EMERGENCY_TRIGGERED',
  EMERGENCY_CANCELLED: 'EMERGENCY_CANCELLED',
  EMERGENCY_SENDING: 'EMERGENCY_SENDING',
  EMERGENCY_SEND_SUCCESS: 'EMERGENCY_SEND_SUCCESS',
  EMERGENCY_SEND_FAILED: 'EMERGENCY_SEND_FAILED',
  EMERGENCY_ESCALATED: 'EMERGENCY_ESCALATED',
  EMERGENCY_RESOLVED: 'EMERGENCY_RESOLVED',
  EMERGENCY_RECOVERY: 'EMERGENCY_RECOVERY',
  EMERGENCY_CONTACT_NOTIFIED: 'EMERGENCY_CONTACT_NOTIFIED',
  EMERGENCY_CONTACT_FAILED: 'EMERGENCY_CONTACT_FAILED',
  EMERGENCY_GPS_PREPARED: 'EMERGENCY_GPS_PREPARED',
  EMERGENCY_GPS_FAILED: 'EMERGENCY_GPS_FAILED',
  EMERGENCY_SMS_QUEUED: 'EMERGENCY_SMS_QUEUED',
  EMERGENCY_SMS_SENT: 'EMERGENCY_SMS_SENT',
  EMERGENCY_SMS_FAILED: 'EMERGENCY_SMS_FAILED',
} as const;

export type EmergencyEventKey = (typeof EMERGENCY_EVENTS)[keyof typeof EMERGENCY_EVENTS];

export interface EmergencyEventPayloads {
  [EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_STARTED]: { duration: number; startedAt: number };
  [EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_TICK]: { remaining: number; elapsed: number };
  [EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_CANCELLED]: { remaining: number; cancelledAt: number };
  [EMERGENCY_EVENTS.EMERGENCY_TRIGGERED]: { triggeredAt: number; fromCountdown: boolean };
  [EMERGENCY_EVENTS.EMERGENCY_CANCELLED]: { cancelledAt: number; reason?: string };
  [EMERGENCY_EVENTS.EMERGENCY_SENDING]: { contactCount: number; timestamp: number };
  [EMERGENCY_EVENTS.EMERGENCY_SEND_SUCCESS]: { contactId: string; method: string };
  [EMERGENCY_EVENTS.EMERGENCY_SEND_FAILED]: { contactId: string; error: string; method: string };
  [EMERGENCY_EVENTS.EMERGENCY_ESCALATED]: { attempt: number; timestamp: number };
  [EMERGENCY_EVENTS.EMERGENCY_RESOLVED]: { resolvedAt: number; duration: number };
  [EMERGENCY_EVENTS.EMERGENCY_RECOVERY]: { timestamp: number };
  [EMERGENCY_EVENTS.EMERGENCY_CONTACT_NOTIFIED]: { contactId: string; method: string; success: boolean };
  [EMERGENCY_EVENTS.EMERGENCY_CONTACT_FAILED]: { contactId: string; error: string; attempt: number };
  [EMERGENCY_EVENTS.EMERGENCY_GPS_PREPARED]: { latitude: number; longitude: number; accuracy: number };
  [EMERGENCY_EVENTS.EMERGENCY_GPS_FAILED]: { error: string };
  [EMERGENCY_EVENTS.EMERGENCY_SMS_QUEUED]: { contactIds: string[]; messagePreview: string };
  [EMERGENCY_EVENTS.EMERGENCY_SMS_SENT]: { contactId: string; messageId: string };
  [EMERGENCY_EVENTS.EMERGENCY_SMS_FAILED]: { contactId: string; error: string };
}

export type EmergencyPayload = EmergencyEventPayloads[keyof EmergencyEventPayloads];

const EMERGENCY_PRIORITY_MAP: Record<string, EventPriority> = {
  [EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_STARTED]: 'critical',
  [EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_TICK]: 'high',
  [EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_CANCELLED]: 'high',
  [EMERGENCY_EVENTS.EMERGENCY_TRIGGERED]: 'critical',
  [EMERGENCY_EVENTS.EMERGENCY_CANCELLED]: 'high',
  [EMERGENCY_EVENTS.EMERGENCY_SENDING]: 'critical',
  [EMERGENCY_EVENTS.EMERGENCY_SEND_SUCCESS]: 'normal',
  [EMERGENCY_EVENTS.EMERGENCY_SEND_FAILED]: 'high',
  [EMERGENCY_EVENTS.EMERGENCY_ESCALATED]: 'critical',
  [EMERGENCY_EVENTS.EMERGENCY_RESOLVED]: 'normal',
  [EMERGENCY_EVENTS.EMERGENCY_RECOVERY]: 'normal',
  [EMERGENCY_EVENTS.EMERGENCY_CONTACT_NOTIFIED]: 'normal',
  [EMERGENCY_EVENTS.EMERGENCY_CONTACT_FAILED]: 'high',
  [EMERGENCY_EVENTS.EMERGENCY_GPS_PREPARED]: 'normal',
  [EMERGENCY_EVENTS.EMERGENCY_GPS_FAILED]: 'high',
  [EMERGENCY_EVENTS.EMERGENCY_SMS_QUEUED]: 'normal',
  [EMERGENCY_EVENTS.EMERGENCY_SMS_SENT]: 'low',
  [EMERGENCY_EVENTS.EMERGENCY_SMS_FAILED]: 'high',
};

interface DeliveryRecord {
  event: string;
  timestamp: number;
  delivered: boolean;
  error?: string;
}

export class EmergencyEventPriorityManager {
  private deliveryLog: DeliveryRecord[] = [];
  private readonly MAX_LOG = 100;
  private destroyed = false;
  private pendingRetries: Map<string, number> = new Map();
  private readonly MAX_RETRIES_PER_EVENT = 3;

  publish<K extends EmergencyEventKey>(
    event: K,
    payload: EmergencyEventPayloads[K],
  ): void {
    if (this.destroyed) return;

    const priority = EMERGENCY_PRIORITY_MAP[event] ?? 'high';

    try {
      eventBus.publish(event, payload, priority);

      this.deliveryLog.unshift({ event, timestamp: Date.now(), delivered: true });
      if (this.deliveryLog.length > this.MAX_LOG) this.deliveryLog.pop();

      logger.info(`[EmergencyPriority] Published: ${event}`, { priority });
    } catch (error) {
      this.deliveryLog.unshift({
        event,
        timestamp: Date.now(),
        delivered: false,
        error: (error as Error).message,
      });
      if (this.deliveryLog.length > this.MAX_LOG) this.deliveryLog.pop();

      logger.error(`[EmergencyPriority] Failed to publish: ${event}`, error);
      this.scheduleRetry(event, payload as EmergencyPayload);
    }
  }

  private scheduleRetry(event: string, payload: EmergencyPayload): void {
    const retries = this.pendingRetries.get(event) ?? 0;
    if (retries >= this.MAX_RETRIES_PER_EVENT) {
      logger.error(`[EmergencyPriority] Max retries reached for: ${event}`);
      return;
    }

    this.pendingRetries.set(event, retries + 1);
    const delay = Math.min(100 * Math.pow(2, retries), 2000);

    setTimeout(() => {
      if (this.destroyed) return;

      try {
        const priority = EMERGENCY_PRIORITY_MAP[event] ?? 'high';
        eventBus.publish(event, payload, priority);
        logger.info(`[EmergencyPriority] Retry successful: ${event} (attempt ${retries + 1})`);
        this.pendingRetries.delete(event);
      } catch (error) {
        logger.error(`[EmergencyPriority] Retry failed: ${event} (attempt ${retries + 1})`, error);
        this.scheduleRetry(event, payload);
      }
    }, delay);
  }

  subscribeToEmergencyEvents(): () => void {
    const unsubscribes: Array<() => void> = [];

    const addSub = (event: string, handler: (payload: unknown) => void, priority: EventPriority) => {
      const unsub = eventBus.subscribe(event, handler, priority);
      unsubscribes.push(unsub);
    };

    addSub(
      EMERGENCY_EVENTS.EMERGENCY_TRIGGERED,
      () => emergencyStateMachine.send('CONFIRM_EMERGENCY'),
      'critical',
    );

    addSub(
      EMERGENCY_EVENTS.EMERGENCY_CANCELLED,
      () => emergencyStateMachine.send('CANCEL_EMERGENCY'),
      'high',
    );

    return () => {
      for (const unsub of unsubscribes) {
        try { unsub(); } catch { /* cleanup */ }
      }
    };
  }

  getDeliveryLog(): ReadonlyArray<DeliveryRecord> {
    return [...this.deliveryLog];
  }

  getPriority(event: string): EventPriority {
    return EMERGENCY_PRIORITY_MAP[event] ?? 'normal';
  }

  clearLog(): void {
    this.deliveryLog = [];
  }

  destroy(): void {
    this.destroyed = true;
    this.deliveryLog = [];
    this.pendingRetries.clear();
  }
}

export const emergencyEventPriorityManager = new EmergencyEventPriorityManager();
