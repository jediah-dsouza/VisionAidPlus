import { DetectionContractRegistry } from '../../src/core/camera/DetectionContractRegistry';
import type { DetectionContract } from '../../src/core/camera/types';

jest.mock('../../src/core/debug', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

function makeDetection(overrides: Partial<DetectionContract> = {}): DetectionContract {
  return {
    id: `det_${Date.now()}`,
    type: 'person',
    priority: 'normal',
    source: 'ai_model',
    lifecycleState: 'captured',
    position: { x: 0, y: 0, width: 100, height: 200 },
    confidence: { overall: 0.85, classification: 0.85, spatial: 0.85, temporal: 0.85 },
    frameId: 'frame_0',
    sourceTimestamp: Date.now(),
    processedAt: Date.now(),
    ttlMs: 5000,
    tracking: null,
    metadata: {},
    ...overrides,
  };
}

describe('DetectionContractRegistry', () => {
  let registry: DetectionContractRegistry;

  beforeEach(() => {
    registry = new DetectionContractRegistry();
  });

  afterEach(() => {
    registry.destroy();
  });

  it('starts empty', () => {
    expect(registry.getRecent(10)).toEqual([]);
    expect(registry.lookup('nonexistent')).toBeNull();
  });

  it('register adds detection', () => {
    registry.register(makeDetection({ id: 'det_1' }));
    expect(registry.lookup('det_1')).not.toBeNull();
  });

  it('lookup returns null for missing', () => {
    expect(registry.lookup('nothing')).toBeNull();
  });

  it('remove returns true when found', () => {
    registry.register(makeDetection({ id: 'det_1' }));
    expect(registry.remove('det_1')).toBe(true);
  });

  it('remove returns false when not found', () => {
    expect(registry.remove('nothing')).toBe(false);
  });

  it('getRecent returns most recent up to limit', () => {
    for (let i = 0; i < 10; i++) {
      registry.register(makeDetection({ id: `det_${i}` }));
    }
    const recent = registry.getRecent(3);
    expect(recent).toHaveLength(3);
  });

  it('lookupByType filters by detection type', () => {
    registry.register(makeDetection({ id: 'p1', type: 'person' }));
    registry.register(makeDetection({ id: 'p2', type: 'person' }));
    registry.register(makeDetection({ id: 'o1', type: 'obstacle' }));

    const persons = registry.lookupByType('person');
    expect(persons).toHaveLength(2);

    const obstacles = registry.lookupByType('obstacle');
    expect(obstacles).toHaveLength(1);
  });

  it('destroy clears registry', () => {
    registry.register(makeDetection({ id: 'det_1' }));
    registry.destroy();
    expect(registry.lookup('det_1')).toBeNull();
  });
});
