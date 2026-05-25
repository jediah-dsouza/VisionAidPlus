import { AlertDeduplicationLayer } from '../../src/core/analytics/AlertDeduplicationLayer';
import type { AlertRecord } from '../../src/core/analytics/types';

function makeAlert(overrides?: Partial<AlertRecord>): AlertRecord {
  return {
    id: `alert_${Math.random()}`,
    timestamp: Date.now(),
    category: 'safety',
    severity: 'warning',
    priority: 'normal',
    source: 'system',
    detectionType: null,
    title: 'test alert',
    description: '',
    status: 'active',
    acknowledgedAt: null,
    resolvedAt: null,
    duration: null,
    dedupGroup: 'group-1',
    sequence: 1,
    metadata: {},
    ...overrides,
  };
}

describe('AlertDeduplicationLayer', () => {
  let dedup: AlertDeduplicationLayer;

  beforeEach(() => {
    dedup = new AlertDeduplicationLayer({ windowMs: 3000 });
  });

  afterEach(() => {
    dedup.destroy();
  });

  it('isDuplicate returns false for unseen group', () => {
    expect(dedup.isDuplicate(makeAlert())).toBe(false);
  });

  it('isDuplicate returns true for duplicate within window', () => {
    const alert = makeAlert({ dedupGroup: 'g1' });
    dedup.register(alert);
    expect(dedup.isDuplicate(makeAlert({ dedupGroup: 'g1', timestamp: Date.now() + 100 }))).toBe(true);
  });

  it('isDuplicate returns false after window expires', () => {
    const alert = makeAlert({ dedupGroup: 'g1', timestamp: Date.now() - 5000 });
    dedup.register(alert);
    expect(dedup.isDuplicate(makeAlert({ dedupGroup: 'g1', timestamp: Date.now() }))).toBe(false);
  });

  it('register suppresses second registration within window', () => {
    const a1 = makeAlert({ dedupGroup: 'g1' });
    const a2 = makeAlert({ dedupGroup: 'g1', timestamp: Date.now() + 100 });
    dedup.register(a1);
    expect(() => dedup.register(a2)).not.toThrow();
    expect(dedup.getMapSize()).toBe(1);
  });

  it('clear resets dedup map', () => {
    dedup.register(makeAlert({ dedupGroup: 'g1' }));
    dedup.clear();
    expect(dedup.getMapSize()).toBe(0);
  });

  it('returns false after destroy', () => {
    dedup.destroy();
    expect(dedup.isDuplicate(makeAlert())).toBe(false);
  });
});
