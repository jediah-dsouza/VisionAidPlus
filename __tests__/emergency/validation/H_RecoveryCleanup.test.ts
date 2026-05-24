import { EmergencyStateMachine, emergencyStateMachine } from '../../../src/core/emergency/EmergencyStateMachine';
import { EmergencyCountdownManager, emergencyCountdownManager } from '../../../src/core/emergency/EmergencyCountdownManager';
import { EmergencyManager } from '../../../src/core/emergency/EmergencyManager';
import { emergencyEventPriorityManager, EMERGENCY_EVENTS } from '../../../src/core/emergency/EmergencyEventPriority';
import { eventBus } from '../../../src/core/events/EventBus';

jest.mock('../../../src/core/accessibility', () => ({
  accessibilityEngine: {
    enterEmergencyMode: jest.fn(),
    exitEmergencyMode: jest.fn(),
    announce: jest.fn(),
    triggerHaptic: jest.fn(),
    isEmergencyMode: jest.fn().mockReturnValue(false),
  },
}));

const getBaselineSubscriptionCount = (): number => {
  const subs = (eventBus as any).subscriptions;
  return subs ? subs.size : 0;
};

describe('H. Recovery & Cleanup Validation', () => {
  let sm: EmergencyStateMachine;
  let countdown: EmergencyCountdownManager;
  let manager: EmergencyManager;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    emergencyStateMachine.reset();
    emergencyCountdownManager.reset();
    eventBus.clearQueue();
    eventBus.clearThrottleCache();
    emergencyEventPriorityManager.clearLog();

    sm = new EmergencyStateMachine();
    countdown = new EmergencyCountdownManager({ defaultDuration: 5 });
    manager = new EmergencyManager({
      recoveryTimeoutMs: 1000,
      autoPrepareGPS: false,
      autoSendSMS: false,
    });
    manager.initialize();
  });

  afterEach(() => {
    sm.destroy();
    countdown.destroy();
    manager.destroy();
    emergencyStateMachine.reset();
    emergencyCountdownManager.reset();
    jest.useRealTimers();
  });

  it('resolved→idle recovery timeout transitions correctly', () => {
    manager.startCountdown(5);
    jest.advanceTimersByTime(5000);
    expect(manager.status).toBe('triggered');

    manager.resolveEmergency();
    expect(manager.status).toBe('resolved');

    jest.advanceTimersByTime(1000);
    expect(manager.status).toBe('idle');
  });

  it('cancelled→idle recovery timeout transitions correctly', () => {
    manager.startCountdown(5);
    expect(manager.cancelEmergency()).toBe(true);
    expect(manager.status).toBe('cancelled');

    jest.advanceTimersByTime(1000);
    expect(manager.status).toBe('idle');
  });

  it('listener cleanup — no orphaned listeners after destroy', () => {
    const onEnter = jest.fn();
    const remove = sm.addListener({ onEnter });

    expect((sm as any).listeners.length).toBe(1);

    sm.destroy();
    expect((sm as any).listeners.length).toBe(0);
    expect(onEnter).not.toHaveBeenCalled();
  });

  it('timer cleanup — no orphaned countdown timers after destroy', () => {
    countdown.start(5);
    expect(countdown.isRunning).toBe(true);

    countdown.destroy();
    jest.advanceTimersByTime(10000);

    expect(countdown.isRunning).toBe(false);
    expect(countdown.remaining).toBe(0);
  });

  it('retry cleanup — no pending retries after destroy', () => {
    emergencyEventPriorityManager.publish(
      EMERGENCY_EVENTS.EMERGENCY_TRIGGERED,
      { triggeredAt: Date.now(), fromCountdown: true },
    );

    emergencyEventPriorityManager.destroy();
    expect(emergencyEventPriorityManager.getDeliveryLog().length).toBe(0);
  });

  it('EventBus unsubscription correctness', () => {
    const handler = jest.fn();
    const unsubscribe = eventBus.subscribe('TEST_EVENT', handler, 'high');
    unsubscribe();

    eventBus.publish('TEST_EVENT', { data: 'test' }, 'high');
    expect(handler).not.toHaveBeenCalled();
  });

  it('stale emergency session cleanup — reset clears all', () => {
    manager.startCountdown(5);
    jest.advanceTimersByTime(5000);

    const sessionBefore = manager.getSession();
    expect(sessionBefore).not.toBeNull();

    manager.reset();

    const sessionAfter = manager.getSession();
    expect(sessionAfter).toBeNull();
    expect(manager.isActive).toBe(false);
  });

  it('memory leak prevention — repeated cycles do not accumulate listeners', () => {
    const baseline = getBaselineSubscriptionCount();

    for (let cycle = 0; cycle < 10; cycle++) {
      const handler = jest.fn();
      const unsub = eventBus.subscribe('CYCLE_EVENT', handler, 'normal');
      eventBus.publish('CYCLE_EVENT', { cycle }, 'normal');
      unsub();
    }

    const after = getBaselineSubscriptionCount();
    expect(after).toBe(baseline);
  });

  it('state machine listener cleanup on remove', () => {
    const listener = { onEnter: jest.fn() };
    const remove = sm.addListener(listener);

    sm.send('START_COUNTDOWN');
    expect(listener.onEnter).toHaveBeenCalledTimes(1);

    remove();
    listener.onEnter.mockClear();

    sm.send('CANCEL_EMERGENCY');
    expect(listener.onEnter).not.toHaveBeenCalled();
  });

  it('state machine removeAllListeners works', () => {
    sm.addListener({ onEnter: jest.fn(), onExit: jest.fn() });
    sm.addListener({ onEnter: jest.fn(), onExit: jest.fn() });

    sm.removeAllListeners();
    expect((sm as any).listeners.length).toBe(0);
  });

  it('countdown manager removeAllListeners works', () => {
    countdown.addListener({ onTick: jest.fn() });
    countdown.addListener({ onTick: jest.fn() });

    countdown.removeAllListeners();
    expect((countdown as any).listeners.length).toBe(0);
  });

  it('transition log bounded at 50 entries', () => {
    const stateMachine = new EmergencyStateMachine();
    for (let i = 0; i < 100; i++) {
      stateMachine.send('START_COUNTDOWN');
      stateMachine.send('CANCEL_EMERGENCY');
      stateMachine.send('FORCE_RESET');
    }
    expect(stateMachine.transitionHistory.length).toBeLessThanOrEqual(50);
    stateMachine.destroy();
  });
});
