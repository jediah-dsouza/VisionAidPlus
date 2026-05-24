import { eventBus, EVENTS, EventPriority } from '../../../src/core/events/EventBus';
import {
  emergencyEventPriorityManager,
  EMERGENCY_EVENTS,
} from '../../../src/core/emergency/EmergencyEventPriority';

describe('B. EventBus Emergency Priority Validation', () => {
  beforeEach(() => {
    eventBus.clearQueue();
    eventBus.clearThrottleCache();
    emergencyEventPriorityManager.clearLog();
  });

  it('emergency events have reasonable priority distribution', () => {
    const emergencyEvents = Object.values(EMERGENCY_EVENTS);
    const allPriorities = emergencyEvents.map(evt => emergencyEventPriorityManager.getPriority(evt));
    const validPriorities: EventPriority[] = ['critical', 'high', 'normal', 'low'];
    expect(allPriorities.every(p => validPriorities.includes(p))).toBe(true);
  });

  it('packet flood during emergency does not drop emergency events', () => {
    const emergencyHandler = jest.fn();
    const normalHandler = jest.fn();

    const unsubEmergency = eventBus.subscribe(
      EMERGENCY_EVENTS.EMERGENCY_TRIGGERED, emergencyHandler, 'critical',
    );
    const unsubNormal = eventBus.subscribe('BLE_PACKET', normalHandler, 'low');

    for (let i = 0; i < 500; i++) {
      eventBus.publish('BLE_PACKET', { id: i }, 'low');
    }

    emergencyEventPriorityManager.publish(
      EMERGENCY_EVENTS.EMERGENCY_TRIGGERED,
      { triggeredAt: Date.now(), fromCountdown: true },
    );

    expect(emergencyHandler).toHaveBeenCalled();
    unsubEmergency();
    unsubNormal();
  });

  it('BLE reconnect storm during emergency does not delay emergency events', () => {
    const emergencyHandler = jest.fn();
    const reconnectHandler = jest.fn();

    const unsubEmerg = eventBus.subscribe(
      EMERGENCY_EVENTS.EMERGENCY_SENDING, emergencyHandler, 'critical',
    );
    const unsubRecon = eventBus.subscribe(
      EVENTS.BLE_DEVICE_RECONNECTING, reconnectHandler, 'high',
    );

    for (let i = 0; i < 200; i++) {
      eventBus.publish(EVENTS.BLE_DEVICE_RECONNECTING, {
        deviceId: `dev-${i}`, attempt: i, maxAttempts: 5,
      }, 'high');
    }

    emergencyEventPriorityManager.publish(
      EMERGENCY_EVENTS.EMERGENCY_SENDING,
      { contactCount: 3, timestamp: Date.now() },
    );

    expect(emergencyHandler).toHaveBeenCalled();
    unsubEmerg();
    unsubRecon();
  });

  it('dashboard event flood during escalation does not drop escalation', () => {
    const escalationHandler = jest.fn();
    const aiHandler = jest.fn();

    const unsubEsc = eventBus.subscribe(
      EMERGENCY_EVENTS.EMERGENCY_ESCALATED, escalationHandler, 'critical',
    );
    const unsubAI = eventBus.subscribe(EVENTS.AI_OBSTACLE_DETECTED, aiHandler, 'normal');

    for (let i = 0; i < 300; i++) {
      eventBus.publish(EVENTS.AI_OBSTACLE_DETECTED, {
        type: 'person', distance: 50, direction: 'left',
        severity: 'caution', voiceInstruction: 'step left', timestamp: new Date().toISOString(),
      }, 'normal');
    }

    emergencyEventPriorityManager.publish(
      EMERGENCY_EVENTS.EMERGENCY_ESCALATED,
      { attempt: 1, timestamp: Date.now() },
    );

    expect(escalationHandler).toHaveBeenCalled();
    unsubEsc();
    unsubAI();
  });

  it('simultaneous high-frequency telemetry + emergency trigger', () => {
    const emergencyHandler = jest.fn();
    const signalHandler = jest.fn();
    const batteryHandler = jest.fn();

    const unsub1 = eventBus.subscribe(EMERGENCY_EVENTS.EMERGENCY_TRIGGERED, emergencyHandler, 'critical');
    const unsub2 = eventBus.subscribe(EVENTS.BLE_SIGNAL_WEAK, signalHandler, 'high');
    const unsub3 = eventBus.subscribe(EVENTS.LOW_BATTERY_WARNING, batteryHandler, 'high');

    for (let i = 0; i < 100; i++) {
      eventBus.publish(EVENTS.BLE_SIGNAL_WEAK, { rssi: -90 }, 'high');
      eventBus.publish(EVENTS.LOW_BATTERY_WARNING, { level: 15 }, 'high');
    }

    emergencyEventPriorityManager.publish(
      EMERGENCY_EVENTS.EMERGENCY_TRIGGERED,
      { triggeredAt: Date.now(), fromCountdown: false },
    );

    expect(emergencyHandler).toHaveBeenCalledTimes(1);
    unsub1();
    unsub2();
    unsub3();
  });

  it('EventBus queue does not overflow under congestion', () => {
    for (let i = 0; i < 500; i++) {
      eventBus.publish('LOW_PRIORITY_EVENT', { i }, 'low');
    }

    const queue = eventBus.getQueue();
    expect(queue.length).toBeLessThanOrEqual(100);

    eventBus.clearQueue();
  });

  it('emergency announcements arrive even when EventBus queue is full', () => {
    for (let i = 0; i < 200; i++) {
      eventBus.publish('SPAM', { i }, 'low');
    }

    const handler = jest.fn();
    const unsub = eventBus.subscribe(
      EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_STARTED, handler, 'critical',
    );

    emergencyEventPriorityManager.publish(
      EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_STARTED,
      { duration: 5, startedAt: Date.now() },
    );

    expect(handler).toHaveBeenCalled();
    unsub();
  });

  it('EventBus clearThrottleCache allows re-publish of throttled events', () => {
    const handler = jest.fn();
    const unsub = eventBus.subscribe('TEST_EVENT', handler, 'normal');

    eventBus.publish('TEST_EVENT', { n: 1 }, 'normal');
    eventBus.publish('TEST_EVENT', { n: 2 }, 'normal');

    const callsAfterThrottle = handler.mock.calls.length;

    eventBus.clearThrottleCache();

    eventBus.publish('TEST_EVENT', { n: 3 }, 'normal');
    expect(handler.mock.calls.length).toBe(callsAfterThrottle + 1);

    unsub();
  });

  it('delivery log tracks all emergency events', () => {
    const events = [
      EMERGENCY_EVENTS.EMERGENCY_TRIGGERED,
      EMERGENCY_EVENTS.EMERGENCY_SENDING,
      EMERGENCY_EVENTS.EMERGENCY_RESOLVED,
      EMERGENCY_EVENTS.EMERGENCY_CANCELLED,
    ];

    for (const evt of events) {
      emergencyEventPriorityManager.publish(evt as any, { timestamp: Date.now() } as any);
    }

    const log = emergencyEventPriorityManager.getDeliveryLog();
    expect(log.length).toBeGreaterThanOrEqual(4);
    expect(log.every(entry => entry.delivered)).toBe(true);
  });

  it('no dropped emergency events under congestion', () => {
    const handler = jest.fn();
    const unsub = eventBus.subscribe(
      EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_TICK, handler, 'high',
    );

    for (let i = 0; i < 100; i++) {
      eventBus.publish('NOISE', { i }, 'low');
    }

    emergencyEventPriorityManager.publish(
      EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_TICK,
      { remaining: 3, elapsed: 2000 },
    );

    expect(handler).toHaveBeenCalled();
    unsub();
  });
});
