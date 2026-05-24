import { DetectionQueueController } from '../../src/core/camera/DetectionQueueController';
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
    QUEUE_OVERFLOW: 'ai:queueOverflow',
  },
}));

function makeDetection(overrides: Partial<DetectionContract> = {}): DetectionContract {
  return {
    id: `det_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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

describe('DetectionQueueController', () => {
  let queue: DetectionQueueController;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    jest.clearAllMocks();
    queue = new DetectionQueueController({ maxQueueSize: 5 });
  });

  afterEach(() => {
    queue.destroy();
    jest.useRealTimers();
  });

  it('starts empty', () => {
    expect(queue.isEmpty()).toBe(true);
    expect(queue.getLength()).toBe(0);
  });

  it('enqueues items', () => {
    const item = queue.enqueue(makeDetection({ id: 'test_1' }));
    expect(item).not.toBeNull();
    expect(queue.isEmpty()).toBe(false);
    expect(queue.getLength()).toBe(1);
  });

  it('enqueue returns null after destroy', () => {
    queue.destroy();
    expect(queue.enqueue(makeDetection())).toBeNull();
  });

  it('dequeues highest priority item', () => {
    queue.enqueue(makeDetection({ id: 'low', priority: 'low' }));
    queue.enqueue(makeDetection({ id: 'high', priority: 'high' }));
    queue.enqueue(makeDetection({ id: 'critical', priority: 'critical' }));

    const item = queue.dequeue();
    expect(item).not.toBeNull();
    expect(item!.detection.id).toBe('critical');
  });

  it('dequeue returns null when empty', () => {
    expect(queue.dequeue()).toBeNull();
  });

  it('dequeue respects priority filter', () => {
    queue.enqueue(makeDetection({ id: 'high', priority: 'high' }));
    queue.enqueue(makeDetection({ id: 'low', priority: 'low' }));

    const item = queue.dequeue(['low']);
    expect(item).not.toBeNull();
    expect(item!.detection.priority).toBe('low');
  });

  it('peek returns highest priority without removing', () => {
    queue.enqueue(makeDetection({ id: 'a', priority: 'normal' }));
    queue.enqueue(makeDetection({ id: 'b', priority: 'high' }));

    const item = queue.peek();
    expect(item).not.toBeNull();
    expect(item!.detection.id).toBe('b');
    expect(queue.getLength()).toBe(2);
  });

  it('removes item by id', () => {
    queue.enqueue(makeDetection({ id: 'remove_me' }));
    expect(queue.getLength()).toBe(1);
    expect(queue.remove('remove_me')).toBe(true);
    expect(queue.getLength()).toBe(0);
  });

  it('remove returns false for missing id', () => {
    expect(queue.remove('nonexistent')).toBe(false);
  });

  it('drops oldest on overflow', () => {
    queue = new DetectionQueueController({ maxQueueSize: 2 });
    queue.enqueue(makeDetection({ id: 'a' }));
    queue.enqueue(makeDetection({ id: 'b' }));
    queue.enqueue(makeDetection({ id: 'c' }));
    expect(queue.getLength()).toBe(2);
    expect(queue.getOverflowCount()).toBe(1);
  });

  it('clear empties the queue', () => {
    queue.enqueue(makeDetection({ id: 'a' }));
    queue.enqueue(makeDetection({ id: 'b' }));
    queue.clear();
    expect(queue.isEmpty()).toBe(true);
  });
});
