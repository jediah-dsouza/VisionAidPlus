import { AccessibilityPacingController } from '../../src/core/voice-assistant/AccessibilityPacingController';

describe('AccessibilityPacingController', () => {
  let pacing: AccessibilityPacingController;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    pacing = new AccessibilityPacingController({
      minGapBetweenMessages: 300,
      pacingMinIntervalMs: 1500,
      pacingMaxBurst: 3,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns 0 for first message', () => {
    expect(pacing.getNextInterval()).toBe(0);
  });

  it('returns small interval within burst limit', () => {
    pacing.getNextInterval();
    jest.advanceTimersByTime(100);
    const interval = pacing.getNextInterval();
    expect(interval).toBeGreaterThanOrEqual(200);
    expect(interval).toBeLessThanOrEqual(400);
  });

  it('returns min interval after burst limit', () => {
    pacing.getNextInterval();
    jest.advanceTimersByTime(100);
    pacing.getNextInterval();
    jest.advanceTimersByTime(100);
    pacing.getNextInterval();
    jest.advanceTimersByTime(100);

    const interval = pacing.getNextInterval();
    expect(interval).toBe(1500);
  });

  it('resets burst after 10 seconds', () => {
    pacing.getNextInterval();
    jest.advanceTimersByTime(100);
    pacing.getNextInterval();
    jest.advanceTimersByTime(100);
    pacing.getNextInterval();
    jest.advanceTimersByTime(100);

    jest.advanceTimersByTime(10000);
    const interval = pacing.getNextInterval();
    expect(interval).toBeLessThan(1500);
  });

  it('reset clears state', () => {
    pacing.getNextInterval();
    jest.advanceTimersByTime(100);
    pacing.getNextInterval();
    pacing.reset();
    expect(pacing.getNextInterval()).toBe(0);
  });
});
