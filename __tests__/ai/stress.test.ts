/**
 * AI Stress Tests
 *
 * Tests system behavior under load:
 * - Frame flood (500 frames)
 * - Burst detections (200 simultaneous)
 * - Queue overflow (beyond maxQueueSize)
 * - Overlay storm (rapid add/remove)
 */
import { FrameThrottleController } from '../../src/core/camera/FrameThrottleController';
import { FrameMetricsCollector } from '../../src/core/camera/FrameMetricsCollector';
import { FramePipelineCoordinator } from '../../src/core/camera/FramePipelineCoordinator';
import { DetectionQueueController } from '../../src/core/camera/DetectionQueueController';
import { DetectionDeduplicationLayer } from '../../src/core/camera/DetectionDeduplicationLayer';
import { DetectionRenderingCoordinator } from '../../src/core/camera/DetectionRenderingCoordinator';
import { AIOverlaySynchronizationLayer } from '../../src/core/camera/AIOverlaySynchronizationLayer';
import { FrameDropProtection } from '../../src/core/camera/FrameDropProtection';
import { RenderingPerformanceMonitor } from '../../src/core/camera/RenderingPerformanceMonitor';
import { DetectionVisibilityController } from '../../src/core/camera/DetectionVisibilityController';
import type { CameraFrame, DetectionContract } from '../../src/core/camera/types';

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
    FRAME_DROPPED: 'ai:frameDropped',
    DETECTION_CLASSIFIED: 'ai:detectionClassified',
    DETECTIONS_RENDER: 'ai:detectionsRender',
    QUEUE_OVERFLOW: 'ai:queueOverflow',
    METRICS_UPDATE: 'ai:metricsUpdate',
    SESSION_STATE_CHANGE: 'ai:sessionStateChange',
    PIPELINE_ERROR: 'ai:pipelineError',
  },
}));

function makeFrame(overrides: Partial<CameraFrame> = {}): CameraFrame {
  return {
    id: `frame_${Date.now()}`,
    timestamp: Date.now(),
    sourceTimestamp: Date.now(),
    frameId: 0,
    width: 1920,
    height: 1080,
    orientation: 'portrait',
    bytesPerRow: 7680,
    planesCount: 1,
    isDepth: false,
    ...overrides,
  };
}

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

describe('AI Stress Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('frame flood: handles 500 rapid frames without crash', () => {
    const throttle = new FrameThrottleController(15);
    const metrics = new FrameMetricsCollector();
    const pipeline = new FramePipelineCoordinator({ targetFps: 15 }, throttle, metrics);
    pipeline.start();

    for (let i = 0; i < 500; i++) {
      const frame = makeFrame({ id: `flood_${i}` });
      pipeline.processFrame(frame);
      jest.advanceTimersByTime(5);
    }

    const snap = pipeline.getMetrics();
    expect(snap.totalFrames).toBe(500);
    expect(snap.droppedFrames).toBeGreaterThan(0);
    expect(snap.processedFrames).toBeLessThan(500);

    pipeline.destroy();
  });

  it('burst detections: enqueue 200 items without overflow crash', () => {
    const queue = new DetectionQueueController({ maxQueueSize: 50 });

    for (let i = 0; i < 200; i++) {
      queue.enqueue(makeDetection({ id: `burst_${i}` }));
    }

    expect(queue.getLength()).toBeLessThanOrEqual(50);
    expect(queue.getOverflowCount()).toBeGreaterThan(0);
    expect(queue.getLength()).toBe(50);

    queue.destroy();
  });

  it('rapid dedup: 200 unique entries', () => {
    const dedup = new DetectionDeduplicationLayer({ dedupWindowMs: 10000 });

    for (let i = 0; i < 200; i++) {
      const d = makeDetection({
        id: `dedup_${i}`,
        type: i % 2 === 0 ? 'person' : 'obstacle',
        position: { x: i * 10, y: i * 10, width: 50, height: 100 },
      });
      dedup.record(d);
    }

    expect(dedup.getSuppressedCount()).toBe(0);

    dedup.destroy();
  });

  it('overlay storm: rapid add/remove 500 overlays', () => {
    const overlay = new AIOverlaySynchronizationLayer();

    for (let cycle = 0; cycle < 50; cycle++) {
      for (let i = 0; i < 10; i++) {
        overlay.sync(makeDetection({ id: `storm_${cycle}_${i}` }));
      }
      overlay.clear();
    }

    expect(overlay.getOverlayCount()).toBe(0);

    overlay.destroy();
  });

  it('render batcher: rapid queue/start/stop cycles', () => {
    const renderer = new DetectionRenderingCoordinator({ renderBatchIntervalMs: 50 });

    for (let cycle = 0; cycle < 20; cycle++) {
      renderer.queueForRender(makeDetection({ id: `cycle_${cycle}` }));
      renderer.start();
      jest.advanceTimersByTime(60);
      renderer.stop();
    }

    expect(renderer.getRenderCount()).toBe(20);

    renderer.destroy();
  });

  it('frame drop protection detects starvation', () => {
    const protection = new FrameDropProtection();

    for (let i = 0; i < 40; i++) {
      protection.recordDrop();
    }

    expect(protection.isStarving()).toBe(true);
    expect(protection.getConsecutiveDrops()).toBe(40);
    expect(protection.getTotalDrops()).toBe(40);
    expect(protection.getDropRate(5000)).toBeCloseTo(8, 0);

    protection.reset();
    expect(protection.getTotalDrops()).toBe(0);
    expect(protection.isStarving()).toBe(false);

    protection.destroy();
  });

  it('rendering performance monitor handles 1000 renders', () => {
    const monitor = new RenderingPerformanceMonitor({ targetFps: 30 });

    for (let i = 0; i < 1000; i++) {
      jest.advanceTimersByTime(33);
      monitor.recordRender(Math.floor(i / 100) + 1, Math.random() * 20 + 5);
    }

    const snap = monitor.getSnapshot();
    expect(snap.renderCount).toBe(1000);
    expect(snap.averageRenderFps).toBeGreaterThan(0);
    expect(snap.averageRenderTimeMs).toBeGreaterThan(0);
    expect(snap.maxRenderTimeMs).toBeGreaterThan(0);
    expect(snap.averageOverlayCount).toBeGreaterThan(0);

    monitor.destroy();
  });

  it('visibility toggles under rapid changes', () => {
    const visibility = new DetectionVisibilityController();

    for (let i = 0; i < 100; i++) {
      if (i % 2 === 0) visibility.show();
      else visibility.hide();
    }

    expect(visibility.isVisible()).toBe(false);

    visibility.destroy();
    expect(visibility.isVisible()).toBe(false);
  });
});
