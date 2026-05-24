import { FramePipelineCoordinator } from '../../src/core/camera/FramePipelineCoordinator';
import { FrameThrottleController } from '../../src/core/camera/FrameThrottleController';
import { FrameMetricsCollector } from '../../src/core/camera/FrameMetricsCollector';
import type { CameraFrame } from '../../src/core/camera/types';

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

describe('FramePipelineCoordinator', () => {
  let throttle: FrameThrottleController;
  let metrics: FrameMetricsCollector;
  let pipeline: FramePipelineCoordinator;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    jest.clearAllMocks();
    throttle = new FrameThrottleController(10);
    metrics = new FrameMetricsCollector();
    pipeline = new FramePipelineCoordinator({ targetFps: 10 }, throttle, metrics);
    pipeline.start();
  });

  afterEach(() => {
    pipeline.destroy();
    jest.useRealTimers();
  });

  it('processes frame when throttle allows', () => {
    const result = pipeline.processFrame(makeFrame({ id: 'frame_1' }));
    expect(result).not.toBeNull();
    expect(result!.processed).toBe(true);
    expect(result!.frame.id).toBe('frame_1');
  });

  it('drops frame when throttle denies', () => {
    pipeline.processFrame(makeFrame({ id: 'frame_1' }));
    jest.advanceTimersByTime(5);
    const result = pipeline.processFrame(makeFrame({ id: 'frame_2' }));
    expect(result).not.toBeNull();
    expect(result!.processed).toBe(false);
  });

  it('publishes FRAME_CAPTURED on processed', () => {
    const { eventBus } = require('../../src/core/events/EventBus');
    pipeline.processFrame(makeFrame({ id: 'frame_1' }));
    expect(eventBus.publish).toHaveBeenCalledWith('ai:frameCaptured', expect.any(Object), 'low');
  });

  it('publishes FRAME_DROPPED on drop', () => {
    const { eventBus } = require('../../src/core/events/EventBus');
    pipeline.processFrame(makeFrame({ id: 'frame_1' }));
    pipeline.processFrame(makeFrame({ id: 'frame_2' }));
    expect(eventBus.publish).toHaveBeenCalledWith('ai:frameDropped', expect.any(Object), 'low');
  });

  it('returns metrics snapshot', () => {
    pipeline.processFrame(makeFrame({ id: 'frame_1' }));
    const snap = pipeline.getMetrics();
    expect(snap).toBeDefined();
    expect(snap.processedFrames).toBe(1);
  });

  it('destroy prevents processing', () => {
    pipeline.destroy();
    const result = pipeline.processFrame(makeFrame({ id: 'frame_1' }));
    expect(result).toBeNull();
  });
});
