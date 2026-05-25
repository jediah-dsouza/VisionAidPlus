import { AnalyticsMemoryProtection } from '../../src/core/analytics/AnalyticsMemoryProtection';

describe('AnalyticsMemoryProtection', () => {
  let mem: AnalyticsMemoryProtection;

  beforeEach(() => {
    mem = new AnalyticsMemoryProtection(100000);
  });

  afterEach(() => {
    mem.destroy();
  });

  it('starts with no engines', () => {
    expect(mem.getGlobalUsage()).toBe(0);
    expect(mem.getEnginesOverBudget()).toEqual([]);
  });

  it('registers engine with budget', () => {
    mem.registerEngine('test_engine', 50000);
    expect(mem.getBudget('test_engine')).toBe(50000);
  });

  it('updates usage and tracks global total', () => {
    mem.registerEngine('e1', 10000);
    mem.registerEngine('e2', 10000);
    mem.updateUsage('e1', 3000);
    mem.updateUsage('e2', 5000);
    expect(mem.getGlobalUsage()).toBe(8000);
  });

  it('detects over-budget engines', () => {
    mem.registerEngine('e1', 1000);
    mem.updateUsage('e1', 2000);
    expect(mem.isOverBudget('e1')).toBe(true);
    expect(mem.getEnginesOverBudget()).toEqual(['e1']);
  });

  it('calls onPrune when engine exceeds budget', () => {
    const onPrune = jest.fn();
    mem.onPrune = onPrune;
    mem.registerEngine('e1', 1000);
    mem.updateUsage('e1', 2000);
    expect(onPrune).toHaveBeenCalledWith('e1', 1000);
  });

  it('warns for unknown engine but does not throw', () => {
    expect(() => mem.updateUsage('unknown', 1000)).not.toThrow();
  });

  it('prune() triggers onPrune for over-budget engines', () => {
    const onPrune = jest.fn();
    mem.onPrune = onPrune;
    mem.registerEngine('e1', 1000);
    mem.registerEngine('e2', 5000);
    mem.updateUsage('e1', 2000);
    mem.updateUsage('e2', 3000);
    mem.prune();
    expect(onPrune).toHaveBeenCalledWith('e1', 1000);
    expect(onPrune).not.toHaveBeenCalledWith('e2', expect.any(Number));
  });

  it('prune() does nothing when under global budget', () => {
    const onPrune = jest.fn();
    mem.onPrune = onPrune;
    mem.registerEngine('e1', 5000);
    mem.updateUsage('e1', 1000);
    mem.prune();
    expect(onPrune).not.toHaveBeenCalled();
  });

  it('updates budget for re-registered engine', () => {
    mem.registerEngine('e1', 1000);
    mem.registerEngine('e1', 5000);
    expect(mem.getBudget('e1')).toBe(5000);
  });

  it('destroy clears all state', () => {
    mem.registerEngine('e1', 1000);
    mem.updateUsage('e1', 500);
    mem.destroy();
    expect(mem.getGlobalUsage()).toBe(0);
    expect(mem.getEnginesOverBudget()).toEqual([]);
  });

  it('returns undefined for non-existent engine budget/usage', () => {
    expect(mem.getBudget('nonexistent')).toBeUndefined();
    expect(mem.getUsage('nonexistent')).toBeUndefined();
  });
});
