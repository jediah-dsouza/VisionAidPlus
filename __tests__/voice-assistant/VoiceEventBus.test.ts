import { VOICE_EVENTS, subscribeToSpeechLifecycle, subscribeToVoiceCommandEvents } from '../../src/core/voice-assistant/VoiceEventBus';

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

describe('VoiceEventBus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes VOICE_EVENTS constants', () => {
    expect(VOICE_EVENTS.SPEECH_STARTED).toBe('VOICE_SPEECH_STARTED');
    expect(VOICE_EVENTS.SPEECH_COMPLETED).toBe('VOICE_SPEECH_COMPLETED');
    expect(VOICE_EVENTS.SPEECH_INTERRUPTED).toBe('VOICE_SPEECH_INTERRUPTED');
    expect(VOICE_EVENTS.COMMAND_RECEIVED).toBe('VOICE_COMMAND_RECEIVED');
    expect(VOICE_EVENTS.PTT_ACTIVATED).toBe('VOICE_PTT_ACTIVATED');
    expect(VOICE_EVENTS.WAVEFORM_UPDATE).toBe('VOICE_WAVEFORM_UPDATE');
    expect(VOICE_EVENTS.METRICS_UPDATE).toBe('VOICE_METRICS_UPDATE');
  });

  it('provides event count', () => {
    expect(Object.keys(VOICE_EVENTS).length).toBeGreaterThan(0);
  });

  it('subscribeToSpeechLifecycle wires to eventBus.subscribe', () => {
    const { eventBus } = jest.requireMock('../../src/core/events/EventBus');
    const handler = jest.fn();
    const unsub = subscribeToSpeechLifecycle(handler);
    expect(eventBus.subscribe).toHaveBeenCalledWith(VOICE_EVENTS.SPEECH_QUEUED, handler, 'normal');
    expect(typeof unsub).toBe('function');
  });

  it('subscribeToSpeechLifecycle with multiple handlers', () => {
    const { eventBus } = jest.requireMock('../../src/core/events/EventBus');
    const h1 = jest.fn();
    const h2 = jest.fn();
    const h3 = jest.fn();
    subscribeToSpeechLifecycle(h1, h2, h3);
    expect(eventBus.subscribe).toHaveBeenCalledWith(VOICE_EVENTS.SPEECH_QUEUED, h1, 'normal');
    expect(eventBus.subscribe).toHaveBeenCalledWith(VOICE_EVENTS.SPEECH_STARTED, h2, 'high');
    expect(eventBus.subscribe).toHaveBeenCalledWith(VOICE_EVENTS.SPEECH_COMPLETED, h3, 'normal');
  });

  it('subscribeToVoiceCommandEvents wires to eventBus.subscribe', () => {
    const { eventBus } = jest.requireMock('../../src/core/events/EventBus');
    const handler = jest.fn();
    const unsub = subscribeToVoiceCommandEvents(handler);
    expect(eventBus.subscribe).toHaveBeenCalledWith(VOICE_EVENTS.COMMAND_RECEIVED, handler, 'high');
    expect(typeof unsub).toBe('function');
  });

  it('unsubscribe from speech lifecycle', () => {
    const { eventBus } = jest.requireMock('../../src/core/events/EventBus');
    eventBus.subscribe.mockReturnValue(jest.fn());
    const unsub = subscribeToSpeechLifecycle(jest.fn());
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('unsubscribe from voice command events', () => {
    const { eventBus } = jest.requireMock('../../src/core/events/EventBus');
    eventBus.subscribe.mockReturnValue(jest.fn());
    const unsub = subscribeToVoiceCommandEvents(jest.fn());
    expect(typeof unsub).toBe('function');
    unsub();
  });
});
