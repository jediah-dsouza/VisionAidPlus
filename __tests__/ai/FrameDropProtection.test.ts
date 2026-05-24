import { FrameDropProtection } from '../../src/core/camera/FrameDropProtection';

jest.mock('../../src/core/debug', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe('FrameDropProtection', () => {
  let protection: FrameDropProtection;

  beforeEach(() => {
    jest.useFakeTimers();
    protection = new FrameDropProtection();
  });

  afterEach(() => {
    protection.destroy();
    jest.useRealTimers();
  });

  it('starts with no drops', () => {
    expect(protection.getTotalDrops()).toBe(0);
    expect(protection.getConsecutiveDrops()).toBe(0);
    expect(protection.isStarving()).toBe(false);
  });

  it('tracks consecutive drops', () => {
    protection.recordDrop();
    protection.recordDrop();
    protection.recordDrop();
    expect(protection.getConsecutiveDrops()).toBe(3);
    expect(protection.getTotalDrops()).toBe(3);
  });

  it('recordProcessed resets consecutive drops', () => {
    protection.recordDrop();
    protection.recordDrop();
    protection.recordProcessed();
    expect(protection.getConsecutiveDrops()).toBe(0);
  });

  it('isStarving returns true when >30 drops in 5s', () => {
    for (let i = 0; i < 31; i++) {
      protection.recordDrop();
    }
    expect(protection.isStarving()).toBe(true);
  });

  it('isStarving returns false when drops are old', () => {
    for (let i = 0; i < 31; i++) {
      protection.recordDrop();
    }
    jest.advanceTimersByTime(6000);
    expect(protection.isStarving()).toBe(false);
  });

  it('getDropRate returns drops per second', () => {
    for (let i = 0; i < 10; i++) {
      protection.recordDrop();
    }
    expect(protection.getDropRate(5000)).toBeCloseTo(2, 0);
  });

  it('reset clears all metrics', () => {
    protection.recordDrop();
    protection.recordDrop();
    protection.reset();
    expect(protection.getTotalDrops()).toBe(0);
    expect(protection.getConsecutiveDrops()).toBe(0);
  });

  it('destroy prevents recording', () => {
    protection.destroy();
    protection.recordDrop();
    expect(protection.getTotalDrops()).toBe(0);
  });
});
