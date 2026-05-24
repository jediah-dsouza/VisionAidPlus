import { SpeechDeduplicationEngine } from '../../src/core/voice-assistant/SpeechDeduplicationEngine';
import type { SpeechMessage } from '../../src/core/voice-assistant/types';

jest.mock('../../src/core/debug', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

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

describe('SpeechDeduplicationEngine', () => {
  let dedup: SpeechDeduplicationEngine;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    dedup = new SpeechDeduplicationEngine({ dedupWindowMs: 5000 });
  });

  afterEach(() => {
    dedup.destroy();
    jest.useRealTimers();
  });

  it('returns false for new messages', () => {
    expect(dedup.isDuplicate(makeMsg({ text: 'Hello' }))).toBe(false);
  });

  it('detects duplicate after recording', () => {
    dedup.record(makeMsg({ text: 'Hello' }));
    expect(dedup.isDuplicate(makeMsg({ text: 'Hello' }))).toBe(true);
  });

  it('ignores duplicates outside window', () => {
    dedup.record(makeMsg({ text: 'Old', timestamp: Date.now() - 10000 }));
    expect(dedup.isDuplicate(makeMsg({ text: 'Old' }))).toBe(false);
  });

  it('critical messages bypass dedup', () => {
    const msg = makeMsg({ text: 'Critical alert', priority: 'critical' });
    dedup.record(msg);
    expect(dedup.isDuplicate(msg)).toBe(false);
  });

  it('tracks entry count', () => {
    dedup.record(makeMsg({ text: 'A' }));
    dedup.record(makeMsg({ text: 'B' }));
    expect(dedup.getEntryCount()).toBe(2);
  });

  it('clear resets all entries', () => {
    dedup.record(makeMsg({ text: 'A' }));
    dedup.clear();
    expect(dedup.getEntryCount()).toBe(0);
  });

  it('prunes entries when over 200', () => {
    for (let i = 0; i < 250; i++) {
      dedup.record(makeMsg({ text: `Message ${i}` }));
    }
    expect(dedup.getEntryCount()).toBeLessThanOrEqual(200);
  });

  it('destroy prevents duplicate checking', () => {
    dedup.destroy();
    expect(dedup.isDuplicate(makeMsg({ text: 'Anything' }))).toBe(false);
  });

  it('differentiates by priority', () => {
    dedup.record(makeMsg({ text: 'Hello', priority: 'normal' }));
    expect(dedup.isDuplicate(makeMsg({ text: 'Hello', priority: 'high' }))).toBe(false);
  });

  it('differentiates by category', () => {
    dedup.record(makeMsg({ text: 'Alert', category: 'emergency' }));
    expect(dedup.isDuplicate(makeMsg({ text: 'Alert', category: 'system' }))).toBe(false);
  });
});
