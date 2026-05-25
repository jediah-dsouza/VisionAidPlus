import { UsageInsightEngine } from '../../src/core/analytics/UsageInsightEngine';
import type { AnalyticsEvent } from '../../src/core/analytics/types';

function makeEvent(overrides?: Partial<AnalyticsEvent>): AnalyticsEvent {
  return {
    id: `evt_${Math.random()}`,
    timestamp: Date.now(),
    category: 'usage',
    severity: 'info',
    source: 'system',
    eventType: 'feature_activated',
    sessionId: 's1',
    sequence: 1,
    payload: {},
    ...overrides,
  };
}

describe('UsageInsightEngine', () => {
  let engine: UsageInsightEngine;

  beforeEach(() => {
    engine = new UsageInsightEngine();
  });

  afterEach(() => {
    engine.destroy();
  });

  it('starts with zero state', () => {
    const snap = engine.snapshot();
    expect(snap.totalSessionDuration).toBe(0);
    expect(snap.averageSessionLength).toBe(0);
    expect(snap.featureActivationCounts).toEqual({});
  });

  it('tracks feature activations by eventType', () => {
    engine.processEvent(makeEvent({ eventType: 'navigation' }));
    engine.processEvent(makeEvent({ eventType: 'navigation' }));
    engine.processEvent(makeEvent({ eventType: 'voice' }));
    const snap = engine.snapshot();
    expect(snap.featureActivationCounts).toEqual({ navigation: 2, voice: 1 });
  });

  it('tracks usage by hour', () => {
    const morning = new Date('2026-05-25T09:00:00').getTime();
    const evening = new Date('2026-05-25T14:00:00').getTime();
    engine.processEvent(makeEvent({ timestamp: morning }));
    engine.processEvent(makeEvent({ timestamp: evening }));
    const snap = engine.snapshot();
    expect(snap.usageByHour[9]).toBe(1);
    expect(snap.usageByHour[14]).toBe(1);
  });

  it('tracks session start and end', () => {
    const start = new Date('2026-05-25T10:00:00').getTime();
    const end = new Date('2026-05-25T10:30:00').getTime();
    engine.processEvent(makeEvent({ eventType: 'session_start', sessionId: 's1', timestamp: start }));
    engine.processEvent(makeEvent({ eventType: 'session_end', sessionId: 's1', timestamp: end }));
    const snap = engine.snapshot();
    expect(snap.averageSessionLength).toBe(1800000);
    expect(snap.totalSessionDuration).toBeGreaterThanOrEqual(1800000);
  });

  it('tracks peak usage hour', () => {
    const times = [9, 9, 9, 14, 14, 18].map(h =>
      new Date(`2026-05-25T${h.toString().padStart(2, '0')}:00:00`).getTime(),
    );
    for (const t of times) engine.processEvent(makeEvent({ timestamp: t }));
    expect(engine.snapshot().peakUsageHour).toBe(9);
  });

  it('reset clears all state', () => {
    engine.processEvent(makeEvent({ eventType: 'session_start', sessionId: 's1' }));
    engine.processEvent(makeEvent({ eventType: 'voice_test' }));
    engine.reset();
    const snap = engine.snapshot();
    expect(snap.featureActivationCounts).toEqual({});
    expect(snap.totalSessionDuration).toBe(0);
    expect(snap.averageSessionLength).toBe(0);
  });

  it('handles session events with no matching session for end', () => {
    engine.processEvent(makeEvent({ eventType: 'session_ended', sessionId: 'nonexistent' }));
    expect(engine.snapshot().averageSessionLength).toBe(0);
  });
});
