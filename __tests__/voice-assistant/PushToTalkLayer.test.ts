import { PushToTalkLayer } from '../../src/core/voice-assistant/PushToTalkLayer';

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

describe('PushToTalkLayer', () => {
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

  it('starts inactive', () => {
    const state = ptt.getState();
    expect(state.active).toBe(false);
  });

  it('activate transitions to active state', () => {
    ptt.activate();
    expect(ptt.getState().active).toBe(true);
    expect(ptt.getState().startedAt).toBe(1000000);
  });

  it('deactivate returns to inactive', () => {
    ptt.activate();
    ptt.deactivate();
    expect(ptt.getState().active).toBe(false);
    expect(ptt.getState().startedAt).toBeNull();
  });

  it('deactivate returns snapshot of previous state', () => {
    ptt.activate();
    const snapshot = ptt.deactivate();
    expect(snapshot.active).toBe(true);
    expect(snapshot.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('auto-deactivates after timeout', () => {
    ptt.activate();
    jest.advanceTimersByTime(31000);
    expect(ptt.getState().active).toBe(false);
  });

  it('getLevel returns 0 when inactive', () => {
    expect(ptt.getLevel()).toBe(0);
  });

  it('getLevel returns value between 0-1 when active', () => {
    ptt.activate();
    const level = ptt.getLevel();
    expect(level).toBeGreaterThanOrEqual(0);
    expect(level).toBeLessThanOrEqual(1);
  });

  it('activations are idempotent', () => {
    ptt.activate();
    ptt.activate();
    expect(ptt.getState().active).toBe(true);
  });

  it('deactivations are idempotent', () => {
    ptt.deactivate();
    expect(ptt.getState().active).toBe(false);
  });

  it('isActive returns correct state', () => {
    expect(ptt.isActive()).toBe(false);
    ptt.activate();
    expect(ptt.isActive()).toBe(true);
  });

  it('publishes PTT_ACTIVATED event on activate', () => {
    const { eventBus } = jest.requireMock('../../src/core/events/EventBus');
    ptt.activate();
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.stringContaining('PTT_ACTIVATED'),
      expect.objectContaining({ startedAt: 1000000 }),
      'high',
    );
  });

  it('publishes PTT_DEACTIVATED event on deactivate', () => {
    const { eventBus } = jest.requireMock('../../src/core/events/EventBus');
    ptt.activate();
    jest.clearAllMocks();
    ptt.deactivate();
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.stringContaining('PTT_DEACTIVATED'),
      expect.any(Object),
      'normal',
    );
  });
});
