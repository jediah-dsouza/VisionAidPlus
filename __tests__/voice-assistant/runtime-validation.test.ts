import { SpeechLifecycleManager } from '../../src/core/voice-assistant/SpeechLifecycleManager';
import { SpeechQueueManager } from '../../src/core/voice-assistant/SpeechQueueManager';
import { InterruptionCoordinator } from '../../src/core/voice-assistant/InterruptionCoordinator';
import { SpeechDeduplicationEngine } from '../../src/core/voice-assistant/SpeechDeduplicationEngine';
import { WaveformPipeline } from '../../src/core/voice-assistant/WaveformPipeline';
import { PushToTalkLayer } from '../../src/core/voice-assistant/PushToTalkLayer';
import { VoiceMetricsCollector } from '../../src/core/voice-assistant/VoiceMetricsCollector';
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

jest.mock('../../src/core/native/TTSService', () => ({
  ttsService: { speak: jest.fn() },
}));

jest.mock('../../src/core/accessibility', () => ({
  accessibilityEngine: { announce: jest.fn(), triggerHaptic: jest.fn() },
}));

function makeMsg(overrides: Partial<SpeechMessage> = {}): SpeechMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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

// ── Runtime Validation Tests ──────────────────────────────────────────────────

describe('Runtime Validation: SpeechLifecycleManager', () => {
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

  it('recovers after cancelAll', () => {
    lifecycle.speak(makeMsg({ id: 'stop_me' }));
    lifecycle.cancelAll();
    expect(lifecycle.getState()).toBe('idle');
    expect(lifecycle.getCurrent()).toBeNull();
  });

  it('processes multiple messages sequentially', async () => {
    lifecycle.speak(makeMsg({ id: 'a', priority: 'high' }));
    jest.advanceTimersByTime(50);
    await Promise.resolve();
    lifecycle.speak(makeMsg({ id: 'b', priority: 'normal' }));
    lifecycle.speak(makeMsg({ id: 'c', priority: 'low' }));

    expect(lifecycle.getQueueManager().getLength()).toBe(2);
    expect(lifecycle.getState()).toBe('speaking');
  });

  it('interrupts with critical message', async () => {
    lifecycle.speak(makeMsg({ id: 'normal_1', priority: 'normal' }));
    jest.advanceTimersByTime(50);
    await Promise.resolve();
    lifecycle.speak(makeMsg({ id: 'critical_1', priority: 'critical' }));
    jest.advanceTimersByTime(500);
    await Promise.resolve();
    jest.advanceTimersByTime(500);
    await Promise.resolve();
    expect(lifecycle.getState()).toBe('speaking');
  });
});

describe('Runtime Validation: Interrupt Storms', () => {
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

  it('handles rapid critical interruptions', () => {
    queue.enqueue(makeMsg({ id: 'a', priority: 'normal' }));
    queue.enqueue(makeMsg({ id: 'b', priority: 'critical' }));
    queue.enqueue(makeMsg({ id: 'c', priority: 'critical' }));

    expect(queue.dequeue()?.id).toBe('b');
    expect(queue.dequeue()?.id).toBe('c');
    expect(queue.dequeue()?.id).toBe('a');
  });
});

describe('Runtime Validation: Dedup + Queue Flood', () => {
  let dedup: SpeechDeduplicationEngine;
  let queue: SpeechQueueManager;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    jest.clearAllMocks();
    dedup = new SpeechDeduplicationEngine({ dedupWindowMs: 5000 });
    queue = new SpeechQueueManager({ maxQueueSize: 10 });
  });

  afterEach(() => {
    dedup.destroy();
    queue.destroy();
    jest.useRealTimers();
  });

  it('rejects duplicates in rapid succession', () => {
    const msg = makeMsg({ text: 'Flood', id: 'flood_1' });
    dedup.record(msg);
    let accepted = 0;
    for (let i = 0; i < 5; i++) {
      const incoming = makeMsg({ text: 'Flood', id: `flood_${i}` });
      if (!dedup.isDuplicate(incoming)) {
        dedup.record(incoming);
        queue.enqueue(incoming);
        accepted++;
      }
    }
    expect(accepted).toBe(0);
  });

  it('allows different text in flood', () => {
    for (let i = 0; i < 10; i++) {
      const incoming = makeMsg({ text: `Unique ${i}`, id: `uniq_${i}` });
      if (!dedup.isDuplicate(incoming)) {
        dedup.record(incoming);
        queue.enqueue(incoming);
      }
    }
    expect(queue.getLength()).toBe(10);
  });
});

describe('Runtime Validation: PTT Lifecycle', () => {
  let ptt: PushToTalkLayer;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    jest.clearAllMocks();
    ptt = new PushToTalkLayer({ pttTimeoutMs: 30000 });
  });

  afterEach(() => {
    ptt.destroy();
    jest.useRealTimers();
  });

  it('handles rapid activate/deactivate cycle', () => {
    for (let i = 0; i < 5; i++) {
      ptt.activate();
      ptt.deactivate();
    }
    expect(ptt.getState().active).toBe(false);
  });

  it('records duration on deactivate', () => {
    ptt.activate();
    jest.advanceTimersByTime(2000);
    const snapshot = ptt.deactivate();
    expect(snapshot.durationMs).toBeGreaterThanOrEqual(1900);
  });
});

describe('Runtime Validation: Waveform Lifecycle', () => {
  let waveform: WaveformPipeline;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    jest.clearAllMocks();
    waveform = new WaveformPipeline();
  });

  afterEach(() => {
    waveform.destroy();
    jest.useRealTimers();
  });

  it('handles consecutive segments', () => {
    waveform.startSegment('seg_a');
    jest.advanceTimersByTime(200);
    waveform.endSegment();
    waveform.startSegment('seg_b');
    jest.advanceTimersByTime(200);
    waveform.endSegment();
    expect(waveform.getRecentSegments().length).toBe(2);
  });
});

describe('Runtime Validation: Metrics Reporting', () => {
  let metrics: VoiceMetricsCollector;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    jest.clearAllMocks();
    metrics = new VoiceMetricsCollector();
  });

  afterEach(() => {
    metrics.destroy();
    jest.useRealTimers();
  });

  it('reports on interval', () => {
    const { eventBus } = jest.requireMock('../../src/core/events/EventBus');
    metrics.startAutoReporting(500);
    jest.advanceTimersByTime(1000);
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.stringContaining('METRICS'),
      expect.any(Object),
      'low',
    );
  });

  it('updateFrom reflects external changes', () => {
    metrics.updateFrom({
      totalMessages: 42, totalSpoken: 20, totalInterrupted: 5, totalFailed: 2,
      totalDuplicatesSuppressed: 3, totalStarvationPrevented: 1,
      averageQueueWaitMs: 250, peakQueueDepth: 10, currentQueueDepth: 2,
      uptimeMs: 50000, lastSpokenAt: null, errors: 0,
    });
    expect(metrics.getSnapshot().totalMessages).toBe(42);
  });
});
