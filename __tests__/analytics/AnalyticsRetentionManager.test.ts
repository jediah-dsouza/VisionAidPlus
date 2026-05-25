import { AnalyticsRetentionManager } from '../../src/core/analytics/AnalyticsRetentionManager';
import { HistoricalEventIndexer } from '../../src/core/analytics/HistoricalEventIndexer';
import type { AnalyticsEvent } from '../../src/core/analytics/types';

function makeEvent(ts: number, overrides?: Partial<AnalyticsEvent>): AnalyticsEvent {
  return {
    id: `evt_${Math.random()}`,
    timestamp: ts,
    category: 'safety',
    severity: 'info',
    source: 'system',
    eventType: 'test',
    sessionId: 's1',
    sequence: 1,
    payload: {},
    ...overrides,
  };
}

describe('AnalyticsRetentionManager', () => {
  let indexer: HistoricalEventIndexer;
  let retention: AnalyticsRetentionManager;

  beforeEach(() => {
    indexer = new HistoricalEventIndexer();
  });

  afterEach(() => {
    retention.destroy();
    indexer.destroy();
  });

  it('prunes old events based on alert TTL', () => {
    const now = Date.now();
    indexer.append(makeEvent(now - 10000));
    indexer.append(makeEvent(now));
    retention = new AnalyticsRetentionManager(indexer, { alertTtlMs: 5000 });
    expect(indexer.getCount()).toBe(1);
  });

  it('setCustomTtl overrides per-category TTL', () => {
    const now = Date.now();
    indexer.append(makeEvent(now - 200));
    retention = new AnalyticsRetentionManager(indexer, { alertTtlMs: 100000 });
    retention.setCustomTtl('safety', 100);
    const pruned = retention.prune();
    expect(pruned).toBe(1);
  });

  it('pins alerts to prevent pruning', () => {
    const now = Date.now();
    retention = new AnalyticsRetentionManager(indexer, { alertTtlMs: 100000 });
    indexer.append(makeEvent(now - 10000));
    const oldEvent = indexer.query(() => true)[0];
    retention.pinAlert(oldEvent.id);
    retention.setCustomTtl('safety', 100);
    retention.prune();
    expect(indexer.getCount()).toBe(1);
  });

  it('unpinAlert removes pin', () => {
    const now = Date.now();
    retention = new AnalyticsRetentionManager(indexer, { alertTtlMs: 100000 });
    indexer.append(makeEvent(now - 10000));
    const oldEvent = indexer.query(() => true)[0];
    retention.pinAlert(oldEvent.id);
    retention.unpinAlert(oldEvent.id);
    retention.setCustomTtl('safety', 100);
    retention.prune();
    expect(indexer.getCount()).toBe(0);
  });

  it('starts auto-prune timer on construction', () => {
    retention = new AnalyticsRetentionManager(indexer);
    expect((retention as any).pruneTimer).not.toBeNull();
  });

  it('destroy clears timers', () => {
    retention = new AnalyticsRetentionManager(indexer);
    retention.destroy();
    expect((retention as any).destroyed).toBe(true);
  });
});
