import { ObstacleRegistry } from '../../src/core/live-navigation/ObstacleRegistry';
import { RadarSyncSystem } from '../../src/core/live-navigation/RadarSyncSystem';
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

describe('RadarSyncSystem', () => {
  let registry: ObstacleRegistry;
  let radar: RadarSyncSystem;

  beforeEach(() => {
    jest.useFakeTimers();
    registry = new ObstacleRegistry({ radarMaxDistanceCm: 500 });
    radar = new RadarSyncSystem({
      radarSectorCount: 8,
      radarMaxDistanceCm: 500,
      renderThrottleMs: 50,
    });
  });

  afterEach(() => {
    radar.destroy();
    registry.destroy();
    jest.useRealTimers();
  });

  it('computes radar sectors from obstacles', () => {
    const obstacles = [
      makeObstacle({ direction: 'front', distanceCm: 30, severity: 'danger' }),
      makeObstacle({ direction: 'left', distanceCm: 100, severity: 'caution' }),
      makeObstacle({ direction: 'right', distanceCm: 200, severity: 'safe' }),
    ];

    const snapshot = radar.computeSnapshot(obstacles);
    expect(snapshot.sectors.length).toBe(8);
    expect(snapshot.nearestObstacle!.distanceCm).toBe(30);
    expect(snapshot.totalObstacles).toBe(3);
  });

  it('identifies nearest obstacle correctly', () => {
    const obstacles = [
      makeObstacle({ id: 'near', distanceCm: 20, severity: 'danger' }),
      makeObstacle({ id: 'far', distanceCm: 400, severity: 'safe' }),
    ];

    const snapshot = radar.computeSnapshot(obstacles);
    expect(snapshot.nearestObstacle!.id).toBe('near');
  });

  it('sector with obstacles has lower distanceCm', () => {
    const obstacles = [
      makeObstacle({ direction: 'front', distanceCm: 50, severity: 'danger' }),
    ];

    const snapshot = radar.computeSnapshot(obstacles);
    const frontSector = snapshot.sectors.find(s => s.angle < 45);
    expect(frontSector).toBeDefined();
    expect(frontSector!.distanceCm).toBe(50);
    expect(frontSector!.obstacleCount).toBe(1);

    const emptySector = snapshot.sectors.find(s => s.angle > 200);
    expect(emptySector!.distanceCm).toBe(500);
    expect(emptySector!.obstacleCount).toBe(0);
  });
});
