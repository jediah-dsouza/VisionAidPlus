import { DirectionalGuidanceEngine } from '../../src/core/live-navigation/DirectionalGuidanceEngine';
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

describe('DirectionalGuidanceEngine', () => {
  let engine: DirectionalGuidanceEngine;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    engine = new DirectionalGuidanceEngine({ announcementCooldownMs: 5000 });
  });

  afterEach(() => {
    engine.destroy();
    jest.useRealTimers();
  });

  it('generates danger_alert instruction for critical obstacles', () => {
    const obstacle = makeObstacle({ severity: 'critical', distanceCm: 20 });
    const instruction = engine.generateInstruction(obstacle);
    expect(instruction).not.toBeNull();
    expect(instruction!.type).toBe('danger_alert');
    expect(instruction!.priority).toBe('critical');
    expect(instruction!.text).toContain('Stop');
  });

  it('generates warning for danger obstacles', () => {
    const obstacle = makeObstacle({ severity: 'danger', distanceCm: 100 });
    const instruction = engine.generateInstruction(obstacle);
    expect(instruction).not.toBeNull();
    expect(instruction!.type).toBe('warning');
    expect(instruction!.priority).toBe('high');
  });

  it('generates direction for far caution obstacles', () => {
    const obstacle = makeObstacle({ severity: 'caution', distanceCm: 250 });
    const instruction = engine.generateInstruction(obstacle);
    expect(instruction).not.toBeNull();
    expect(instruction!.type).toBe('direction');
  });

  it('returns null for very far obstacles', () => {
    const obstacle = makeObstacle({ severity: 'safe', distanceCm: 400 });
    const instruction = engine.generateInstruction(obstacle);
    expect(instruction).toBeNull();
  });

  it('throttles repeat announcements', () => {
    const obstacle = makeObstacle({ severity: 'caution', distanceCm: 100, direction: 'front' });
    const first = engine.generateInstruction(obstacle);
    expect(first).not.toBeNull();

    const second = engine.generateInstruction(obstacle);
    expect(second).toBeNull();
  });

  it('allows announcement after cooldown expires', () => {
    const obstacle = makeObstacle({ severity: 'caution', distanceCm: 100, direction: 'front' });
    engine.generateInstruction(obstacle);

    jest.advanceTimersByTime(6000);
    const third = engine.generateInstruction(obstacle);
    expect(third).not.toBeNull();
  });

  it('generates route instruction', () => {
    const instruction = engine.generateRouteInstruction('left', 500, 'Turn left at the corner');
    expect(instruction.type).toBe('direction');
    expect(instruction.text).toBe('Turn left at the corner');
    expect(instruction.hapticPattern).toBe('navigation_turn');
  });

  it('generates arrival instruction', () => {
    const instruction = engine.generateArrivalInstruction();
    expect(instruction.type).toBe('arrival');
    expect(instruction.text).toContain('arrived');
  });

  it('respects cooldown for different obstacle types', () => {
    const front = makeObstacle({ severity: 'caution', distanceCm: 100, direction: 'front', type: 'car' });
    const left = makeObstacle({ severity: 'caution', distanceCm: 100, direction: 'left', type: 'person' });

    expect(engine.generateInstruction(front)).not.toBeNull();
    expect(engine.generateInstruction(left)).not.toBeNull();
  });
});
