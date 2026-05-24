/**
 * AI Integration Runtime Validation Tests
 *
 * Tests the full pipeline flow:
 *   DetectionContractRegistry → AIEventPriorityLayer → DetectionQueueController
 *   → DetectionDeduplicationLayer → DetectionStalenessManager
 *   → DetectionRenderingCoordinator → AIOverlaySynchronizationLayer
 */
import { DetectionContractRegistry } from '../../src/core/camera/DetectionContractRegistry';
import { AIEventPriorityLayer } from '../../src/core/camera/AIEventPriorityLayer';
import { DetectionQueueController } from '../../src/core/camera/DetectionQueueController';
import { DetectionDeduplicationLayer } from '../../src/core/camera/DetectionDeduplicationLayer';
import { DetectionStalenessManager } from '../../src/core/camera/DetectionStalenessManager';
import { DetectionRenderingCoordinator } from '../../src/core/camera/DetectionRenderingCoordinator';
import { AIOverlaySynchronizationLayer } from '../../src/core/camera/AIOverlaySynchronizationLayer';
import { CameraLifecycleManager } from '../../src/core/camera/CameraLifecycleManager';
import { DetectionSessionManager } from '../../src/core/camera/DetectionSessionManager';
import type { DetectionContract, CameraDeviceInfo } from '../../src/core/camera/types';

jest.mock('../../src/core/debug', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../src/core/events/EventBus', () => ({
  eventBus: {
    subscribe: jest.fn(() => jest.fn()),
    publish: jest.fn(),
  },
  EVENTS: {},
}));

jest.mock('../../src/core/events/AI_EVENTS', () => ({
  AI_EVENTS: {
    FRAME_CAPTURED: 'ai:frameCaptured',
    DETECTION_RECEIVED: 'ai:detectionReceived',
    DETECTION_CLASSIFIED: 'ai:detectionClassified',
    DETECTIONS_RENDER: 'ai:detectionsRender',
    SESSION_STATE_CHANGE: 'ai:sessionStateChange',
    PIPELINE_ERROR: 'ai:pipelineError',
    FRAME_DROPPED: 'ai:frameDropped',
    QUEUE_OVERFLOW: 'ai:queueOverflow',
    THROTTLE_ADJUSTED: 'ai:throttleAdjusted',
    METRICS_UPDATE: 'ai:metricsUpdate',
  },
}));

const mockDevice: CameraDeviceInfo = {
  id: 'camera_1',
  position: 'back',
  hasFlash: true,
  hasTorch: false,
  supportsDepth: false,
  supportsFocus: true,
  resolutions: [{ width: 1920, height: 1080 }],
  physicalDevices: ['back_wide'],
};

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

describe('AI Integration Runtime Validation', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('full pipeline: register → classify → enqueue → dedup → staleness → render → overlay', () => {
    const registry = new DetectionContractRegistry();
    const priority = new AIEventPriorityLayer();
    const queue = new DetectionQueueController({ maxQueueSize: 100 });
    const dedup = new DetectionDeduplicationLayer({ dedupWindowMs: 5000 });
    const staleness = new DetectionStalenessManager({ stalenessTtlMs: 5000 });
    const renderer = new DetectionRenderingCoordinator({ renderBatchIntervalMs: 100 });
    const overlay = new AIOverlaySynchronizationLayer();

    const raw = makeDetection({ type: 'hazard', id: 'pipeline_test_1' });

    registry.register(raw);
    expect(registry.lookup('pipeline_test_1')).not.toBeNull();

    const classified = priority.classify(raw);
    expect(classified.priority).toBe('critical');

    const queueItem = queue.enqueue(classified);
    expect(queueItem).not.toBeNull();

    expect(dedup.isDuplicate(classified)).toBe(false);
    dedup.record(classified);

    expect(staleness.isStale(classified)).toBe(false);

    renderer.queueForRender(classified);
    renderer.start();
    jest.advanceTimersByTime(150);

    overlay.sync(classified);
    expect(overlay.getOverlayCount()).toBe(1);

    queue.destroy();
    priority.destroy();
    dedup.destroy();
    staleness.destroy();
    renderer.destroy();
    overlay.destroy();
  });

  it('session lifecycle: start → metrics → stop', async () => {
    const camera = new CameraLifecycleManager();
    const session = new DetectionSessionManager();

    await camera.prepare(mockDevice);
    await camera.start();
    session.start();
    expect(camera.getState()).toBe('active');
    expect(session.getState()).toBe('active');

    session.updateMetrics({ totalFrames: 50, processedFrames: 40, droppedFrames: 10 });
    const metrics = session.getMetrics();
    expect(metrics.totalFrames).toBe(50);
    expect(metrics.processedFrames).toBe(40);
    expect(metrics.droppedFrames).toBe(10);

    session.stop();
    await camera.stop();
    expect(camera.getState()).toBe('idle');
    expect(session.getState()).toBe('idle');

    camera.destroy();
    session.destroy();
  });

  it('staleness prunes expired detections from overlay', () => {
    const staleness = new DetectionStalenessManager({ stalenessTtlMs: 5000 });
    const overlay = new AIOverlaySynchronizationLayer();

    const fresh = makeDetection({ id: 'fresh', processedAt: Date.now() });
    const stale = makeDetection({ id: 'stale', processedAt: Date.now() - 10000 });

    overlay.sync(fresh);
    overlay.sync(stale);

    const detections = overlay.getActiveOverlays();
    const pruned = staleness.prune(detections);

    expect(pruned).toHaveLength(1);
    expect(pruned[0].id).toBe('fresh');

    staleness.destroy();
    overlay.destroy();
  });

  it('queue gives priority to critical over normal', () => {
    const queue = new DetectionQueueController({ maxQueueSize: 10 });

    queue.enqueue(makeDetection({ id: 'normal_1', priority: 'normal' }));
    queue.enqueue(makeDetection({ id: 'critical_1', priority: 'critical' }));
    queue.enqueue(makeDetection({ id: 'normal_2', priority: 'normal' }));

    const first = queue.dequeue()!;
    expect(first.detection.id).toBe('critical_1');

    const second = queue.dequeue()!;
    expect(['normal_1', 'normal_2']).toContain(second.detection.id);

    queue.destroy();
  });

  it('dedup suppresses duplicates within window', () => {
    const dedup = new DetectionDeduplicationLayer({ dedupWindowMs: 5000 });
    const queue = new DetectionQueueController({ maxQueueSize: 10 });

    const d = makeDetection({ type: 'person', position: { x: 100, y: 200, width: 50, height: 100 } });
    const dup = makeDetection({ type: 'person', position: { x: 100, y: 200, width: 50, height: 100 } });

    dedup.record(d);
    queue.enqueue(d);

    if (!dedup.isDuplicate(dup)) {
      queue.enqueue(dup);
    }

    expect(queue.getLength()).toBe(1);

    dedup.destroy();
    queue.destroy();
  });
});
