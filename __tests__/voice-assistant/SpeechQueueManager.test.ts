import { SpeechQueueManager } from '../../src/core/voice-assistant/SpeechQueueManager';
import type { SpeechMessage } from '../../src/core/voice-assistant/types';

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

function makeMsg(overrides: Partial<SpeechMessage> = {}): SpeechMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    text: 'Test message',
    priority: 'normal',
    category: 'system',
    source: 'tts',
    timestamp: Date.now(),
    ttlMs: 30000,
    expiresAt: Date.now() + 30000,
    spoken: false,
    interrupted: false,
    retryCount: 0,
    maxRetries: 3,
    ...overrides,
  };
}

describe('SpeechQueueManager', () => {
  let queue: SpeechQueueManager;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    jest.clearAllMocks();
    queue = new SpeechQueueManager({ maxQueueSize: 10 });
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
    const item = queue.enqueue(makeMsg({ id: 'test_1' }));
    expect(item).not.toBeNull();
    expect(queue.isEmpty()).toBe(false);
    expect(queue.getLength()).toBe(1);
  });

  it('enqueue returns null after destroy', () => {
    queue.destroy();
    expect(queue.enqueue(makeMsg({ id: 'dead' }))).toBeNull();
  });

  it('dequeues in priority order', () => {
    queue.enqueue(makeMsg({ id: 'low_1', priority: 'low' }));
    queue.enqueue(makeMsg({ id: 'crit_1', priority: 'critical' }));
    queue.enqueue(makeMsg({ id: 'high_1', priority: 'high' }));

    const first = queue.dequeue();
    expect(first?.id).toBe('crit_1');

    const second = queue.dequeue();
    expect(second?.id).toBe('high_1');

    const third = queue.dequeue();
    expect(third?.id).toBe('low_1');
  });

  it('dequeue with priority filter', () => {
    queue.enqueue(makeMsg({ id: 'low_1', priority: 'low' }));
    queue.enqueue(makeMsg({ id: 'high_1', priority: 'high' }));
    const filtered = queue.dequeue(['critical']);
    expect(filtered).toBeNull();
  });

  it('returns null on empty dequeue', () => {
    expect(queue.dequeue()).toBeNull();
  });

  it('dropped oldest when over capacity', () => {
    for (let i = 0; i < 12; i++) {
      queue.enqueue(makeMsg({ id: `overflow_${i}` }));
    }
    expect(queue.getLength()).toBeLessThanOrEqual(10);
  });

  it('remove by id', () => {
    queue.enqueue(makeMsg({ id: 'remove_me' }));
    expect(queue.remove('remove_me')).toBe(true);
    expect(queue.getLength()).toBe(0);
  });

  it('remove non-existent id returns false', () => {
    expect(queue.remove('nowhere')).toBe(false);
  });

  it('removeByCategory removes matching items', () => {
    queue.enqueue(makeMsg({ id: 'sys_1', category: 'system' }));
    queue.enqueue(makeMsg({ id: 'nav_1', category: 'navigation' }));
    queue.enqueue(makeMsg({ id: 'sys_2', category: 'system' }));
    expect(queue.removeByCategory('system')).toBe(2);
    expect(queue.getLength()).toBe(1);
  });

  it('clear removes all items', () => {
    queue.enqueue(makeMsg({ id: 'a' }));
    queue.enqueue(makeMsg({ id: 'b' }));
    queue.clear();
    expect(queue.isEmpty()).toBe(true);
  });

  it('pruneStale removes expired items', () => {
    queue.enqueue(makeMsg({ id: 'fresh', expiresAt: Date.now() + 10000 }));
    queue.enqueue(makeMsg({ id: 'stale', expiresAt: Date.now() - 1000 }));
    expect(queue.pruneStale()).toBe(1);
    expect(queue.getLength()).toBe(1);
  });

  it('peek returns first priority item without removing', () => {
    queue.enqueue(makeMsg({ id: 'first', priority: 'high' }));
    queue.enqueue(makeMsg({ id: 'second', priority: 'normal' }));
    const peeked = queue.peek();
    expect(peeked?.id).toBe('first');
    expect(queue.getLength()).toBe(2);
  });

  it('peek returns null on empty queue', () => {
    expect(queue.peek()).toBeNull();
  });

  it('peek respects priority filter', () => {
    queue.enqueue(makeMsg({ id: 'bg_1', priority: 'background' }));
    expect(queue.peek(['critical', 'high', 'normal', 'low'])).toBeNull();
  });

  it('tracks metrics', () => {
    queue.enqueue(makeMsg({ id: 'm1' }));
    queue.enqueue(makeMsg({ id: 'm2', priority: 'critical' }));
    queue.dequeue();
    queue.recordSpoken();

    const metrics = queue.getMetrics();
    expect(metrics.totalMessages).toBe(2);
    expect(metrics.totalSpoken).toBe(1);
    expect(metrics.peakQueueDepth).toBeGreaterThanOrEqual(2);
  });

  it('recordInterrupted increments counter', () => {
    queue.recordInterrupted();
    expect(queue.getMetrics().totalInterrupted).toBe(1);
  });

  it('recordFailed increments counter', () => {
    queue.recordFailed();
    expect(queue.getMetrics().totalFailed).toBe(1);
  });

  it('recordDuplicateSuppressed increments counter', () => {
    queue.recordDuplicateSuppressed();
    expect(queue.getMetrics().totalDuplicatesSuppressed).toBe(1);
  });

  it('getQueue returns readonly array', () => {
    queue.enqueue(makeMsg({ id: 'q_1' }));
    const q = queue.getQueue();
    expect(q.length).toBe(1);
    expect(q[0].id).toBe('q_1');
  });
});
