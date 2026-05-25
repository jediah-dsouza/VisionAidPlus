import { SessionAnalyticsCoordinator } from '../../src/core/analytics/SessionAnalyticsCoordinator';
import { AnalyticsAggregationEngine } from '../../src/core/analytics/AnalyticsAggregationEngine';
import type { AnalyticsEvent } from '../../src/core/analytics/types';

class TestEngine extends AnalyticsAggregationEngine {
  private data = { totalAlerts: 0, totalObstacles: 0, criticalEvents: 0, averageConfidence: 0 };
  constructor() { super('test_coord_engine'); }
  processEvent(event: AnalyticsEvent): void {
    this.trackEvent(() => {
      if (event.category === 'safety') this.data.totalAlerts++;
      if (event.category === 'obstacle') this.data.totalObstacles++;
      if (event.severity === 'critical') this.data.criticalEvents++;
    });
  }
  snapshot() { return { ...this.data }; }
  reset() { this.data = { totalAlerts: 0, totalObstacles: 0, criticalEvents: 0, averageConfidence: 0 }; }
}

describe('SessionAnalyticsCoordinator', () => {
  let coordinator: SessionAnalyticsCoordinator;

  beforeEach(() => {
    coordinator = new SessionAnalyticsCoordinator();
  });

  afterEach(() => {
    coordinator.destroy();
  });

  it('starts inactive', () => {
    expect(coordinator.getIsActive()).toBe(false);
    expect(coordinator.getActiveSessionId()).toBeNull();
  });

  it('startSession activates session and resets engines', () => {
    const engine = new TestEngine();
    coordinator.registerEngine(engine);
    engine.processEvent({ id: '1', timestamp: Date.now(), eventType: 'pre', sessionId: 's1', sequence: 1, category: 'safety', severity: 'info', source: 'system', payload: {} });
    coordinator.startSession('session-1');
    expect(coordinator.getIsActive()).toBe(true);
    expect(coordinator.getActiveSessionId()).toBe('session-1');
  });

  it('endSession returns summary', () => {
    const engine = new TestEngine();
    coordinator.registerEngine(engine);
    coordinator.startSession('s1');
    engine.processEvent({ id: '1', timestamp: Date.now(), eventType: 'obs', sessionId: 's1', sequence: 1, category: 'obstacle', severity: 'info', source: 'system', payload: {} });
    const summary = coordinator.endSession();
    expect(summary).not.toBeNull();
    expect(summary!.sessionId).toBe('s1');
    expect(summary!.isActive).toBe(false);
    expect(coordinator.getIsActive()).toBe(false);
  });

  it('endSession returns null when no active session', () => {
    expect(coordinator.endSession()).toBeNull();
  });

  it('startSession ends previous session first', () => {
    coordinator.startSession('s1');
    coordinator.startSession('s2');
    expect(coordinator.getActiveSessionId()).toBe('s2');
  });

  it('calls onSessionStart callback', () => {
    const onStart = jest.fn();
    coordinator = new SessionAnalyticsCoordinator({ onSessionStart: onStart });
    coordinator.startSession('s1');
    expect(onStart).toHaveBeenCalledWith('s1');
  });

  it('calls onSessionEnd callback', () => {
    const onEnd = jest.fn();
    coordinator = new SessionAnalyticsCoordinator({ onSessionEnd: onEnd });
    coordinator.startSession('s1');
    coordinator.endSession();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('registerEngine adds engine to list', () => {
    const engine = new TestEngine();
    coordinator.registerEngine(engine);
    coordinator.startSession('s1');
    expect(coordinator.getIsActive()).toBe(true);
  });

  it('does not operate after destroy', () => {
    coordinator.destroy();
    coordinator.startSession('s1');
    expect(coordinator.getActiveSessionId()).toBeNull();
  });
});
