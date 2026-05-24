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

describe('VoiceMetricsCollector', () => {
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

  it('starts with baseline metrics', () => {
    const snapshot = metrics.getSnapshot();
    expect(snapshot).toHaveProperty('totalMessages');
    expect(snapshot).toHaveProperty('totalSpoken');
    expect(snapshot).toHaveProperty('totalInterrupted');
    expect(snapshot).toHaveProperty('totalFailed');
    expect(snapshot).toHaveProperty('uptimeMs');
  });

  it('updates from external metrics', () => {
    metrics.updateFrom({
      totalMessages: 10,
      totalSpoken: 5,
      totalInterrupted: 2,
      totalFailed: 1,
      totalDuplicatesSuppressed: 3,
      totalStarvationPrevented: 1,
      averageQueueWaitMs: 500,
      peakQueueDepth: 8,
      currentQueueDepth: 3,
      uptimeMs: 60000,
      lastSpokenAt: null,
      errors: 0,
    });
    const snapshot = metrics.getSnapshot();
    expect(snapshot.totalMessages).toBe(10);
    expect(snapshot.totalSpoken).toBe(5);
  });

  it('records errors', () => {
    metrics.recordError();
    expect(metrics.getSnapshot().errors).toBe(1);
  });

  it('startAutoReporting publishes on interval', () => {
    const { eventBus } = jest.requireMock('../../src/core/events/EventBus');
    metrics.startAutoReporting(500);
    jest.advanceTimersByTime(1000);
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.stringContaining('METRICS'),
      expect.any(Object),
      'low',
    );
  });

  it('stopAutoReporting stops publishing', () => {
    const { eventBus } = jest.requireMock('../../src/core/events/EventBus');
    metrics.startAutoReporting(500);
    metrics.stopAutoReporting();
    jest.advanceTimersByTime(1000);
    // Only the first call from startAutoReporting
    expect(eventBus.publish).not.toHaveBeenCalledWith(
      expect.stringContaining('METRICS'),
      expect.any(Object),
      'low',
    );
  });

  it('reset clears snapshot', () => {
    metrics.updateFrom({
      totalMessages: 99, totalSpoken: 50, totalInterrupted: 5, totalFailed: 3,
      totalDuplicatesSuppressed: 2, totalStarvationPrevented: 0,
      averageQueueWaitMs: 100, peakQueueDepth: 20, currentQueueDepth: 0,
      uptimeMs: 99999, lastSpokenAt: null, errors: 5,
    });
    metrics.reset();
    const snapshot = metrics.getSnapshot();
    expect(snapshot.totalMessages).toBe(0);
    expect(snapshot.totalSpoken).toBe(0);
    expect(snapshot.errors).toBe(0);
  });

  it('destroy prevents auto-reporting and updateFrom', () => {
    metrics.updateFrom({
      totalMessages: 5, totalSpoken: 3, totalInterrupted: 0, totalFailed: 0,
      totalDuplicatesSuppressed: 1, totalStarvationPrevented: 0,
      averageQueueWaitMs: 100, peakQueueDepth: 4, currentQueueDepth: 0,
      uptimeMs: 1000, lastSpokenAt: null, errors: 0,
    });
    metrics.destroy();
    metrics.updateFrom({
      totalMessages: 99, totalSpoken: 50, totalInterrupted: 0, totalFailed: 0,
      totalDuplicatesSuppressed: 0, totalStarvationPrevented: 0,
      averageQueueWaitMs: 0, peakQueueDepth: 0, currentQueueDepth: 0,
      uptimeMs: 0, lastSpokenAt: null, errors: 0,
    });
    expect(metrics.getSnapshot().totalMessages).toBe(5);
  });

  it('uptimeMs increases over time', () => {
    const s1 = metrics.getSnapshot();
    jest.advanceTimersByTime(5000);
    const s2 = metrics.getSnapshot();
    expect(s2.uptimeMs).toBeGreaterThan(s1.uptimeMs);
  });
});
