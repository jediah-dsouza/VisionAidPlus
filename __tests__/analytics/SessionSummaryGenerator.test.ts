import { SessionSummaryGenerator } from '../../src/core/analytics/SessionSummaryGenerator';
import type { AnalyticsEvent } from '../../src/core/analytics/types';

function makeEvent(overrides?: Partial<AnalyticsEvent>): AnalyticsEvent {
  return {
    id: `evt_${Math.random()}`,
    timestamp: Date.now(),
    category: 'safety',
    severity: 'info',
    source: 'system',
    eventType: 'test',
    sessionId: 's1',
    sequence: 1,
    payload: {},
    ...overrides,
  };
}

describe('SessionSummaryGenerator', () => {
  let gen: SessionSummaryGenerator;

  beforeEach(() => {
    gen = new SessionSummaryGenerator();
  });

  afterEach(() => {
    gen.destroy();
  });

  it('snapshot returns null when no session active', () => {
    expect(gen.snapshot()).toBeNull();
  });

  it('startSession initializes a new session', () => {
    gen.startSession('session-1');
    const snap = gen.snapshot();
    expect(snap).not.toBeNull();
    expect(snap!.sessionId).toBe('session-1');
    expect(snap!.isActive).toBe(true);
    expect(snap!.totalDetections).toBe(0);
  });

  it('tracks obstacle detections', () => {
    gen.startSession('s1');
    gen.processEvent(makeEvent({ category: 'obstacle' }));
    expect(gen.snapshot()!.totalDetections).toBe(1);
    expect(gen.snapshot()!.totalObstacles).toBe(1);
  });

  it('tracks alert events', () => {
    gen.startSession('s1');
    gen.processEvent(makeEvent({ category: 'safety' }));
    gen.processEvent(makeEvent({ category: 'alert' }));
    expect(gen.snapshot()!.totalAlerts).toBe(2);
  });

  it('tracks critical events', () => {
    gen.startSession('s1');
    gen.processEvent(makeEvent({ category: 'safety', severity: 'critical' }));
    gen.processEvent(makeEvent({ category: 'alert', severity: 'warning' }));
    expect(gen.snapshot()!.criticalEvents).toBe(1);
  });

  it('computes average confidence', () => {
    gen.startSession('s1');
    gen.processEvent(makeEvent({ payload: { confidence: 0.8 } }));
    gen.processEvent(makeEvent({ payload: { confidence: 0.9 } }));
    expect(gen.snapshot()!.averageConfidence).toBeCloseTo(0.85, 10);
  });

  it('endSession returns summary and resets', () => {
    gen.startSession('s1');
    gen.processEvent(makeEvent({ category: 'obstacle' }));
    const summary = gen.endSession();
    expect(summary).not.toBeNull();
    expect(summary!.sessionId).toBe('s1');
    expect(summary!.isActive).toBe(false);
    expect(summary!.endTime).toBeGreaterThan(summary!.startTime);
    expect(summary!.totalDetections).toBe(1);
    expect(gen.snapshot()).toBeNull();
  });

  it('endSession returns null if no active session', () => {
    expect(gen.endSession()).toBeNull();
  });

  it('ignores events before session start', () => {
    gen.processEvent(makeEvent({ category: 'obstacle' }));
    expect(gen.snapshot()).toBeNull();
  });
});
