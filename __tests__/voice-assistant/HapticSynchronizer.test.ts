import { HapticSynchronizer } from '../../src/core/voice-assistant/HapticSynchronizer';
import type { SpeechQueueItem } from '../../src/core/voice-assistant/types';

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

jest.mock('../../src/core/accessibility', () => ({
  accessibilityEngine: { triggerHaptic: jest.fn() },
}));

function makeItem(overrides: Partial<SpeechQueueItem> = {}): SpeechQueueItem {
  return {
    id: `item_${Date.now()}`,
    text: 'Test haptic',
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
    enqueuedAt: Date.now(),
    queuePosition: 0,
    priorityScore: 0,
    starvationScore: 0,
    ...overrides,
  };
}

describe('HapticSynchronizer', () => {
  let haptic: HapticSynchronizer;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    jest.clearAllMocks();
    haptic = new HapticSynchronizer({ hapticCooldownMs: 1000 });
  });

  afterEach(() => {
    haptic.destroy();
    jest.useRealTimers();
  });

  it('triggers haptic for message with hapticPattern', () => {
    const { accessibilityEngine } = jest.requireMock('../../src/core/accessibility');
    haptic.syncWithSpeech(makeItem({ priority: 'critical', hapticPattern: 'critical' }));
    expect(accessibilityEngine.triggerHaptic).toHaveBeenCalled();
  });

  it('does nothing if no hapticPattern', () => {
    const { accessibilityEngine } = jest.requireMock('../../src/core/accessibility');
    haptic.syncWithSpeech(makeItem({ priority: 'critical' }));
    expect(accessibilityEngine.triggerHaptic).not.toHaveBeenCalled();
  });

  it('respects cooldown for non-critical', () => {
    const { accessibilityEngine } = jest.requireMock('../../src/core/accessibility');
    haptic.syncWithSpeech(makeItem({ hapticPattern: 'notification' }));
    haptic.syncWithSpeech(makeItem({ hapticPattern: 'notification' }));
    expect(accessibilityEngine.triggerHaptic).toHaveBeenCalledTimes(1);
  });

  it('does not trigger haptic for items without pattern', () => {
    const { accessibilityEngine } = jest.requireMock('../../src/core/accessibility');
    haptic.syncWithSpeech(makeItem());
    expect(accessibilityEngine.triggerHaptic).not.toHaveBeenCalled();
  });

  it('triggerPattern triggers haptic with cooldown', () => {
    const { accessibilityEngine } = jest.requireMock('../../src/core/accessibility');
    haptic.triggerPattern('notification');
    expect(accessibilityEngine.triggerHaptic).toHaveBeenCalledWith('notification');
  });

  it('triggerPattern respects cooldown', () => {
    const { accessibilityEngine } = jest.requireMock('../../src/core/accessibility');
    haptic.triggerPattern('notification');
    haptic.triggerPattern('notification');
    expect(accessibilityEngine.triggerHaptic).toHaveBeenCalledTimes(1);
  });

  it('getLastHapticAt returns 0 initially', () => {
    expect(haptic.getLastHapticAt()).toBe(0);
  });

  it('getLastHapticAt updates after trigger', () => {
    haptic.syncWithSpeech(makeItem({ hapticPattern: 'test' }));
    expect(haptic.getLastHapticAt()).toBe(1000000);
  });

  it('destroy prevents haptic triggers', () => {
    const { accessibilityEngine } = jest.requireMock('../../src/core/accessibility');
    haptic.destroy();
    haptic.syncWithSpeech(makeItem({ hapticPattern: 'test' }));
    expect(accessibilityEngine.triggerHaptic).not.toHaveBeenCalled();
  });
});
