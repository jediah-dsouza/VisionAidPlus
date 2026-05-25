import { ObstacleAnalyticsEngine } from '../../src/core/analytics/ObstacleAnalyticsEngine';
import type { AnalyticsEvent } from '../../src/core/analytics/types';

function makeEvent(overrides?: Partial<AnalyticsEvent>): AnalyticsEvent {
  return {
    id: `evt_${Math.random()}`,
    timestamp: Date.now(),
    category: 'obstacle',
    severity: 'warning',
    source: 'ai',
    eventType: 'obstacle_detected',
    sessionId: 's1',
    sequence: 1,
    payload: {},
    ...overrides,
  };
}

describe('ObstacleAnalyticsEngine', () => {
  let engine: ObstacleAnalyticsEngine;

  beforeEach(() => {
    engine = new ObstacleAnalyticsEngine();
  });

  afterEach(() => {
    engine.destroy();
  });

  it('starts with zero detections', () => {
    const snap = engine.snapshot();
    expect(snap.totalDetections).toBe(0);
    expect(snap.averageConfidence).toBe(0);
  });

  it('tracks total detections', () => {
    engine.processEvent(makeEvent());
    engine.processEvent(makeEvent());
    expect(engine.snapshot().totalDetections).toBe(2);
  });

  it('skips non-obstacle and non-ai events', () => {
    engine.processEvent(makeEvent({ category: 'safety', source: 'system' }));
    expect(engine.snapshot().totalDetections).toBe(0);
  });

  it('tracks type distribution', () => {
    engine.processEvent(makeEvent({ payload: { detectionType: 'person' } }));
    engine.processEvent(makeEvent({ payload: { detectionType: 'person' } }));
    engine.processEvent(makeEvent({ payload: { detectionType: 'vehicle' } }));
    const snap = engine.snapshot();
    expect(snap.typeDistribution).toEqual({ person: 2, vehicle: 1 });
  });

  it('tracks distance histogram', () => {
    engine.processEvent(makeEvent({ payload: { distance: 0.3 } }));
    engine.processEvent(makeEvent({ payload: { distance: 1.5 } }));
    engine.processEvent(makeEvent({ payload: { distance: 3 } }));
    const snap = engine.snapshot();
    expect(snap.distanceHistogram).toEqual(
      expect.arrayContaining([
        { range: '0-0.5m', count: 1 },
        { range: '1-2m', count: 1 },
        { range: '2-5m', count: 1 },
      ]),
    );
  });

  it('tracks direction distribution', () => {
    engine.processEvent(makeEvent({ payload: { direction: 'left' } }));
    engine.processEvent(makeEvent({ payload: { direction: 'center' } }));
    engine.processEvent(makeEvent({ payload: { direction: 'left' } }));
    const snap = engine.snapshot();
    expect(snap.directionDistribution).toEqual({ left: 2, center: 1 });
  });

  it('computes average confidence', () => {
    engine.processEvent(makeEvent({ payload: { confidence: 0.8 } }));
    engine.processEvent(makeEvent({ payload: { confidence: 0.9 } }));
    expect(engine.snapshot().averageConfidence).toBeCloseTo(0.85, 10);
  });

  it('has density window configured', () => {
    expect(engine.snapshot().densityWindowSeconds).toBe(60);
  });

  it('tracks time series', () => {
    engine.processEvent(makeEvent({ timestamp: Date.now() }));
    expect(engine.snapshot().timeSeries.length).toBeGreaterThanOrEqual(1);
  });

  it('reset clears all state', () => {
    engine.processEvent(makeEvent({ payload: { detectionType: 'person', confidence: 0.8 } }));
    engine.reset();
    const snap = engine.snapshot();
    expect(snap.totalDetections).toBe(0);
    expect(snap.typeDistribution).toEqual({});
    expect(snap.averageConfidence).toBe(0);
  });
});
