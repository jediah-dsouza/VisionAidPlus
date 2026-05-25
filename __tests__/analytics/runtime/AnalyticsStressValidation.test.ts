import { AnalyticsEventPipeline } from '../../../src/core/analytics/AnalyticsEventPipeline';
import { AnalyticsBatchProcessor } from '../../../src/core/analytics/AnalyticsBatchProcessor';
import { AlertHistoryManager } from '../../../src/core/analytics/AlertHistoryManager';
import { SafetyMetricsEngine } from '../../../src/core/analytics/SafetyMetricsEngine';
import { ObstacleAnalyticsEngine } from '../../../src/core/analytics/ObstacleAnalyticsEngine';
import { UsageInsightEngine } from '../../../src/core/analytics/UsageInsightEngine';
import { HistoricalEventIndexer } from '../../../src/core/analytics/HistoricalEventIndexer';
import { AnalyticsMemoryProtection } from '../../../src/core/analytics/AnalyticsMemoryProtection';
import { AnalyticsPerformanceMonitor } from '../../../src/core/analytics/AnalyticsPerformanceMonitor';

function makeIngestEvent(i: number) {
  const categories = ['safety', 'obstacle', 'usage', 'alert'] as const;
  const severities = ['info', 'warning', 'critical'] as const;
  return {
    timestamp: Date.now() + i,
    category: categories[i % categories.length],
    severity: severities[i % severities.length],
    source: 'system' as const,
    eventType: `event_${i}`,
    sessionId: 'stress-test',
    payload: { index: i },
    metadata: {},
  };
}

describe('Stress Validation — Analytics Throughput', () => {
  jest.setTimeout(30000);

  it('handles 1000 events through pipeline without errors', () => {
    const pipeline = new AnalyticsEventPipeline();
    const count = { value: 0 };

    pipeline.subscribe(() => { count.value++; });
    for (let i = 0; i < 1000; i++) {
      pipeline.ingest(makeIngestEvent(i));
    }
    expect(count.value).toBe(1000);
    expect(pipeline.currentSequence).toBe(1000);
    pipeline.destroy();
  });

  it('batch processor handles 500 events in batches', () => {
    const batch = new AnalyticsBatchProcessor({ batchSize: 50, batchIntervalMs: 20 });
    const onBatchReady = jest.fn();
    batch.onBatchReady = onBatchReady;

    for (let i = 0; i < 500; i++) {
      batch.enqueue({
        id: `evt_${i}`,
        timestamp: Date.now() + i,
        category: 'safety',
        severity: 'info',
        source: 'system',
        eventType: `e${i}`,
        sessionId: 's1',
        sequence: i,
        payload: {},
      });
    }

    expect(onBatchReady).toHaveBeenCalled();
    const totalFlushed = onBatchReady.mock.calls.reduce((sum: number, call: any) => sum + call[0].length, 0);
    expect(totalFlushed).toBeGreaterThanOrEqual(500);
    batch.destroy();
  });

  it('alert history manager handles 2000 dedup groups', () => {
    const manager = new AlertHistoryManager();
    const alerts = new AnalyticsEventPipeline();

    alerts.subscribe((e) => manager.processEvent(e));
    for (let i = 0; i < 2000; i++) {
      const group = `group_${Math.floor(i / 2)}`;
      alerts.ingest({
        timestamp: Date.now() + i,
        category: 'safety',
        severity: i % 3 === 0 ? 'critical' : 'warning',
        source: 'system',
        eventType: 'alert',
        sessionId: 's1',
        payload: { dedupGroup: group },
        metadata: {},
      });
    }
    expect(manager.snapshot().alerts.length).toBeLessThanOrEqual(1000);
    manager.destroy();
    alerts.destroy();
  });

  it('indexer handles 10000 events with eviction', () => {
    const indexer = new HistoricalEventIndexer();
    for (let i = 0; i < 10000; i++) {
      indexer.append({
        id: `evt_${i}`,
        timestamp: Date.now() + i,
        category: 'safety',
        severity: 'info',
        source: 'system',
        eventType: `e${i}`,
        sessionId: 's1',
        sequence: i,
        payload: {},
      });
    }
    expect(indexer.getCount()).toBe(10000);
    const results = indexer.query(() => true, 5);
    expect(results).toHaveLength(5);
    indexer.destroy();
  });

  it('indexer evicts oldest beyond 10000', () => {
    const indexer = new HistoricalEventIndexer();
    for (let i = 0; i < 10005; i++) {
      indexer.append({
        id: `evt_${i}`,
        timestamp: Date.now() + i,
        category: 'safety',
        severity: 'info',
        source: 'system',
        eventType: `e${i}`,
        sessionId: 's1',
        sequence: i,
        payload: {},
      });
    }
    expect(indexer.getCount()).toBe(10000);
    indexer.destroy();
  });

  it('safety engine handles 1000 events with correct counts', () => {
    const safety = new SafetyMetricsEngine();
    for (let i = 0; i < 1000; i++) {
      safety.processEvent({
        id: `evt_${i}`,
        timestamp: Date.now() + i,
        category: 'safety',
        severity: i < 500 ? 'critical' : 'warning',
        source: 'ai',
        eventType: 'hazard',
        sessionId: 's1',
        sequence: i,
        payload: {},
        duration: i * 10,
      });
    }
    const snap = safety.snapshot();
    expect(snap.criticalAlerts).toBe(500);
    expect(snap.warnings).toBe(500);
    expect(snap.responseTimeAverageMs).toBeGreaterThan(0);
    safety.destroy();
  });

  it('obstacle engine handles 1000 events with distribution', () => {
    const obs = new ObstacleAnalyticsEngine();
    for (let i = 0; i < 1000; i++) {
      obs.processEvent({
        id: `evt_${i}`,
        timestamp: Date.now() + i,
        category: 'obstacle',
        severity: 'warning',
        source: 'ai',
        eventType: 'obstacle_detected',
        sessionId: 's1',
        sequence: i,
        payload: {
          detectionType: i % 2 === 0 ? 'person' : 'vehicle',
          distance: (i % 5) + 1,
          direction: i % 3 === 0 ? 'left' : i % 3 === 1 ? 'center' : 'right',
          confidence: 0.5 + (i % 50) / 100,
        },
      });
    }
    const snap = obs.snapshot();
    expect(snap.totalDetections).toBe(1000);
    expect(snap.typeDistribution.person).toBe(500);
    expect(snap.typeDistribution.vehicle).toBe(500);
    expect(snap.averageConfidence).toBeGreaterThan(0.5);
    obs.destroy();
  });

  it('all engines run concurrently without interference', () => {
    const engines = [
      new SafetyMetricsEngine(),
      new ObstacleAnalyticsEngine(),
      new UsageInsightEngine(),
      new AlertHistoryManager(),
    ];

    for (let i = 0; i < 500; i++) {
      const event = {
        id: `evt_${i}`,
        timestamp: Date.now() + i,
        category: (['safety', 'obstacle', 'usage', 'alert'] as const)[i % 4],
        severity: (['info', 'warning', 'critical'] as const)[i % 3],
        source: 'system' as const,
        eventType: `test_${i}`,
        sessionId: 'stress',
        sequence: i,
        payload: { detectionType: 'person', distance: 2, direction: 'center', confidence: 0.8 },
      };
      for (const engine of engines) {
        engine.processEvent(event);
      }
    }

    expect(engines[0].getMetrics().eventCount).toBe(500);
    expect(engines[1].getMetrics().eventCount).toBeGreaterThanOrEqual(125);
    expect(engines[2].getMetrics().eventCount).toBe(500);
    expect(engines[3].getMetrics().eventCount).toBe(500);

    for (const engine of engines) engine.destroy();
  });

  it('memory protection handles over-budget under load', () => {
    const mem = new AnalyticsMemoryProtection(50000);
    const onPrune = jest.fn();
    mem.onPrune = onPrune;

    mem.registerEngine('safety', 10000);
    mem.registerEngine('obstacle', 10000);
    mem.registerEngine('usage', 10000);

    mem.updateUsage('safety', 15000);
    mem.updateUsage('obstacle', 12000);
    mem.updateUsage('usage', 3000);

    expect(mem.isOverBudget('safety')).toBe(true);
    expect(mem.isOverBudget('obstacle')).toBe(true);
    expect(mem.isOverBudget('usage')).toBe(false);
    expect(mem.getEnginesOverBudget().length).toBe(2);
    mem.destroy();
  });

  it('performance monitor tracks large throughput', () => {
    const mon = new AnalyticsPerformanceMonitor();
    for (let i = 0; i < 100; i++) {
      mon.recordTick(Math.random() * 50, Math.floor(Math.random() * 100));
    }
    const snap = mon.snapshot();
    expect(snap.batchCount).toBe(100);
    expect(snap.totalEventsIngested).toBeGreaterThan(0);
    expect(snap.averageBatchSize).toBeGreaterThan(0);
    expect(snap.averageProcessingTimeMs).toBeGreaterThanOrEqual(0);
    mon.destroy();
  });
});
