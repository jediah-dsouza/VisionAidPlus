import { CommandHistoryRegistry } from '../../src/core/voice-assistant/CommandHistoryRegistry';
import type { VoiceCommand } from '../../src/core/voice-assistant/types';

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

function makeCmd(overrides: Partial<VoiceCommand> = {}): VoiceCommand {
  return {
    id: `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    text: 'Test command',
    timestamp: Date.now(),
    confidence: 0.9,
    source: 'user',
    processed: false,
    ...overrides,
  };
}

describe('CommandHistoryRegistry', () => {
  let history: CommandHistoryRegistry;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    jest.clearAllMocks();
    history = new CommandHistoryRegistry({ commandHistoryMax: 5 });
  });

  afterEach(() => {
    history.destroy();
    jest.useRealTimers();
  });

  it('starts empty', () => {
    expect(history.getCount()).toBe(0);
    expect(history.getLastCommand()).toBeNull();
  });

  it('records commands', () => {
    history.record(makeCmd({ id: 'cmd_1' }));
    expect(history.getCount()).toBe(1);
  });

  it('retrieves last command', () => {
    history.record(makeCmd({ id: 'cmd_1' }));
    history.record(makeCmd({ id: 'cmd_2' }));
    expect(history.getLastCommand()?.id).toBe('cmd_2');
  });

  it('marks command as executed', () => {
    history.record(makeCmd({ id: 'exec_cmd' }));
    history.markExecuted('exec_cmd', 'success', 150);
    const cmd = history.getLastCommand();
    expect(cmd?.processed).toBe(true);
    expect(cmd?.result).toBe('success');
    expect(cmd?.durationMs).toBe(150);
  });

  it('limits history size', () => {
    for (let i = 0; i < 10; i++) {
      history.record(makeCmd({ id: `cmd_${i}` }));
    }
    expect(history.getCount()).toBeLessThanOrEqual(5);
  });

  it('getHistory returns in reverse order', () => {
    history.record(makeCmd({ id: 'first' }));
    history.record(makeCmd({ id: 'second' }));
    const hist = history.getHistory();
    expect(hist[0].id).toBe('second');
    expect(hist[1].id).toBe('first');
  });

  it('getHistory respects limit', () => {
    history.record(makeCmd({ id: 'a' }));
    history.record(makeCmd({ id: 'b' }));
    history.record(makeCmd({ id: 'c' }));
    expect(history.getHistory(2).length).toBe(2);
  });

  it('getRecent returns commands within time window', () => {
    history.record(makeCmd({ id: 'recent', timestamp: Date.now() - 1000 }));
    history.record(makeCmd({ id: 'old', timestamp: Date.now() - 120000 }));
    expect(history.getRecent(60).length).toBe(1);
  });

  it('clear resets everything', () => {
    history.record(makeCmd({ id: 'test' }));
    history.clear();
    expect(history.getCount()).toBe(0);
  });
});
