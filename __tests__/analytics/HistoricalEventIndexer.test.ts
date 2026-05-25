import { HistoricalEventIndexer } from '../../src/core/analytics/HistoricalEventIndexer';
import type { AnalyticsEvent } from '../../src/core/analytics/types';

function makeEvent(overrides?: Partial<AnalyticsEvent>): AnalyticsEvent {
  return {
    id: `evt_${Math.random()}`,
    timestamp: Date.now(),
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

describe('HistoricalEventIndexer', () => {
  let indexer: HistoricalEventIndexer;

  beforeEach(() => {
    indexer = new HistoricalEventIndexer();
  });

  afterEach(() => {
    indexer.destroy();
  });

  it('starts empty', () => {
    expect(indexer.getCount()).toBe(0);
  });

  it('appends events and increments count', () => {
    indexer.append(makeEvent({ sequence: 1 }));
    indexer.append(makeEvent({ sequence: 2 }));
    expect(indexer.getCount()).toBe(2);
  });

  it('queries events from tail (most recent first)', () => {
    const e1 = makeEvent({ sequence: 1, eventType: 'a' });
    const e2 = makeEvent({ sequence: 2, eventType: 'b' });
    indexer.append(e1);
    indexer.append(e2);
    const results = indexer.query(() => true);
    expect(results).toHaveLength(2);
    expect(results[0].sequence).toBe(2);
    expect(results[1].sequence).toBe(1);
  });

  it('filters with predicate', () => {
    indexer.append(makeEvent({ eventType: 'a', category: 'safety' }));
    indexer.append(makeEvent({ eventType: 'b', category: 'obstacle' }));
    const results = indexer.query(e => e.category === 'obstacle');
    expect(results).toHaveLength(1);
    expect(results[0].eventType).toBe('b');
  });

  it('limits query results', () => {
    for (let i = 0; i < 10; i++) {
      indexer.append(makeEvent({ sequence: i }));
    }
    const results = indexer.query(() => true, 3);
    expect(results).toHaveLength(3);
  });

  it('removes older than timestamp', () => {
    const now = Date.now();
    const old = makeEvent({ sequence: 0, timestamp: now - 10000 });
    const recent = makeEvent({ sequence: 1, timestamp: now });
    indexer.append(old);
    indexer.append(recent);
    const removed = indexer.removeOlderThan(now - 5000);
    expect(removed).toBe(1);
    expect(indexer.getCount()).toBe(1);
  });

  it('evicts oldest when exceeding max entries', () => {
    for (let i = 0; i < 10001; i++) {
      indexer.append(makeEvent({ sequence: i, timestamp: Date.now() + i }));
    }
    expect(indexer.getCount()).toBe(10000);
  });

  it('clear removes all events', () => {
    indexer.append(makeEvent({ sequence: 1 }));
    indexer.clear();
    expect(indexer.getCount()).toBe(0);
  });

  it('does not append after destroy', () => {
    indexer.destroy();
    indexer.append(makeEvent({ sequence: 1 }));
    expect(indexer.getCount()).toBe(0);
  });

  it('returns empty for query after destroy', () => {
    indexer.destroy();
    expect(indexer.query(() => true)).toEqual([]);
  });

  it('removeOlderThan returns 0 when destroyed', () => {
    indexer.destroy();
    expect(indexer.removeOlderThan(Date.now())).toBe(0);
  });
});
