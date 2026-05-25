import { analyticsBatchProcessor } from '../../../src/core/analytics/AnalyticsBatchProcessor';
import { analyticsEventPipeline } from '../../../src/core/analytics/AnalyticsEventPipeline';
import { analyticsPerformanceMonitor } from '../../../src/core/analytics/AnalyticsPerformanceMonitor';
import type { AnalyticsEvent } from '../../../src/core/analytics/types';
import { factories } from '../helpers/factories';

let eventSequence = 0;

export const AnalyticsMock = {
  createEvent(overrides?: Partial<AnalyticsEvent>): AnalyticsEvent {
    eventSequence++;
    return factories.analyticsEvent({
      sequence: eventSequence,
      ...overrides,
    });
  },

  enqueueEvent(event: AnalyticsEvent): void {
    analyticsBatchProcessor.enqueue(event);
  },

  ingestViaPipeline(event: AnalyticsEvent): void {
    analyticsEventPipeline.ingest({
      category: event.category,
      severity: event.severity,
      source: event.source,
      eventType: event.eventType,
      sessionId: event.sessionId,
      timestamp: event.timestamp,
      payload: event.payload,
      metadata: event.metadata,
    });
  },

  flushBatch(): void {
    analyticsBatchProcessor.flush();
  },

  recordTick(durationMs: number = 10, batchSize: number = 5): void {
    analyticsPerformanceMonitor.recordTick(durationMs, batchSize);
  },

  resetSequence(): void {
    eventSequence = 0;
    factories.resetCounter();
  },

  destroy(): void {
    analyticsBatchProcessor.destroy();
    analyticsPerformanceMonitor.destroy();
    this.resetSequence();
  },
};
