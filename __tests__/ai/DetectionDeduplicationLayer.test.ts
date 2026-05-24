import { DetectionDeduplicationLayer } from '../../src/core/camera/DetectionDeduplicationLayer';
import type { DetectionContract } from '../../src/core/camera/types';

jest.mock('../../src/core/debug', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

function makeDetection(overrides: Partial<DetectionContract> = {}): DetectionContract {
  return {
    id: `det_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'person',
    priority: 'normal',
    source: 'ai_model',
    lifecycleState: 'captured',
    position: { x: 100, y: 200, width: 50, height: 100 },
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

describe('DetectionDeduplicationLayer', () => {
  let dedup: DetectionDeduplicationLayer;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    dedup = new DetectionDeduplicationLayer({ dedupWindowMs: 5000 });
  });

  afterEach(() => {
    dedup.destroy();
    jest.useRealTimers();
  });

  it('returns false for unseen detection', () => {
    expect(dedup.isDuplicate(makeDetection())).toBe(false);
  });

  it('detects duplicate after recording', () => {
    const d = makeDetection({ id: 'test_1', type: 'person', position: { x: 100, y: 200, width: 50, height: 100 } });
    dedup.record(d);
    expect(dedup.isDuplicate(makeDetection({ position: d.position, confidence: d.confidence, type: d.type }))).toBe(true);
  });

  it('ignores detections outside dedup window', () => {
    const d = makeDetection({ type: 'obstacle', position: { x: 0, y: 0, width: 50, height: 50 } });
    dedup.record(d);
    jest.advanceTimersByTime(10000);
    expect(dedup.isDuplicate(makeDetection({ position: d.position, confidence: d.confidence, type: d.type }))).toBe(false);
  });

  it('critical priority bypasses dedup', () => {
    const d = makeDetection({ priority: 'critical' });
    dedup.record(d);
    expect(dedup.isDuplicate(d)).toBe(false);
  });

  it('tracks suppressed count', () => {
    const d = makeDetection({ type: 'obstacle', position: { x: 0, y: 0, width: 50, height: 50 } });
    dedup.record(d);
    dedup.isDuplicate(d);
    expect(dedup.getSuppressedCount()).toBe(1);
  });

  it('clear resets state', () => {
    dedup.record(makeDetection());
    dedup.clear();
    expect(dedup.getSuppressedCount()).toBe(0);
  });

  it('prevents operations after destroy', () => {
    dedup.destroy();
    expect(dedup.isDuplicate(makeDetection())).toBe(false);
  });
});
