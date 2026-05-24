import { AIOverlaySynchronizationLayer } from '../../src/core/camera/AIOverlaySynchronizationLayer';
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

describe('AIOverlaySynchronizationLayer', () => {
  let sync: AIOverlaySynchronizationLayer;

  beforeEach(() => {
    sync = new AIOverlaySynchronizationLayer();
  });

  afterEach(() => {
    sync.destroy();
  });

  it('starts with no overlays', () => {
    expect(sync.getActiveOverlays()).toEqual([]);
    expect(sync.getOverlayCount()).toBe(0);
  });

  it('sync adds detection to active overlays', () => {
    const d = makeDetection({ id: 'test_1' });
    sync.sync(d);
    expect(sync.getOverlayCount()).toBe(1);
    expect(sync.getActiveOverlays()).toContainEqual(d);
  });

  it('removeOverlay removes by id', () => {
    sync.sync(makeDetection({ id: 'a' }));
    sync.sync(makeDetection({ id: 'b' }));
    sync.removeOverlay('a');
    expect(sync.getOverlayCount()).toBe(1);
    expect(sync.getActiveOverlays()[0].id).toBe('b');
  });

  it('clear removes all overlays', () => {
    sync.sync(makeDetection());
    sync.sync(makeDetection());
    sync.clear();
    expect(sync.getOverlayCount()).toBe(0);
  });

  it('destroy prevents operations', () => {
    sync.destroy();
    sync.sync(makeDetection());
    expect(sync.getOverlayCount()).toBe(0);
  });
});
