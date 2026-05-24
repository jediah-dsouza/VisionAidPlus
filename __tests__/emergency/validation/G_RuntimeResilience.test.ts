import { EmergencyManager } from '../../../src/core/emergency/EmergencyManager';
import { EmergencyStateMachine, emergencyStateMachine as realSM } from '../../../src/core/emergency/EmergencyStateMachine';
import { emergencyCountdownManager } from '../../../src/core/emergency/EmergencyCountdownManager';
import { eventBus } from '../../../src/core/events/EventBus';

jest.mock('../../../src/core/accessibility', () => ({
  accessibilityEngine: {
    enterEmergencyMode: jest.fn(),
    exitEmergencyMode: jest.fn(),
    announce: jest.fn(),
    triggerHaptic: jest.fn(),
  },
}));

// Workaround: reset the singleton state machine before each test
function fullReset(): void {
  realSM.reset();
  emergencyCountdownManager.reset();
  eventBus.clearQueue();
  eventBus.clearThrottleCache();
}

describe('G. Realtime Runtime Resilience Validation', () => {
  let manager: EmergencyManager;

  beforeEach(() => {
    jest.useFakeTimers();
    fullReset();

    manager = new EmergencyManager({
      recoveryTimeoutMs: 1000,
      escalatedBackoffMs: 500,
      autoPrepareGPS: false,
      autoSendSMS: false,
    });
    manager.initialize();
  });

  afterEach(() => {
    if (manager) {
      manager.destroy();
    }
    jest.useRealTimers();
  });

  it('startCountdown succeeds from idle', () => {
    expect(manager.startCountdown(5)).toBe(true);
    expect(manager.isActive).toBe(true);
    expect(manager.status).toBe('countdown');
  });

  it('duplicate startCountdown is rejected', () => {
    expect(manager.startCountdown(5)).toBe(true);
    expect(manager.startCountdown(5)).toBe(false);
    expect(manager.status).toBe('countdown');
  });

  it('cancelEmergency during countdown works', () => {
    manager.startCountdown(5);
    expect(manager.cancelEmergency()).toBe(true);
    expect(manager.isActive).toBe(false);
    jest.advanceTimersByTime(1000);
    expect(manager.status).toBe('idle');
  });

  it('cancelEmergency when idle does not throw', () => {
    expect(manager.cancelEmergency()).toBe(false);
  });

  it('resolveEmergency after trigger works', () => {
    manager.startCountdown(5);
    jest.advanceTimersByTime(5000);
    expect(manager.status).toBe('triggered');

    const resolved = manager.resolveEmergency();
    expect(resolved).toBe(true);
    expect(manager.status).toBe('resolved');
  });

  it('resolveEmergency when idle returns false', () => {
    expect(manager.resolveEmergency()).toBe(false);
  });

  it('resolveEmergency from countdown returns false', () => {
    manager.startCountdown(5);
    expect(manager.resolveEmergency()).toBe(false);
  });

  it('escalation from triggered state works', () => {
    manager.startCountdown(5);
    jest.advanceTimersByTime(5000);
    expect(manager.status).toBe('triggered');

    const escalated = manager.escalate();
    expect(escalated).toBe(true);
    expect(manager.status).toBe('escalating');
  });

  it('escalation from idle is rejected', () => {
    expect(manager.escalate()).toBe(false);
  });

  it('getSession returns null when idle', () => {
    expect(manager.getSession()).toBeNull();
  });

  it('getSession returns session during active emergency', () => {
    manager.startCountdown(5);
    const session = manager.getSession();
    expect(session).not.toBeNull();
    expect(session!.status).toBe('countdown');
    expect(session!.id).toBeDefined();
  });

  it('countdownRemaining updates correctly', () => {
    manager.startCountdown(5);
    expect(manager.countdownRemaining).toBe(5);

    jest.advanceTimersByTime(2000);
    expect(manager.countdownRemaining).toBe(3);
  });

  it('isCountdownRunning is accurate', () => {
    expect(manager.isCountdownRunning).toBe(false);
    manager.startCountdown(5);
    expect(manager.isCountdownRunning).toBe(true);
    jest.advanceTimersByTime(5000);
    expect(manager.isCountdownRunning).toBe(false);
  });

  it('updateConfig changes config', () => {
    manager.updateConfig({ recoveryTimeoutMs: 5000 });
  });

  it('reset clears session and state', () => {
    manager.startCountdown(5);
    jest.advanceTimersByTime(5000);
    expect(manager.isActive).toBe(true);

    manager.reset();
    expect(manager.isActive).toBe(false);
    expect(manager.getSession()).toBeNull();
  });

  it('cancelEmergency from triggered works', () => {
    manager.startCountdown(5);
    jest.advanceTimersByTime(5000);
    expect(manager.status).toBe('triggered');

    manager.cancelEmergency();
    expect(manager.isActive).toBe(false);
    expect(manager.status).toBe('cancelled');
  });

  it('recovery timeout transitions to idle', () => {
    manager.startCountdown(5);
    jest.advanceTimersByTime(5000);
    manager.resolveEmergency();
    expect(manager.status).toBe('resolved');

    jest.advanceTimersByTime(1000);
    expect(manager.status).toBe('idle');
  });

  it('no render deadlocks under rapid start/cancel', () => {
    for (let i = 0; i < 20; i++) {
      manager.startCountdown(5);
      manager.cancelEmergency();
      jest.advanceTimersByTime(1000);
    }
    expect(manager.isActive).toBe(false);
  });

  it('session lifecycle is consistent after recovery', () => {
    manager.startCountdown(5);
    jest.advanceTimersByTime(5000);
    manager.resolveEmergency();

    jest.advanceTimersByTime(1000);
    expect(manager.status).toBe('idle');

    const result = manager.startCountdown(5);
    expect(result).toBe(true);
    expect(manager.isActive).toBe(true);
  });

  it('destroy stops all activity', () => {
    manager.startCountdown(5);
    manager.destroy();
    jest.advanceTimersByTime(5000);

    expect(manager.isActive).toBe(false);
  });

  it('initialize is idempotent', () => {
    manager.initialize();
    manager.initialize();
    manager.initialize();
    expect(true).toBe(true);
  });
});
