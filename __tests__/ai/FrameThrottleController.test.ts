import { FrameThrottleController } from '../../src/core/camera/FrameThrottleController';

jest.mock('../../src/core/debug', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe('FrameThrottleController', () => {
  let throttle: FrameThrottleController;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    throttle = new FrameThrottleController(10);
  });

  afterEach(() => {
    throttle.destroy();
    jest.useRealTimers();
  });

  it('allows first frame', () => {
    expect(throttle.shouldProcess()).toBe(true);
  });

  it('denies frame within interval', () => {
    throttle.shouldProcess();
    throttle.recordProcessed();
    jest.advanceTimersByTime(50);
    expect(throttle.shouldProcess()).toBe(false);
  });

  it('allows frame after interval passes', () => {
    throttle.shouldProcess();
    throttle.recordProcessed();
    jest.advanceTimersByTime(150);
    expect(throttle.shouldProcess()).toBe(true);
  });

  it('caps target fps at 60', () => {
    const fastThrottle = new FrameThrottleController(120);
    expect(fastThrottle.getTargetFps()).toBe(60);
    fastThrottle.destroy();
  });

  it('tracks processed and dropped counts', () => {
    throttle.shouldProcess();
    throttle.recordProcessed();
    throttle.shouldProcess();
    expect(throttle.getEffectiveFps()).toBeDefined();
    expect(throttle.getDropRate()).toBeGreaterThan(0);
  });

  it('reset clears counters', () => {
    throttle.shouldProcess();
    throttle.recordProcessed();
    throttle.reset();
    expect(throttle.getDropRate()).toBe(0);
  });

  it('destroy prevents processing', () => {
    throttle.destroy();
    expect(throttle.shouldProcess()).toBe(false);
  });
});
