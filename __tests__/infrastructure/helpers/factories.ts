import type { AnalyticsEvent, AlertRecord, PerformanceMetrics } from '../../../src/core/analytics/types';

let _counter = 0;
function nextId(): string { return `test_${++_counter}_${Date.now()}`; }
function resetCounter(): void { _counter = 0; }

export const factories = {
  resetCounter,

  analyticsEvent(overrides: Partial<AnalyticsEvent> = {}): AnalyticsEvent {
    return {
      id: nextId(),
      timestamp: Date.now(),
      category: 'performance',
      severity: 'info',
      source: 'system',
      eventType: 'test:event',
      sessionId: 'test-session',
      sequence: _counter,
      payload: {},
      metadata: {},
      ...overrides,
    };
  },

  alertRecord(overrides: Partial<AlertRecord> = {}): AlertRecord {
    return {
      id: nextId(),
      timestamp: Date.now(),
      category: 'obstacle',
      severity: 'warning',
      priority: 'normal',
      source: 'ai',
      detectionType: null,
      title: 'Test Alert',
      description: 'Test alert description',
      status: 'active',
      acknowledgedAt: null,
      resolvedAt: null,
      duration: null,
      dedupGroup: 'test',
      sequence: 0,
      metadata: {},
      ...overrides,
    };
  },

  performanceMetrics(overrides: Partial<PerformanceMetrics> = {}): PerformanceMetrics {
    return {
      totalEventsIngested: 100,
      eventsPerSecond: 50,
      averageProcessingTimeMs: 10,
      peakProcessingTimeMs: 100,
      batchCount: 10,
      averageBatchSize: 10,
      droppedEvents: 0,
      memoryEstimateBytes: 1024,
      lastTickDuration: 5,
      uptimeMs: 60000,
      ...overrides,
    };
  },
};
