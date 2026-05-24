import { EmergencyCountdownManager, emergencyCountdownManager } from '../../../src/core/emergency/EmergencyCountdownManager';
import { emergencyStateMachine } from '../../../src/core/emergency/EmergencyStateMachine';

jest.mock('react-native', () => ({
  AccessibilityInfo: { announceForAccessibility: jest.fn() },
  Vibration: { vibrate: jest.fn(), cancel: jest.fn() },
  Platform: { OS: 'android' },
}));

jest.mock('../../../src/core/debug', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const flushPromises = () => new Promise(r => setImmediate(r));

describe('D. Countdown Lifecycle Validation', () => {
  let countdown: EmergencyCountdownManager;

  beforeEach(() => {
    emergencyStateMachine.reset();
    emergencyCountdownManager.reset();
    jest.useFakeTimers();
    countdown = new EmergencyCountdownManager({ defaultDuration: 5 });
  });

  afterEach(() => {
    countdown.destroy();
    emergencyStateMachine.reset();
    emergencyCountdownManager.reset();
    jest.useRealTimers();
  });

  it('pause/resume/cancel spam does not corrupt state', () => {
    countdown.start(5);

    for (let i = 0; i < 100; i++) {
      countdown.pause();
      countdown.resume();
      countdown.pause();
      countdown.cancel();
      countdown.start(5);
    }

    expect(countdown.isRunning).toBe(true);
    expect(countdown.remaining).toBe(5);
  });

  it('countdown completion — expired fires correctly', () => {
    const onExpired = jest.fn();
    const onTick = jest.fn();

    countdown.addListener({ onExpired, onTick });
    expect(countdown.start(2)).toBe(true);

    jest.advanceTimersByTime(1000);
    expect(onTick).toHaveBeenCalledWith(1);
    expect(countdown.remaining).toBe(1);

    jest.advanceTimersByTime(1000);
    expect(onTick).toHaveBeenCalledWith(0);
    expect(onExpired).toHaveBeenCalled();
    expect(countdown.isRunning).toBe(false);
  });

  it('background/foreground during countdown — pause/resume cycle', () => {
    const onPaused = jest.fn();
    const onResumed = jest.fn();

    countdown.addListener({ onPaused, onResumed });
    countdown.start(10);

    jest.advanceTimersByTime(2000);
    expect(countdown.remaining).toBe(8);

    countdown.pause();
    expect(onPaused).toHaveBeenCalledWith(8);
    expect(countdown.isPaused).toBe(true);

    jest.advanceTimersByTime(5000);
    expect(countdown.remaining).toBe(8);

    countdown.resume();
    expect(onResumed).toHaveBeenCalledWith(8);
    expect(countdown.isPaused).toBe(false);

    jest.advanceTimersByTime(3000);
    expect(countdown.remaining).toBe(5);
  });

  it('rapid trigger→cancel→trigger loops remain consistent', () => {
    for (let cycle = 0; cycle < 30; cycle++) {
      countdown.start(5);
      expect(countdown.isRunning).toBe(true);

      countdown.cancel();
      expect(countdown.isRunning).toBe(false);
    }

    expect(countdown.start(5)).toBe(true);
    expect(countdown.isRunning).toBe(true);
  });

  it('countdown timeout correctness — ticks at exact intervals', () => {
    const ticks: number[] = [];
    countdown.addListener({ onTick: (r: number) => ticks.push(r) });
    countdown.start(4);

    jest.advanceTimersByTime(1000);
    expect(ticks).toEqual([3]);
    expect(countdown.remaining).toBe(3);

    jest.advanceTimersByTime(1000);
    expect(ticks).toEqual([3, 2]);
    expect(countdown.remaining).toBe(2);

    jest.advanceTimersByTime(1000);
    expect(ticks).toEqual([3, 2, 1]);
    expect(countdown.remaining).toBe(1);

    jest.advanceTimersByTime(1000);
    expect(ticks).toEqual([3, 2, 1, 0]);
    expect(countdown.isRunning).toBe(false);
  });

  it('no double countdowns — second start returns false', () => {
    expect(countdown.start(5)).toBe(true);
    expect(countdown.isRunning).toBe(true);

    expect(countdown.start(5)).toBe(false);

    jest.advanceTimersByTime(3000);
    expect(countdown.remaining).toBe(2);
  });

  it('accurate timing lifecycle — elapsed tracks correctly', () => {
    countdown.start(10);
    jest.advanceTimersByTime(3000);

    const state = countdown.getState();
    expect(state.remaining).toBe(7);
    expect(state.elapsed).toBe(3);
    expect(state.total).toBe(10);
  });

  it('cleanup correctness — destroy stops timers', () => {
    countdown.start(5);
    jest.advanceTimersByTime(2000);

    countdown.destroy();
    jest.advanceTimersByTime(5000);

    expect(countdown.isRunning).toBe(false);
    expect(countdown.remaining).toBe(0);
  });

  it('cancellation reliability from countdown only', () => {
    expect(countdown.cancel()).toBe(false);

    countdown.start(5);
    expect(countdown.cancel()).toBe(true);
    expect(countdown.isRunning).toBe(false);

    expect(countdown.cancel()).toBe(false);
  });

  it('confirm triggers early emergency from countdown', () => {
    countdown.start(10);
    jest.advanceTimersByTime(2000);

    expect(countdown.confirm()).toBe(true);
    expect(countdown.isRunning).toBe(false);
  });

  it('setDuration clamps correctly', () => {
    countdown.setDuration(100);
    countdown.start();
    expect(countdown.getState().total).toBe(30);

    countdown.destroy();

    const c2 = new EmergencyCountdownManager({ minDuration: 3, maxDuration: 15, defaultDuration: 5 });
    expect(c2.getState().total).toBe(0);
    c2.destroy();
  });
});
