import { AnalyticsAggregationEngine } from '../../src/core/analytics/AnalyticsAggregationEngine';
import type { AnalyticsEvent } from '../../src/core/analytics/types';

class TestAggEngine extends AnalyticsAggregationEngine {
  private count = 0;
  constructor() { super('test_engine'); }
  processEvent(event: AnalyticsEvent): void {
    this.trackEvent(() => { this.count++; });
  }
  snapshot(): Record<string, unknown> {
    return { count: this.count };
  }
  reset(): void {
    this.count = 0;
    this.eventCount = 0;
    this.processingTimeMs = 0;
    this.memoryEstimateBytes = 0;
  }
}

describe('AnalyticsAggregationEngine', () => {
  let engine: TestAggEngine;

  beforeEach(() => {
    engine = new TestAggEngine();
  });

  it('starts with zero metrics', () => {
    const m = engine.getMetrics();
    expect(m.engineName).toBe('test_engine');
    expect(m.eventCount).toBe(0);
    expect(m.processingTimeMs).toBe(0);
  });

  it('processes events and tracks count', () => {
    const event = { id: '1', timestamp: Date.now(), eventType: 'test', sessionId: 's1', sequence: 1 } as AnalyticsEvent;
    engine.processEvent(event);
    expect(engine.getMetrics().eventCount).toBe(1);
    expect(engine.snapshot()).toEqual({ count: 1 });
  });

  it('tracks processing time', () => {
    const event = { id: '1', timestamp: Date.now(), eventType: 'test', sessionId: 's1', sequence: 1 } as AnalyticsEvent;
    const start = performance.now();
    engine.processEvent(event);
    expect(engine.getMetrics().processingTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('resets to initial state', () => {
    const event = { id: '1', timestamp: Date.now(), eventType: 'test', sessionId: 's1', sequence: 1 } as AnalyticsEvent;
    engine.processEvent(event);
    engine.reset();
    expect(engine.getMetrics().eventCount).toBe(0);
    expect(engine.snapshot()).toEqual({ count: 0 });
  });

  it('destroy clears state', () => {
    engine.destroy();
    expect(engine.isDestroyed).toBe(true);
    expect(engine.getMetrics().eventCount).toBe(0);
  });

  it('handles process errors without crashing', () => {
    const bad = new (class extends AnalyticsAggregationEngine {
      constructor() { super('bad'); }
      processEvent(_event: AnalyticsEvent): void {
        this.trackEvent(() => { throw new Error('fail'); });
      }
      snapshot() { return {}; }
      reset() {}
    })();
    const event = { id: '1', timestamp: Date.now(), eventType: 'test', sessionId: 's1', sequence: 1 } as AnalyticsEvent;
    expect(() => bad.processEvent(event)).not.toThrow();
    expect(bad.getMetrics().eventCount).toBe(0);
    bad.destroy();
  });
});
