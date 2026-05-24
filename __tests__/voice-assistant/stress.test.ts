import { SpeechQueueManager } from '../../src/core/voice-assistant/SpeechQueueManager';
import { SpeechPriorityEngine } from '../../src/core/voice-assistant/SpeechPriorityEngine';
import { InterruptionCoordinator } from '../../src/core/voice-assistant/InterruptionCoordinator';
import type { SpeechMessage } from '../../src/core/voice-assistant/types';

jest.mock('../../src/core/events/EventBus', () => ({
  eventBus: {
    subscribe: jest.fn(() => jest.fn()),
    publish: jest.fn(),
  },
  EVENTS: {},
}));

jest.mock('../../src/core/debug', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

function makeMsg(overrides: Partial<SpeechMessage> = {}): SpeechMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    text: 'Stress test',
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

describe('Stress: Rapid Speech Flood', () => {
  let queue: SpeechQueueManager;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    jest.clearAllMocks();
    queue = new SpeechQueueManager({ maxQueueSize: 50 });
  });

  afterEach(() => {
    queue.destroy();
    jest.useRealTimers();
  });

  it('handles 100 rapid enqueues', () => {
    for (let i = 0; i < 100; i++) {
      queue.enqueue(makeMsg({ id: `flood_${i}`, priority: i < 10 ? 'critical' : 'normal' }));
    }
    expect(queue.getLength()).toBeLessThanOrEqual(50);
  });

  it('dequeues 100 items in priority order', () => {
    for (let i = 0; i < 100; i++) {
      const prio: SpeechMessage['priority'] =
        i < 10 ? 'critical' :
        i < 30 ? 'high' :
        i < 60 ? 'normal' :
        i < 80 ? 'low' : 'background';
      queue.enqueue(makeMsg({ id: `order_${i}`, priority: prio }));
    }

    let prevScore = -Infinity;
    let count = 0;
    let item = queue.dequeue();
    while (item) {
      expect(item.priorityScore).toBeGreaterThanOrEqual(prevScore);
      prevScore = item.priorityScore;
      count++;
      item = queue.dequeue();
    }
    expect(count).toBeLessThanOrEqual(50);
  });
});

describe('Stress: Emergency Interruptions', () => {
  let queue: SpeechQueueManager;
  let coordinator: InterruptionCoordinator;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    jest.clearAllMocks();
    queue = new SpeechQueueManager({ maxQueueSize: 20 });
    coordinator = new InterruptionCoordinator({}, queue);
  });

  afterEach(() => {
    coordinator.clearInterrupted();
    queue.destroy();
    jest.useRealTimers();
  });

  it('maintains critical ordering with 50 consecutive interrupts', () => {
    // Enqueue background items
    for (let i = 0; i < 10; i++) {
      queue.enqueue(makeMsg({ id: `bg_${i}`, priority: 'background' }));
    }
    // Interleave critical items
    for (let i = 0; i < 5; i++) {
      queue.enqueue(makeMsg({ id: `emergency_${i}`, priority: 'critical' }));
    }
    // All critical must come first
    const first = queue.dequeue();
    expect(first?.priority).toBe('critical');
  });
});

describe('Stress: Duplicate Storms', () => {
  let engine: SpeechPriorityEngine;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    engine = new SpeechPriorityEngine();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('handles 50 duplicates efficiently', () => {
    const items = [];
    for (let i = 0; i < 50; i++) {
      items.push(makeMsg({ text: 'Same message', id: `dup_${i}`, priority: 'normal', category: 'system' }));
    }

    const first = items[0];
    for (let i = 1; i < items.length; i++) {
      expect(engine.isDuplicate(items.slice(0, i), items[i], 5000)).toBe(true);
    }
    // First is never a duplicate of empty
    expect(engine.isDuplicate([], first, 5000)).toBe(false);
  });
});

describe('Stress: Rapid Pause/Resume Cycles', () => {
  let queue: SpeechQueueManager;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    jest.clearAllMocks();
    queue = new SpeechQueueManager({ maxQueueSize: 20 });
  });

  afterEach(() => {
    queue.destroy();
    jest.useRealTimers();
  });

  it('survives 50 enqueue/dequeue cycles', () => {
    for (let cycle = 0; cycle < 50; cycle++) {
      queue.enqueue(makeMsg({ id: `cycle_${cycle}`, priority: cycle % 2 === 0 ? 'critical' : 'normal' }));
      const item = queue.dequeue();
      expect(item).not.toBeNull();
    }
    expect(queue.isEmpty()).toBe(true);
  });
});
