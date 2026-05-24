import { DetectionSessionManager } from '../../src/core/camera/DetectionSessionManager';

jest.mock('../../src/core/debug', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../src/core/events/EventBus', () => ({
  eventBus: {
    subscribe: jest.fn(() => jest.fn()),
    publish: jest.fn(),
  },
  EVENTS: {},
}));

jest.mock('../../src/core/events/AI_EVENTS', () => ({
  AI_EVENTS: {
    SESSION_STATE_CHANGE: 'ai:sessionStateChange',
    METRICS_UPDATE: 'ai:metricsUpdate',
  },
}));

describe('DetectionSessionManager', () => {
  let manager: DetectionSessionManager;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    manager = new DetectionSessionManager({ targetFps: 30 });
  });

  afterEach(() => {
    manager.destroy();
    jest.useRealTimers();
  });

  it('starts idle', () => {
    expect(manager.getState()).toBe('idle');
  });

  it('start transitions to active and publishes event', () => {
    const { eventBus } = require('../../src/core/events/EventBus');
    manager.start();
    expect(manager.getState()).toBe('active');
    expect(eventBus.publish).toHaveBeenCalledWith('ai:sessionStateChange', { state: 'active', sessionId: expect.any(String) }, 'normal');
  });

  it('stop transitions to idle and publishes metrics', () => {
    manager.start();
    manager.stop();
    expect(manager.getState()).toBe('idle');
    const { eventBus } = require('../../src/core/events/EventBus');
    expect(eventBus.publish).toHaveBeenCalledWith('ai:metricsUpdate', expect.any(Object), 'low');
  });

  it('returns a unique session id', () => {
    manager.start();
    expect(manager.getSessionId()).toMatch(/^session_/);
  });

  it('updateMetrics merges partial metrics', () => {
    manager.start();
    manager.updateMetrics({ totalFrames: 100, processedFrames: 80 });
    const metrics = manager.getMetrics();
    expect(metrics.totalFrames).toBe(100);
    expect(metrics.processedFrames).toBe(80);
    expect(metrics.uptimeMs).toBeGreaterThanOrEqual(0);
  });

  it('getMetrics includes uptime', () => {
    manager.start();
    jest.advanceTimersByTime(5000);
    const metrics = manager.getMetrics();
    expect(metrics.uptimeMs).toBeGreaterThanOrEqual(5000);
  });

  it('destroy stops the session', () => {
    manager.start();
    manager.destroy();
    expect(manager.getState()).toBe('idle');
  });
});
