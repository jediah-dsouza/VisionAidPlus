import { SpeechPriorityEngine } from '../../src/core/voice-assistant/SpeechPriorityEngine';
import type { SpeechMessage, SpeechQueueItem } from '../../src/core/voice-assistant/types';

function makeMsg(overrides: Partial<SpeechMessage> = {}): SpeechMessage {
  return {
    id: `msg_${Date.now()}`,
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

function makeQueueItem(overrides: Partial<SpeechQueueItem> = {}): SpeechQueueItem {
  const base = makeMsg(overrides);
  return {
    ...base,
    enqueuedAt: Date.now(),
    queuePosition: 0,
    priorityScore: 0,
    starvationScore: 0,
    ...overrides,
  };
}

describe('SpeechPriorityEngine', () => {
  let engine: SpeechPriorityEngine;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    engine = new SpeechPriorityEngine();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('critical has lowest weight score', () => {
    const critical = makeMsg({ priority: 'critical' });
    const normal = makeMsg({ priority: 'normal' });
    expect(engine.computePriorityScore(critical)).toBeLessThan(
      engine.computePriorityScore(normal),
    );
  });

  it('emergency category maps to critical priority', () => {
    expect(engine.getPriorityForCategory('emergency')).toBe('critical');
  });

  it('navigation category maps to high priority', () => {
    expect(engine.getPriorityForCategory('navigation')).toBe('high');
  });

  it('notification category maps to background priority', () => {
    expect(engine.getPriorityForCategory('notification')).toBe('background');
  });

  it('critical always interrupts current', () => {
    const current = makeMsg({ priority: 'high' });
    const incoming = makeMsg({ priority: 'critical' });
    expect(engine.shouldInterrupt(current, incoming)).toBe(true);
  });

  it('high interrupts non-critical', () => {
    const current = makeMsg({ priority: 'normal' });
    const incoming = makeMsg({ priority: 'high' });
    expect(engine.shouldInterrupt(current, incoming)).toBe(true);
  });

  it('normal does not interrupt high', () => {
    const current = makeMsg({ priority: 'high' });
    const incoming = makeMsg({ priority: 'normal' });
    expect(engine.shouldInterrupt(current, incoming)).toBe(false);
  });

  it('any priority interrupts background', () => {
    const current = makeMsg({ priority: 'background' });
    const incoming = makeMsg({ priority: 'low' });
    expect(engine.shouldInterrupt(current, incoming)).toBe(true);
  });

  it('empty current means always interrupt', () => {
    expect(engine.shouldInterrupt(null, makeMsg({ priority: 'low' }))).toBe(true);
  });

  it('detects duplicate within window', () => {
    const existing = [makeMsg({ text: 'Hello', priority: 'normal', category: 'system' })];
    const incoming = makeMsg({ text: 'Hello', priority: 'normal', category: 'system' });
    expect(engine.isDuplicate(existing, incoming, 10000)).toBe(true);
  });

  it('allows non-duplicate text', () => {
    const existing = [makeMsg({ text: 'Hello', priority: 'normal', category: 'system' })];
    const incoming = makeMsg({ text: 'World', priority: 'normal', category: 'system' });
    expect(engine.isDuplicate(existing, incoming, 10000)).toBe(false);
  });

  it('allows same text different priority', () => {
    const existing = [makeMsg({ text: 'Hello', priority: 'normal', category: 'system' })];
    const incoming = makeMsg({ text: 'Hello', priority: 'high', category: 'system' });
    expect(engine.isDuplicate(existing, incoming, 10000)).toBe(false);
  });

  it('computes starvation score after threshold', () => {
    const item = makeQueueItem({ priority: 'low', enqueuedAt: Date.now() - 10000 });
    const score = engine.computeStarvationScore(item, Date.now());
    expect(score).toBeGreaterThan(0);
  });

  it('gives zero starvation score before threshold', () => {
    const item = makeQueueItem({ priority: 'low', enqueuedAt: Date.now() - 1000 });
    const score = engine.computeStarvationScore(item, Date.now());
    expect(score).toBe(0);
  });

  it('inserts critical before normal in queue', () => {
    const normal = makeQueueItem({ priority: 'normal' });
    const critical = makeQueueItem({ priority: 'critical' });
    const queue: SpeechQueueItem[] = [];

    const normalScore = engine.computePriorityScore(normal);
    const normalIdx = engine.getQueueInsertIndex(queue, normal);
    queue.splice(normalIdx, 0, { ...normal, priorityScore: normalScore });

    const criticalScore = engine.computePriorityScore(critical);
    const criticalIdx = engine.getQueueInsertIndex(queue, critical);
    queue.splice(criticalIdx, 0, { ...critical, priorityScore: criticalScore });

    expect(queue[0].priority).toBe('critical');
    expect(queue[1].priority).toBe('normal');
  });

  it('inserts background at end', () => {
    const critical = makeQueueItem({ priority: 'critical' });
    const high = makeQueueItem({ priority: 'high' });
    const bg = makeQueueItem({ priority: 'background' });
    const queue: SpeechQueueItem[] = [];

    const cScore = engine.computePriorityScore(critical);
    queue.splice(engine.getQueueInsertIndex(queue, critical), 0, { ...critical, priorityScore: cScore });

    const hScore = engine.computePriorityScore(high);
    queue.splice(engine.getQueueInsertIndex(queue, high), 0, { ...high, priorityScore: hScore });

    const bScore = engine.computePriorityScore(bg);
    queue.splice(engine.getQueueInsertIndex(queue, bg), 0, { ...bg, priorityScore: bScore });

    expect(queue[0].priority).toBe('critical');
    expect(queue[1].priority).toBe('high');
    expect(queue[2].priority).toBe('background');
  });
});
