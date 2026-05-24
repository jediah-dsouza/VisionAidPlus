import { DetectionStalenessManager } from '../../src/core/camera/DetectionStalenessManager';
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

describe('DetectionStalenessManager', () => {
  let staleness: DetectionStalenessManager;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    staleness = new DetectionStalenessManager({ stalenessTtlMs: 5000 });
  });

  afterEach(() => {
    staleness.destroy();
    jest.useRealTimers();
  });

  it('returns false for fresh detection', () => {
    expect(staleness.isStale(makeDetection())).toBe(false);
  });

  it('returns true for stale detection', () => {
    const d = makeDetection({ processedAt: Date.now() - 10000 });
    expect(staleness.isStale(d)).toBe(true);
  });

  it('critical priority gets double TTL', () => {
    const d = makeDetection({ priority: 'critical', processedAt: Date.now() - 6000 });
    expect(staleness.isStale(d)).toBe(false);
    const d2 = makeDetection({ priority: 'critical', processedAt: Date.now() - 11000 });
    expect(staleness.isStale(d2)).toBe(true);
  });

  it('prune removes stale detections', () => {
    const fresh = makeDetection({ id: 'fresh', processedAt: Date.now() });
    const stale = makeDetection({ id: 'stale', processedAt: Date.now() - 10000 });

    const result = staleness.prune([fresh, stale]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('fresh');
  });

  it('tracks pruned count', () => {
    const stale = makeDetection({ id: 'stale', processedAt: Date.now() - 10000 });
    staleness.prune([stale]);
    expect(staleness.getPrunedCount()).toBe(1);
  });

  it('reset clears pruned count', () => {
    const stale = makeDetection({ processedAt: Date.now() - 10000 });
    staleness.prune([stale]);
    staleness.reset();
    expect(staleness.getPrunedCount()).toBe(0);
  });

  it('destroy prevents operations', () => {
    staleness.destroy();
    expect(staleness.isStale(makeDetection())).toBe(false);
  });
});
