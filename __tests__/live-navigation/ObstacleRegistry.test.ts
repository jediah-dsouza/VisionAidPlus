import { ObstacleRegistry } from '../../src/core/live-navigation/ObstacleRegistry';
import type { ObstacleEvent } from '../../src/core/live-navigation/types';

jest.mock('../../src/core/events/EventBus', () => ({
  eventBus: {
    subscribe: jest.fn(() => jest.fn()),
    publish: jest.fn(),
  },
  EVENTS: {},
}));

jest.mock('../../src/core/debug', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

function makeEvent(overrides: Partial<ObstacleEvent> = {}): ObstacleEvent {
  return {
    id: `obs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'person',
    distanceCm: 150,
    direction: 'front',
    severity: 'caution',
    detectedAt: Date.now(),
    source: { type: 'ai', id: 'test' },
    confidence: 0.9,
    size: 'medium',
    ...overrides,
  };
}

describe('ObstacleRegistry', () => {
  let registry: ObstacleRegistry;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    registry = new ObstacleRegistry({
      staleObstacleTtlMs: 5000,
      obstacleMaxCapacity: 10,
      radarMaxDistanceCm: 500,
    });
  });

  afterEach(() => {
    registry.destroy();
    jest.useRealTimers();
  });

  it('inserts a new obstacle', () => {
    const event = makeEvent();
    const obstacle = registry.insertOrUpdate(event);
    expect(obstacle).not.toBeNull();
    expect(obstacle!.id).toBe(event.id);
    expect(obstacle!.status).toBe('detected');
    expect(registry.getCount()).toBe(1);
  });

  it('deduplicates by id', () => {
    const event = makeEvent({ id: 'test-1' });
    const first = registry.insertOrUpdate(event);
    expect(first).not.toBeNull();

    const event2 = makeEvent({ id: 'test-1', distanceCm: 175, severity: 'danger' });
    const second = registry.insertOrUpdate(event2);

    expect(second).not.toBeNull();
    expect(second!.id).toBe('test-1');
    expect(second!.updateCount).toBe(2);
    expect(registry.getCount()).toBe(1);
  });

  it('updates existing obstacle distance and severity', () => {
    const event = makeEvent({ id: 'test-update', distanceCm: 200, severity: 'safe' });
    registry.insertOrUpdate(event);

    const update = makeEvent({ id: 'test-update', distanceCm: 50, severity: 'danger' });
    const updated = registry.insertOrUpdate(update);

    expect(updated!.distanceCm).toBe(50);
    expect(updated!.severity).toBe('danger');
    expect(updated!.updateCount).toBe(2);
  });

  it('evicts oldest when at capacity', () => {
    for (let i = 0; i < 10; i++) {
      registry.insertOrUpdate(makeEvent({ id: `obs_${i}`, distanceCm: 100 + i * 10 }));
    }
    expect(registry.getCount()).toBe(10);

    registry.insertOrUpdate(makeEvent({ id: 'obs_overflow', distanceCm: 50 }));
    expect(registry.getCount()).toBe(10);

    const all = registry.getAll();
    const ids = all.map(o => o.id);
    expect(ids).not.toContain('obs_0');
    expect(ids).toContain('obs_overflow');
  });

  it('marks obstacles as stale', () => {
    const event = makeEvent({ id: 'stale-test' });
    registry.insertOrUpdate(event);
    expect(registry.markStale('stale-test')).toBe(true);

    const obstacle = registry.getById('stale-test');
    expect(obstacle!.status).toBe('stale');
  });

  it('prunes expired obstacles', () => {
    registry.insertOrUpdate(makeEvent({ id: 'fresh' }));
    jest.advanceTimersByTime(6000);
    registry.insertOrUpdate(makeEvent({ id: 'still_fresh' }));

    const pruned = registry.pruneExpired();
    expect(pruned).toBe(1);

    expect(registry.getById('fresh')).toBeUndefined();
    expect(registry.getById('still_fresh')).toBeDefined();
  });

  it('does not insert when destroyed', () => {
    registry.destroy();
    const event = makeEvent();
    const result = registry.insertOrUpdate(event);
    expect(result).toBeNull();
  });

  it('getActive returns only active/detected obstacles', () => {
    const event1 = makeEvent({ id: 'active_1' });
    const event2 = makeEvent({ id: 'active_2' });
    registry.insertOrUpdate(event1);
    registry.insertOrUpdate(event2);
    registry.markStale('active_1');

    const active = registry.getActive();
    expect(active.length).toBe(1);
    expect(active[0].id).toBe('active_2');
  });

  it('removes obstacle correctly', () => {
    const event = makeEvent({ id: 'remove-test' });
    registry.insertOrUpdate(event);
    expect(registry.remove('remove-test')).toBe(true);
    expect(registry.getCount()).toBe(0);
    expect(registry.remove('nonexistent')).toBe(false);
  });

  it('clears all obstacles', () => {
    for (let i = 0; i < 5; i++) {
      registry.insertOrUpdate(makeEvent({ id: `obs_${i}` }));
    }
    registry.clear();
    expect(registry.getCount()).toBe(0);
  });

  it('tracks registry metrics', () => {
    const event = makeEvent({ id: 'metrics-test' });
    registry.insertOrUpdate(event);
    registry.insertOrUpdate(event);

    const metrics = registry.getMetrics();
    expect(metrics.totalInserted).toBe(1);
    expect(metrics.deduplicationHits).toBe(1);
  });
});
