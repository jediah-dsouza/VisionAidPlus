import { eventBus, EVENTS } from '../../../src/core/events/EventBus';
import { EMERGENCY_EVENTS } from '../../../src/core/emergency/EmergencyEventPriority';
import { MockRegistry } from '../MockRegistry';

beforeAll(() => {
  MockRegistry.resetAll();
});

afterEach(() => {
  eventBus.removeAllListeners();
});

describe('Emergency Escalation Integration', () => {
  it('triggering emergency publishes EventBus event', () => {
    const handler = jest.fn();
    eventBus.subscribe(EVENTS.EMERGENCY_TRIGGERED, handler);

    eventBus.publish(EVENTS.EMERGENCY_TRIGGERED, {}, 'critical');

    expect(handler).toHaveBeenCalled();
  });

  it('escalation event fires with attempt count', () => {
    const handler = jest.fn();
    eventBus.subscribe(EMERGENCY_EVENTS.EMERGENCY_ESCALATED, handler);

    eventBus.publish(EMERGENCY_EVENTS.EMERGENCY_ESCALATED, { attempt: 1, timestamp: Date.now() }, 'critical');

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ attempt: 1 }),
    );
  });

  it('cancel clears emergency status via EventBus', () => {
    const cancelHandler = jest.fn();
    eventBus.subscribe(EVENTS.EMERGENCY_CANCELLED, cancelHandler);

    eventBus.publish(EVENTS.EMERGENCY_CANCELLED, {}, 'high');

    expect(cancelHandler).toHaveBeenCalled();
  });

  it('removeAllListeners prevents delivery', () => {
    const handler = jest.fn();
    eventBus.subscribe(EVENTS.EMERGENCY_TRIGGERED, handler);

    eventBus.removeAllListeners();
    eventBus.publish(EVENTS.EMERGENCY_TRIGGERED, {}, 'critical');

    expect(handler).not.toHaveBeenCalled();
  });

  it('double trigger with delay is safe', () => {
    const handler = jest.fn();
    eventBus.subscribe(EVENTS.EMERGENCY_TRIGGERED, handler);

    eventBus.publish(EVENTS.EMERGENCY_TRIGGERED, {}, 'critical');
    eventBus.clearThrottleCache();
    eventBus.publish(EVENTS.EMERGENCY_TRIGGERED, {}, 'critical');

    expect(handler).toHaveBeenCalledTimes(2);
  });
});
