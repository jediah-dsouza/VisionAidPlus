import { AnalyticsEventPipeline, analyticsEventPipeline } from '../../../src/core/analytics/AnalyticsEventPipeline';
import { AnalyticsBatchProcessor } from '../../../src/core/analytics/AnalyticsBatchProcessor';
import { AnalyticsAggregationEngine } from '../../../src/core/analytics/AnalyticsAggregationEngine';
import { AlertHistoryManager } from '../../../src/core/analytics/AlertHistoryManager';
import { SafetyMetricsEngine } from '../../../src/core/analytics/SafetyMetricsEngine';
import { ObstacleAnalyticsEngine } from '../../../src/core/analytics/ObstacleAnalyticsEngine';
import { UsageInsightEngine } from '../../../src/core/analytics/UsageInsightEngine';
import { SessionSummaryGenerator } from '../../../src/core/analytics/SessionSummaryGenerator';
import { HistoricalEventIndexer } from '../../../src/core/analytics/HistoricalEventIndexer';
import { AnalyticsMemoryProtection } from '../../../src/core/analytics/AnalyticsMemoryProtection';
import { AnalyticsPerformanceMonitor } from '../../../src/core/analytics/AnalyticsPerformanceMonitor';
import { AnalyticsRetentionManager } from '../../../src/core/analytics/AnalyticsRetentionManager';
import { AnalyticsPersistenceCoordinator } from '../../../src/core/analytics/AnalyticsPersistenceCoordinator';
import { AnalyticsSynchronizationLayer } from '../../../src/core/analytics/AnalyticsSynchronizationLayer';
import { AnalyticsFilterEngine } from '../../../src/core/analytics/AnalyticsFilterEngine';
import { AnalyticsExportPreparationLayer } from '../../../src/core/analytics/AnalyticsExportPreparationLayer';
import { AlertDeduplicationLayer } from '../../../src/core/analytics/AlertDeduplicationLayer';
import { AnalyticsAccessibilityChartCoordinator } from '../../../src/core/analytics/AnalyticsAccessibilityChartCoordinator';
import { AnalyticsRenderingOptimizer } from '../../../src/core/analytics/AnalyticsRenderingOptimizer';
import { AnalyticsEventBridge } from '../../../src/core/analytics/AnalyticsEventBridge';
import { SessionAnalyticsCoordinator } from '../../../src/core/analytics/SessionAnalyticsCoordinator';
import type { AnalyticsEvent } from '../../../src/core/analytics/types';
import { EVENTS, EventBus } from '../../../src/core/events/EventBus';

function makeEvent(overrides?: Partial<AnalyticsEvent>): AnalyticsEvent {
  return {
    id: `evt_${Math.random().toString(36).slice(2, 8)}`,
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

function makeIngestEvent(overrides?: Partial<AnalyticsEvent>): Omit<AnalyticsEvent, 'id' | 'sequence'> {
  return {
    timestamp: Date.now(),
    category: 'safety' as AnalyticsEvent['category'],
    severity: 'info' as AnalyticsEvent['severity'],
    source: 'system' as AnalyticsEvent['source'],
    eventType: 'test',
    sessionId: 's1',
    payload: {},
    metadata: {},
    ...overrides,
  };
}

describe('Runtime Validation — Analytics Pipeline', () => {
  // Test 1: Pipeline → BatchProcessor integration
  it('pipeline delivers events to batch processor', () => {
    const pipeline = new AnalyticsEventPipeline();
    const batch = new AnalyticsBatchProcessor({ batchSize: 3, batchIntervalMs: 200 });
    const onBatchReady = jest.fn();
    batch.onBatchReady = onBatchReady;

    pipeline.subscribe((event) => batch.enqueue(event));
    pipeline.ingest(makeIngestEvent({ eventType: 'a' }));
    pipeline.ingest(makeIngestEvent({ eventType: 'b' }));
    pipeline.ingest(makeIngestEvent({ eventType: 'c' }));

    expect(onBatchReady).toHaveBeenCalledTimes(1);
    expect(onBatchReady.mock.calls[0][0]).toHaveLength(3);
    pipeline.destroy();
    batch.destroy();
  });

  // Test 2: AlertHistoryManager + SafetyMetricsEngine process same event
  it('alert history and safety engine both process the same event', () => {
    const alertHistory = new AlertHistoryManager();
    const safety = new SafetyMetricsEngine();
    const pipeline = new AnalyticsEventPipeline();

    pipeline.subscribe((e) => alertHistory.processEvent(e));
    pipeline.subscribe((e) => safety.processEvent(e));
    pipeline.ingest(makeIngestEvent({ severity: 'critical', eventType: 'danger' }));

    expect(alertHistory.getCriticalAlerts()).toHaveLength(1);
    expect(safety.snapshot().criticalAlerts).toBe(1);
    pipeline.destroy();
    alertHistory.destroy();
    safety.destroy();
  });

  // Test 3: Full pipeline end-to-end with export
  it('end-to-end: pipeline → storage → export', () => {
    const pipeline = new AnalyticsEventPipeline();
    const indexer = new HistoricalEventIndexer();
    const alerts = new AlertHistoryManager();

    pipeline.subscribe((e) => { indexer.append(e); alerts.processEvent(e); });

    pipeline.ingest(makeIngestEvent({ eventType: 'obstacle', category: 'obstacle', severity: 'warning', payload: { detectionType: 'person', confidence: 0.85 } }));
    pipeline.ingest(makeIngestEvent({ eventType: 'danger', category: 'safety', severity: 'critical' }));
    pipeline.ingest(makeIngestEvent({ eventType: 'info', category: 'usage' }));

    expect(indexer.getCount()).toBe(3);
    expect(alerts.snapshot().count).toBe(3);
    expect(alerts.getCriticalAlerts()).toHaveLength(1);

    const exporter = new AnalyticsExportPreparationLayer();
    const allEvents = indexer.query(() => true);
    const payload = exporter.prepareExport(allEvents, {}, 'json');
    expect(payload.recordCount).toBe(3);
    expect(payload.checksum).toBeTruthy();

    pipeline.destroy();
    indexer.destroy();
    alerts.destroy();
    exporter.destroy();
  });

  // Test 4: EventBridge routing
  it('event bridge routes EventBus events to analytics pipeline', () => {
    const pipeline = new AnalyticsEventPipeline();
    const bridge = new AnalyticsEventBridge();
    const bus = new EventBus();
    const onEvent = jest.fn();

    pipeline.subscribe(onEvent);
    bridge.onAnalyticsEvent = (e) => pipeline.ingest(e);
    bridge.connect(bus);

    bus.publish(EVENTS.AI_OBSTACLE_DETECTED, { distance: 100 });
    bus.publish(EVENTS.EMERGENCY_TRIGGERED, { type: 'fall' });

    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent.mock.calls[0][0].category).toBe('obstacle');
    expect(onEvent.mock.calls[1][0].category).toBe('safety');

    pipeline.destroy();
    bridge.destroy();
  });

  // Test 5: Session coordinator lifecycle
  it('session coordinator lifecycle with engines', () => {
    const coordinator = new SessionAnalyticsCoordinator();
    const safety = new SafetyMetricsEngine();
    const obstacles = new ObstacleAnalyticsEngine();

    coordinator.registerEngine(safety);
    coordinator.registerEngine(obstacles);

    coordinator.startSession('session-test');
    const obstacleEvent: AnalyticsEvent = { id: '1', timestamp: Date.now(), category: 'obstacle', severity: 'warning', source: 'ai', eventType: 'obstacle_detected', sessionId: 'session-test', sequence: 1, payload: { detectionType: 'person' } };
    obstacles.processEvent(obstacleEvent);
    safety.processEvent({ id: '2', timestamp: Date.now(), category: 'safety', severity: 'critical', source: 'system', eventType: 'hazard', sessionId: 'session-test', sequence: 2, payload: {} });

    const summary = coordinator.endSession();
    expect(summary).not.toBeNull();
    expect(summary!.totalObstacles).toBe(1);
    expect(summary!.totalAlerts).toBe(1);

    coordinator.destroy();
    safety.destroy();
    obstacles.destroy();
  });

  // Test 6: Memory protection with real engines
  it('memory protection tracks engines and triggers pruning', () => {
    const mem = new AnalyticsMemoryProtection(50000);
    const onPrune = jest.fn();
    mem.onPrune = onPrune;

    mem.registerEngine('alert_history', 10000);
    mem.registerEngine('safety_metrics', 10000);

    mem.updateUsage('alert_history', 5000);
    mem.updateUsage('safety_metrics', 15000);
    expect(mem.isOverBudget('safety_metrics')).toBe(true);
    expect(mem.getEnginesOverBudget()).toContain('safety_metrics');

    mem.destroy();
  });

  // Test 7: Filter engine with stored events
  it('filter engine queries indexer events', () => {
    const indexer = new HistoricalEventIndexer();
    const filter = new AnalyticsFilterEngine();

    indexer.append(makeEvent({ eventType: 'danger', severity: 'critical', category: 'safety', timestamp: Date.now() - 1000 }));
    indexer.append(makeEvent({ eventType: 'info', severity: 'info', category: 'usage', timestamp: Date.now() }));

    const criticalEvents = filter.execute(
      indexer.query(() => true),
      { timeRange: { start: 0 }, categories: ['safety', 'obstacle', 'usage', 'alert', 'session', 'performance'], severities: ['critical'], priorities: ['critical', 'high', 'normal', 'low', 'background'], sources: ['voice', 'ble', 'emergency', 'navigation', 'ai', 'safety', 'system'] },
    );
    expect(criticalEvents).toHaveLength(1);
    expect(criticalEvents[0].eventType).toBe('danger');

    indexer.destroy();
    filter.destroy();
  });

  // Test 8: Sync layer receives metrics
  it('sync layer merges and flushes metrics', () => {
    const sync = new AnalyticsSynchronizationLayer(1000);
    const onSyncReady = jest.fn();
    sync.onSyncReady = onSyncReady;

    sync.enqueueMetrics({ safety: { hazardCount: 3 } as any });
    sync.enqueueMetrics({ obstacles: { totalDetections: 10 } as any });
    sync.flush();

    expect(onSyncReady).toHaveBeenCalledTimes(1);
    const payload = onSyncReady.mock.calls[0][0];
    expect(payload.safety.hazardCount).toBe(3);
    expect(payload.obstacles.totalDetections).toBe(10);

    sync.destroy();
  });

  // Test 9: Persistence coordinator stores and retrieves
  it('persistence coordinator round-trips complex data', async () => {
    const persistence = new AnalyticsPersistenceCoordinator();
    const data = {
      safety: { hazardCount: 5 },
      obstacles: { totalDetections: 42 },
      timestamp: Date.now(),
    };

    await persistence.saveSnapshot('runtime-test', data);
    await persistence.flushNow();
    const loaded = await persistence.loadSnapshot<typeof data>('runtime-test');
    expect(loaded).toEqual(data);
    expect(persistence.storageSize).toBeGreaterThan(0);

    await persistence.clearAll();
    persistence.destroy();
  });

  // Test 10: Accessibility coordinator summarizes from engine snapshots
  it('accessibility coordinator generates speech from metrics', () => {
    const coord = new AnalyticsAccessibilityChartCoordinator();
    const safety = new SafetyMetricsEngine();
    const obstacles = new ObstacleAnalyticsEngine();

    for (let i = 0; i < 5; i++) {
      safety.processEvent(makeEvent({ severity: 'critical', duration: 100 }));
    }
    for (let i = 0; i < 3; i++) {
      obstacles.processEvent(makeEvent({ category: 'obstacle', source: 'ai', payload: { detectionType: 'person', distance: 1.5, direction: 'center', confidence: 0.8 } }));
    }

    const safetySummary = coord.summarizeSafetyTrend(safety.snapshot());
    expect(safetySummary).toContain('5');
    expect(safetySummary).toContain('hazards');

    const obstacleSummary = coord.summarizeObstacleTrend(obstacles.snapshot());
    expect(obstacleSummary).toContain('3');

    coord.destroy();
    safety.destroy();
    obstacles.destroy();
  });
});

describe('Runtime Validation — Global Singleton Sanity', () => {
  it('analyticsEventPipeline is a valid pipeline', () => {
    expect(analyticsEventPipeline).toBeInstanceOf(AnalyticsEventPipeline);
    expect(typeof analyticsEventPipeline.ingest).toBe('function');
    expect(typeof analyticsEventPipeline.subscribe).toBe('function');
  });
});
