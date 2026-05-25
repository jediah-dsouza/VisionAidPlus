import { AnalyticsPerformanceMonitor } from '../../src/core/analytics/AnalyticsPerformanceMonitor';

describe('AnalyticsPerformanceMonitor', () => {
  let mon: AnalyticsPerformanceMonitor;

  beforeEach(() => {
    mon = new AnalyticsPerformanceMonitor();
  });

  afterEach(() => {
    mon.destroy();
  });

  it('starts with zero metrics', () => {
    const snap = mon.snapshot();
    expect(snap.totalEventsIngested).toBe(0);
    expect(snap.batchCount).toBe(0);
    expect(snap.droppedEvents).toBe(0);
  });

  it('records ticks and accumulates', () => {
    mon.recordTick(100, 10);
    mon.recordTick(200, 20);
    const snap = mon.snapshot();
    expect(snap.totalEventsIngested).toBe(30);
    expect(snap.batchCount).toBe(2);
    expect(snap.averageProcessingTimeMs).toBe(150);
  });

  it('tracks dropped events', () => {
    mon.recordDropped();
    mon.recordDropped();
    expect(mon.snapshot().droppedEvents).toBe(2);
  });

  it('computes events per second', () => {
    mon.recordTick(100, 50);
    const snap = mon.snapshot();
    expect(snap.eventsPerSecond).toBeGreaterThanOrEqual(0);
  });

  it('tracks peak processing time', () => {
    mon.recordTick(50, 1);
    mon.recordTick(200, 1);
    expect(mon.snapshot().peakProcessingTimeMs).toBe(200);
  });

  it('tracks last tick duration', () => {
    mon.recordTick(100, 1);
    mon.recordTick(150, 1);
    expect(mon.snapshot().lastTickDuration).toBe(150);
  });

  it('reset clears all state', () => {
    mon.recordTick(100, 10);
    mon.recordDropped();
    mon.reset();
    const snap = mon.snapshot();
    expect(snap.totalEventsIngested).toBe(0);
    expect(snap.batchCount).toBe(0);
    expect(snap.droppedEvents).toBe(0);
  });

  it('does not record after destroy', () => {
    mon.destroy();
    mon.recordTick(100, 1);
    expect(mon.snapshot().batchCount).toBe(0);
  });
});
