import { eventBus, EVENTS } from '../../../src/core/events/EventBus';
import { EMERGENCY_EVENTS } from '../../../src/core/emergency';
import { store } from '../../../src/app/store';
import { emergencyActions } from '../../../src/app/store/slices/emergencySlice';

export class EmergencyMock {
  private contactCount = 0;

  generateContact(overrides?: { id?: string; name?: string; phone?: string }): {
    id: string; name: string; phone: string;
  } {
    this.contactCount++;
    return {
      id: `contact_${this.contactCount}`,
      name: `Test Contact ${this.contactCount}`,
      phone: `+1555${String(1000 + this.contactCount).slice(1)}`,
      ...overrides,
    };
  }

  triggerEmergency(): void {
    eventBus.publish(EVENTS.EMERGENCY_TRIGGERED, {}, 'critical');
  }

  cancelEmergency(): void {
    eventBus.publish(EVENTS.EMERGENCY_CANCELLED, {}, 'high');
  }

  simulateCountdown(): void {
    eventBus.publish(EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_STARTED, {
      duration: 10000,
      startedAt: Date.now(),
    }, 'critical');
  }

  simulateCountdownTick(remaining: number): void {
    eventBus.publish(EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_TICK, {
      remaining,
      elapsed: 10000 - remaining,
    }, 'high');
  }

  simulateSendSuccess(contactId: string): void {
    eventBus.publish(EMERGENCY_EVENTS.EMERGENCY_SEND_SUCCESS, {
      contactId,
      method: 'sms',
    }, 'normal');
  }

  simulateSendFailed(contactId: string, error: string): void {
    eventBus.publish(EMERGENCY_EVENTS.EMERGENCY_SEND_FAILED, {
      contactId,
      error,
      method: 'sms',
    }, 'high');
  }

  simulateEscalation(attempt: number): void {
    eventBus.publish(EMERGENCY_EVENTS.EMERGENCY_ESCALATED, {
      attempt,
      timestamp: Date.now(),
    }, 'critical');
  }

  simulateResolved(): void {
    eventBus.publish(EMERGENCY_EVENTS.EMERGENCY_RESOLVED, {
      resolvedAt: Date.now(),
      duration: 30000,
    }, 'high');
  }

  dispatchTriggerEmergency(): void {
    store.dispatch(emergencyActions.triggerEmergency({}));
  }

  dispatchCancelEmergency(): void {
    store.dispatch(emergencyActions.cancelEmergency());
  }

  get contactsGenerated(): number {
    return this.contactCount;
  }

  reset(): void {
    this.contactCount = 0;
  }
}
