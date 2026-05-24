import { TTSIntegrationLayer } from '../../src/core/voice-assistant/TTSIntegrationLayer';
import type { SpeechQueueItem } from '../../src/core/voice-assistant/types';

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
  accessibilityEngine: { announce: jest.fn() },
}));

function makeItem(overrides: Partial<SpeechQueueItem> = {}): SpeechQueueItem {
  return {
    id: `item_${Date.now()}`,
    text: 'Test TTS',
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

describe('TTSIntegrationLayer', () => {
  let tts: TTSIntegrationLayer;

  beforeEach(() => {
    jest.clearAllMocks();
    tts = new TTSIntegrationLayer();
  });

  afterEach(() => {
    tts.destroy();
  });

  it('speakViaTTS calls ttsService.speak', () => {
    const { ttsService } = jest.requireMock('../../src/core/native/TTSService');
    tts.speakViaTTS(makeItem({ text: 'Hello' }));
    expect(ttsService.speak).toHaveBeenCalledWith('Hello', 'normal');
  });

  it('announceViaAccessibility calls accessibilityEngine.announce', () => {
    const { accessibilityEngine } = jest.requireMock('../../src/core/accessibility');
    tts.announceViaAccessibility(makeItem({ text: 'Hello', priority: 'critical' }));
    expect(accessibilityEngine.announce).toHaveBeenCalledWith('Hello', 'critical', true);
  });

  it('deliver calls both channels', () => {
    const { ttsService } = jest.requireMock('../../src/core/native/TTSService');
    const { accessibilityEngine } = jest.requireMock('../../src/core/accessibility');
    tts.deliver(makeItem({ text: 'Test' }));
    expect(ttsService.speak).toHaveBeenCalled();
    expect(accessibilityEngine.announce).toHaveBeenCalled();
  });

  it('speakViaTTS respects quiet hours for non-critical', () => {
    tts = new TTSIntegrationLayer({
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    });
    jest.useFakeTimers({ now: new Date(2024, 0, 1, 23, 0, 0).getTime() });
    const { ttsService } = jest.requireMock('../../src/core/native/TTSService');
    tts.speakViaTTS(makeItem({ text: 'Quiet', priority: 'normal' }));
    expect(ttsService.speak).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('critical bypasses quiet hours', () => {
    tts = new TTSIntegrationLayer({
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    });
    jest.useFakeTimers({ now: new Date(2024, 0, 1, 23, 0, 0).getTime() });
    const { ttsService } = jest.requireMock('../../src/core/native/TTSService');
    tts.speakViaTTS(makeItem({ text: 'Emergency', priority: 'critical' }));
    expect(ttsService.speak).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('initialize sets bridge active', () => {
    const logger = jest.requireMock('../../src/core/debug').logger;
    tts.initialize();
    expect(logger.info).toHaveBeenCalledWith('[TTSIntegration] Bridge active');
  });

  it('initialize is idempotent', () => {
    const logger = jest.requireMock('../../src/core/debug').logger;
    tts.initialize();
    logger.info.mockClear();
    tts.initialize();
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('destroy prevents further operations', () => {
    const { ttsService } = jest.requireMock('../../src/core/native/TTSService');
    tts.destroy();
    tts.speakViaTTS(makeItem({ text: 'Dead' }));
    expect(ttsService.speak).not.toHaveBeenCalled();
  });
});
