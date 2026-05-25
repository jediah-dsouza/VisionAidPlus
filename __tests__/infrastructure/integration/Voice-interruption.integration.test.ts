import { eventBus } from '../../../src/core/events/EventBus';
import { VOICE_EVENTS } from '../../../src/core/voice-assistant/VoiceEventBus';
import { MockRegistry } from '../MockRegistry';
import { flushPromises } from '../helpers/asyncLifecycle';

beforeAll(() => {
  MockRegistry.resetAll();
});

afterEach(() => {
  eventBus.removeAllListeners();
});

function subscribeOnce(event: string, handler: (p: unknown) => void): () => void {
  const unsub = eventBus.subscribe(event, (p: unknown) => {
    unsub();
    handler(p);
  });
  return unsub;
}

describe('Voice Lifecycle Integration', () => {
  it('speech lifecycle events fire correctly', () => {
    const started = jest.fn();
    const completed = jest.fn();
    eventBus.subscribe(VOICE_EVENTS.SPEECH_STARTED, started);
    eventBus.subscribe(VOICE_EVENTS.SPEECH_COMPLETED, completed);

    eventBus.publish(VOICE_EVENTS.SPEECH_STARTED, { utterance: 'hello' });
    eventBus.publish(VOICE_EVENTS.SPEECH_COMPLETED, { utterance: 'hello' });

    expect(started).toHaveBeenCalledWith({ utterance: 'hello' });
    expect(completed).toHaveBeenCalledWith({ utterance: 'hello' });
  });

  it('publish and receive round-trip through eventBus', async () => {
    let received: unknown = null;
    subscribeOnce(VOICE_EVENTS.SPEECH_INTERRUPTED, p => { received = p; });

    eventBus.publish(VOICE_EVENTS.SPEECH_INTERRUPTED, { reason: 'priority' });
    await flushPromises();

    expect(received).toEqual({ reason: 'priority' });
  });

  it('unsubscribe prevents handler call', () => {
    const handler = jest.fn();
    const unsub = eventBus.subscribe(VOICE_EVENTS.SPEECH_FAILED, handler);
    unsub();

    eventBus.publish(VOICE_EVENTS.SPEECH_FAILED, { message: 'error' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('removeAllListeners clears voice subscriptions', () => {
    const handler = jest.fn();
    eventBus.subscribe(VOICE_EVENTS.SPEECH_QUEUED, handler);
    eventBus.removeAllListeners();

    eventBus.publish(VOICE_EVENTS.SPEECH_QUEUED, {});

    expect(handler).not.toHaveBeenCalled();
  });

  it('double unsubscribe is safe', () => {
    const handler = jest.fn();
    const unsub = eventBus.subscribe(VOICE_EVENTS.SPEECH_PAUSED, handler);
    unsub();

    expect(() => unsub()).not.toThrow();
  });
});
