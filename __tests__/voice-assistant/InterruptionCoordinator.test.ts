import { InterruptionCoordinator } from '../../src/core/voice-assistant/InterruptionCoordinator';
import { SpeechQueueManager } from '../../src/core/voice-assistant/SpeechQueueManager';
import type { SpeechMessage, SpeechQueueItem } from '../../src/core/voice-assistant/types';

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
    id: `msg_${Date.now()}`,
    text: 'Test',
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

function makeItem(overrides: Partial<SpeechQueueItem> = {}): SpeechQueueItem {
  return {
    ...makeMsg(overrides),
    enqueuedAt: Date.now(),
    queuePosition: 0,
    priorityScore: 0,
    starvationScore: 0,
    ...overrides,
  };
}

describe('InterruptionCoordinator', () => {
  let queue: SpeechQueueManager;
  let coordinator: InterruptionCoordinator;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    jest.clearAllMocks();
    queue = new SpeechQueueManager();
    coordinator = new InterruptionCoordinator({}, queue);
  });

  afterEach(() => {
    coordinator.clearInterrupted();
    queue.destroy();
    jest.useRealTimers();
  });

  it('critical interrupts critical', () => {
    expect(coordinator.shouldInterrupt(
      makeItem({ priority: 'critical' }),
      makeMsg({ priority: 'critical' }),
    )).toBe(true);
  });

  it('high interrupts normal', () => {
    expect(coordinator.shouldInterrupt(
      makeItem({ priority: 'normal' }),
      makeMsg({ priority: 'high' }),
    )).toBe(true);
  });

  it('normal does not interrupt high', () => {
    expect(coordinator.shouldInterrupt(
      makeItem({ priority: 'high' }),
      makeMsg({ priority: 'normal' }),
    )).toBe(false);
  });

  it('background is always interruptible', () => {
    expect(coordinator.shouldInterrupt(
      makeItem({ priority: 'background' }),
      makeMsg({ priority: 'low' }),
    )).toBe(true);
  });

  it('null current means no interruption needed', () => {
    expect(coordinator.shouldInterrupt(null, makeMsg({ priority: 'critical' }))).toBe(false);
  });

  it('handleInterruption publishes event', () => {
    coordinator.handleInterruption(makeItem({ id: 'interrupted_1', priority: 'normal' }));
    expect(coordinator.getInterruptedCount()).toBe(1);

    const eventBus = jest.requireMock('../../src/core/events/EventBus').eventBus;
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.stringContaining('PRIORITY_ESCALATED'),
      expect.any(Object),
      'normal',
    );
  });

  it('limits interrupted item storage to 10', () => {
    for (let i = 0; i < 15; i++) {
      coordinator.handleInterruption(makeItem({ id: `interrupted_${i}` }));
    }
    expect(coordinator.getInterruptedCount()).toBeLessThanOrEqual(10);
  });

  it('clearInterrupted resets count', () => {
    coordinator.handleInterruption(makeItem({ id: 'test' }));
    coordinator.clearInterrupted();
    expect(coordinator.getInterruptedCount()).toBe(0);
  });

  it('getInterruptedItems returns items', () => {
    coordinator.handleInterruption(makeItem({ id: 'item_1' }));
    const items = coordinator.getInterruptedItems();
    expect(items.length).toBe(1);
    expect(items[0].id).toBe('item_1');
  });
});
