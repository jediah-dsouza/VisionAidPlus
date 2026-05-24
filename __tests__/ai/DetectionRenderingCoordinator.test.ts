import { DetectionRenderingCoordinator } from '../../src/core/camera/DetectionRenderingCoordinator';
import type { DetectionContract } from '../../src/core/camera/types';

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
    DETECTIONS_RENDER: 'ai:detectionsRender',
  },
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

describe('DetectionRenderingCoordinator', () => {
  let coordinator: DetectionRenderingCoordinator;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    coordinator = new DetectionRenderingCoordinator({ renderBatchIntervalMs: 100 });
  });

  afterEach(() => {
    coordinator.destroy();
    jest.useRealTimers();
  });

  it('queues detections for rendering', () => {
    coordinator.queueForRender(makeDetection());
    expect(coordinator.getRenderCount()).toBe(0);
  });

  it('publishes render events on interval', () => {
    const { eventBus } = require('../../src/core/events/EventBus');
    const d = makeDetection();
    coordinator.queueForRender(d);
    coordinator.start();
    jest.advanceTimersByTime(150);

    expect(eventBus.publish).toHaveBeenCalledWith('ai:detectionsRender', { detections: [d] }, 'low');
    expect(coordinator.getRenderCount()).toBe(1);
  });

  it('caps pending queue at 50 items', () => {
    for (let i = 0; i < 60; i++) {
      coordinator.queueForRender(makeDetection({ id: `det_${i}` }));
    }
    coordinator.start();
    jest.advanceTimersByTime(150);

    const { eventBus } = require('../../src/core/events/EventBus');
    const call = eventBus.publish.mock.calls[0];
    expect(call[1].detections.length).toBe(50);
  });

  it('stop prevents rendering', () => {
    const { eventBus } = require('../../src/core/events/EventBus');
    coordinator.start();
    coordinator.stop();
    coordinator.queueForRender(makeDetection());
    jest.advanceTimersByTime(150);
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('destroy prevents further queuing', () => {
    coordinator.destroy();
    coordinator.queueForRender(makeDetection());
    expect(coordinator.getRenderCount()).toBe(0);
  });
});
