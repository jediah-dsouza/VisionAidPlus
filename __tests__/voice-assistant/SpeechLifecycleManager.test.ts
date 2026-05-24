import { SpeechLifecycleManager } from '../../src/core/voice-assistant/SpeechLifecycleManager';
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

describe('SpeechLifecycleManager', () => {
  let lifecycle: SpeechLifecycleManager;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    jest.clearAllMocks();
    lifecycle = new SpeechLifecycleManager();
  });

  afterEach(() => {
    lifecycle.destroy();
    jest.useRealTimers();
  });

  it('starts in idle state', () => {
    expect(lifecycle.getState()).toBe('idle');
  });

  it('getCurrent returns null initially', () => {
    expect(lifecycle.getCurrent()).toBeNull();
  });

  it('speak returns true and transitions to speaking', async () => {
    const result = lifecycle.speak(makeMsg({ id: 'speak_1' }));
    expect(result).toBe(true);
    jest.advanceTimersByTime(50);
    await Promise.resolve();
    expect(lifecycle.getState()).toBe('speaking');
  });

  it('speak returns false for duplicate', () => {
    const msg = makeMsg({ id: 'dup_1', text: 'Same text' });
    lifecycle.speak(msg);
    const result = lifecycle.speak(msg);
    expect(result).toBe(false);
  });

  it('pause pauses speech', async () => {
    lifecycle.speak(makeMsg({ id: 'pause_1' }));
    jest.advanceTimersByTime(50);
    await Promise.resolve();
    lifecycle.pause();
    expect(lifecycle.getState()).toBe('paused');
  });

  it('pause is no-op when not speaking', () => {
    lifecycle.pause();
    expect(lifecycle.getState()).toBe('idle');
  });

  it('resume transitions back to idle and schedules processing', () => {
    lifecycle.speak(makeMsg({ id: 'resume_1' }));
    lifecycle.pause();
    lifecycle.resume();
    expect(lifecycle.getState()).toBe('idle');
  });

  it('resume is no-op when not paused', () => {
    lifecycle.resume();
    expect(lifecycle.getState()).toBe('idle');
  });

  it('cancelCurrent cancels the current item', () => {
    lifecycle.speak(makeMsg({ id: 'cancel_1' }));
    lifecycle.cancelCurrent();
    expect(lifecycle.getState()).toBe('idle');
    expect(lifecycle.getCurrent()).toBeNull();
  });

  it('hard stop sets state to idle and clears queue', () => {
    lifecycle.speak(makeMsg({ id: 'hard_1' }));
    lifecycle.speak(makeMsg({ id: 'hard_2' }));
    lifecycle.cancelAll();
    expect(lifecycle.getState()).toBe('idle');
    expect(lifecycle.getCurrent()).toBeNull();
    expect(lifecycle.getQueueManager().isEmpty()).toBe(true);
  });

  it('getQueueManager returns queue instance', () => {
    expect(lifecycle.getQueueManager()).toBeDefined();
  });

  it('getDedupEngine returns dedup engine instance', () => {
    expect(lifecycle.getDedupEngine()).toBeDefined();
  });

  it('getInterruptionCoordinator returns coordinator instance', () => {
    expect(lifecycle.getInterruptionCoordinator()).toBeDefined();
  });

  it('getPacingController returns pacing controller instance', () => {
    expect(lifecycle.getPacingController()).toBeDefined();
  });

  it('getMetrics returns metrics snapshot', () => {
    const metrics = lifecycle.getMetrics();
    expect(metrics).toHaveProperty('totalMessages');
  });

  it('destroy prevents future operations', () => {
    lifecycle.destroy();
    expect(lifecycle.speak(makeMsg({ id: 'dead' }))).toBe(false);
  });

  it('processes queue drain', async () => {
    lifecycle.speak(makeMsg({ id: 'drain_1' }));
    jest.advanceTimersByTime(50);
    await Promise.resolve();
    jest.advanceTimersByTime(500);
    await Promise.resolve();
    expect(lifecycle.getState()).toBe('idle');
  });

  it('cancelling leaves remaining item in queue', async () => {
    lifecycle.speak(makeMsg({ id: 'first', priority: 'critical' }));
    jest.advanceTimersByTime(50);
    await Promise.resolve();
    lifecycle.speak(makeMsg({ id: 'second' }));

    expect(lifecycle.getQueueManager().getLength()).toBe(1);
    lifecycle.cancelCurrent();
    expect(lifecycle.getState()).toBe('idle');
    expect(lifecycle.getQueueManager().isEmpty()).toBe(false);
  });
});
