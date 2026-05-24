import { ObstaclePrioritizationEngine } from '../../src/core/live-navigation/ObstaclePrioritizationEngine';
import type { Obstacle } from '../../src/core/live-navigation/types';

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

function makeObstacle(overrides: Partial<Obstacle> = {}): Obstacle {
  return {
    id: `obs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'person',
    distanceCm: 150,
    direction: 'front',
    severity: 'caution',
    status: 'active',
    priority: 0,
    detectedAt: Date.now(),
    lastUpdatedAt: Date.now(),
    expiresAt: Date.now() + 5000,
    source: { type: 'ai', id: 'test' },
    size: 'medium',
    confidence: 0.9,
    ttlMs: 5000,
    updateCount: 1,
    ...overrides,
  };
}

describe('ObstaclePrioritizationEngine', () => {
  let engine: ObstaclePrioritizationEngine;

  beforeEach(() => {
    engine = new ObstaclePrioritizationEngine({ radarMaxDistanceCm: 500 });
  });

  afterEach(() => {
    engine.destroy();
  });

  it('assigns highest priority to front, critical, close obstacles', () => {
    const front = makeObstacle({ direction: 'front', severity: 'critical', distanceCm: 20, size: 'large' });
    const behind = makeObstacle({ direction: 'behind', severity: 'safe', distanceCm: 400, size: 'small' });

    const frontP = engine.computePriority(front);
    const behindP = engine.computePriority(behind);
    expect(frontP).toBeGreaterThan(behindP);
  });

  it('returns none danger level for empty obstacles', () => {
    expect(engine.computeDangerLevel([])).toBe('none');
  });

  it('escalates to critical for critical severity obstacles', () => {
    const obstacles = [makeObstacle({ severity: 'critical', distanceCm: 100 })];
    expect(engine.computeDangerLevel(obstacles)).toBe('critical');
  });

  it('deescalates when danger passes', () => {
    const high = [makeObstacle({ severity: 'danger', distanceCm: 30, direction: 'front' })];
    const low = [makeObstacle({ severity: 'safe', distanceCm: 400, direction: 'behind' })];

    engine.computeDangerLevel(high);
    engine.evaluateAndPublishDanger(high);

    const level = engine.evaluateAndPublishDanger(low);
    expect(level).toBe('none');
  });

  it('prioritizes returns sorted by priority descending', () => {
    const low = makeObstacle({ id: 'low', severity: 'safe', distanceCm: 500, direction: 'behind' });
    const high = makeObstacle({ id: 'high', severity: 'critical', distanceCm: 10, direction: 'front' });

    const sorted = engine.prioritize([low, high]);
    expect(sorted[0].priority).toBeGreaterThanOrEqual(sorted[1].priority);
  });

  it('getTopObstacles returns at most N obstacles', () => {
    const obstacles = Array.from({ length: 10 }, (_, i) =>
      makeObstacle({ id: `obs_${i}`, severity: 'caution', distanceCm: 100 + i * 20 }),
    );
    const top = engine.getTopObstacles(obstacles, 3);
    expect(top.length).toBe(3);
  });
});
