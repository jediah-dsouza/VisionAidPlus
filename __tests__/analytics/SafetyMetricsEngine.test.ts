import { SafetyMetricsEngine } from '../../src/core/analytics/SafetyMetricsEngine';
import type { AnalyticsEvent } from '../../src/core/analytics/types';

function makeEvent(overrides?: Partial<AnalyticsEvent>): AnalyticsEvent {
  return {
    id: `evt_${Math.random()}`,
    timestamp: Date.now(),
    category: 'safety',
    severity: 'info',
    source: 'system',
    eventType: 'safety_event',
    sessionId: 's1',
    sequence: 1,
    payload: {},
    ...overrides,
  };
}

describe('SafetyMetricsEngine', () => {
  let engine: SafetyMetricsEngine;

  beforeEach(() => {
    engine = new SafetyMetricsEngine();
  });

  afterEach(() => {
    engine.destroy();
  });

  it('starts with zero counts', () => {
    const snap = engine.snapshot();
    expect(snap.hazardCount).toBe(0);
    expect(snap.criticalAlerts).toBe(0);
    expect(snap.warnings).toBe(0);
    expect(snap.infoEvents).toBe(0);
  });

  it('counts critical events', () => {
    engine.processEvent(makeEvent({ severity: 'critical' }));
    const snap = engine.snapshot();
    expect(snap.hazardCount).toBe(1);
    expect(snap.criticalAlerts).toBe(1);
  });

  it('counts warning events', () => {
    engine.processEvent(makeEvent({ severity: 'warning' }));
    const snap = engine.snapshot();
    expect(snap.hazardCount).toBe(1);
    expect(snap.warnings).toBe(1);
  });

  it('counts info events', () => {
    engine.processEvent(makeEvent({ severity: 'info' }));
    const snap = engine.snapshot();
    expect(snap.hazardCount).toBe(0);
    expect(snap.infoEvents).toBe(1);
  });

  it('tracks response times', () => {
    engine.processEvent(makeEvent({ duration: 100 }));
    engine.processEvent(makeEvent({ duration: 200 }));
    const snap = engine.snapshot();
    expect(snap.responseTimeAverageMs).toBe(150);
  });

  it('calculates P95 response time', () => {
    for (let i = 0; i < 100; i++) {
      engine.processEvent(makeEvent({ duration: i }));
    }
    const snap = engine.snapshot();
    expect(snap.responseTimeP95Ms).toBeGreaterThanOrEqual(94);
  });

  it('computes severity ratio', () => {
    engine.processEvent(makeEvent({ severity: 'critical' }));
    engine.processEvent(makeEvent({ severity: 'critical' }));
    engine.processEvent(makeEvent({ severity: 'warning' }));
    engine.processEvent(makeEvent({ severity: 'info' }));
    const snap = engine.snapshot();
    expect(snap.severityRatio.critical).toBeCloseTo(0.5, 1);
    expect(snap.severityRatio.warning).toBeCloseTo(0.25, 1);
    expect(snap.severityRatio.info).toBeCloseTo(0.25, 1);
  });

  it('includes timeSeries in snapshot', () => {
    engine.processEvent(makeEvent({ severity: 'critical' }));
    const snap = engine.snapshot();
    expect(snap.timeSeries.length).toBeGreaterThanOrEqual(1);
    expect(snap.timeSeries[0].severity).toBe('critical');
  });

  it('reset clears all state', () => {
    engine.processEvent(makeEvent({ severity: 'critical', duration: 100 }));
    engine.reset();
    const snap = engine.snapshot();
    expect(snap.hazardCount).toBe(0);
    expect(snap.responseTimeAverageMs).toBe(0);
    expect(snap.timeSeries).toHaveLength(0);
  });

  it('has lastUpdated timestamp after processing events', () => {
    engine.processEvent(makeEvent({ severity: 'info' }));
    const snap = engine.snapshot();
    expect(snap.lastUpdated).toBeGreaterThan(0);
  });
});
