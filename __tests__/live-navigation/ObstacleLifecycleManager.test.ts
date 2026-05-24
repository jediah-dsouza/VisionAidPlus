import { ObstacleRegistry } from '../../src/core/live-navigation/ObstacleRegistry';
import { ObstacleLifecycleManager } from '../../src/core/live-navigation/ObstacleLifecycleManager';
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

describe('ObstacleLifecycleManager', () => {
  let registry: ObstacleRegistry;
  let lifecycle: ObstacleLifecycleManager;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    registry = new ObstacleRegistry({ staleObstacleTtlMs: 5000, obstacleMaxCapacity: 100 });
    lifecycle = new ObstacleLifecycleManager({ staleObstacleTtlMs: 5000, staleCleanupIntervalMs: 1000 }, registry);
  });

  afterEach(() => {
    lifecycle.destroy();
    registry.destroy();
    jest.useRealTimers();
  });

  it('marks obstacles as stale after TTL threshold', () => {
    lifecycle.start();

    registry.insertOrUpdate(makeEvent({ id: 'aging_obs' }));
    jest.advanceTimersByTime(4500);

    const all = registry.getAll();
    expect(all.length).toBe(1);
    expect(all[0].status).toBe('stale');
  });

  it('prunes expired obstacles', () => {
    lifecycle.start();

    registry.insertOrUpdate(makeEvent({ id: 'expiring' }));
    jest.advanceTimersByTime(5500);

    registry.insertOrUpdate(makeEvent({ id: 'fresh' }));
    jest.advanceTimersByTime(1500);

    expect(registry.getById('expiring')).toBeUndefined();
    expect(registry.getById('fresh')).toBeDefined();
  });

  it('forceCleanup cleans stale and expired', () => {
    registry.insertOrUpdate(makeEvent({ id: 'old_obs' }));
    jest.advanceTimersByTime(5000);

    registry.insertOrUpdate(makeEvent({ id: 'current' }));

    const result = lifecycle.forceCleanup();
    expect(result.stale).toBe(1);
    expect(registry.getById('old_obs')).toBeUndefined();
  });

  it('stop halts cleanup cycles', () => {
    lifecycle.start();
    lifecycle.stop();

    registry.insertOrUpdate(makeEvent({ id: 'orphan' }));
    jest.advanceTimersByTime(10000);

    expect(registry.getById('orphan')).toBeDefined();
  });
});
