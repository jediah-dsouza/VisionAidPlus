import type { AnalyticsAggregateMetrics } from './types';
import { ANALYTICS_EVENTS } from './AnalyticsEvents';

const DEFAULT_FLUSH_INTERVAL_MS = 500;
const MAX_METRICS_PER_FLUSH = 50;

export class AnalyticsSynchronizationLayer {
  private buffer: Partial<AnalyticsAggregateMetrics>[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;
  private flushIntervalMs: number;

  onSyncReady: ((metrics: Partial<AnalyticsAggregateMetrics>) => void) | null = null;

  constructor(flushIntervalMs: number = DEFAULT_FLUSH_INTERVAL_MS) {
    this.flushIntervalMs = flushIntervalMs;
    this.startFlushTimer();
    console.log('[AnalyticsSyncLayer] Synchronization layer initialized');
  }

  enqueueMetrics(metrics: Partial<AnalyticsAggregateMetrics>): void {
    if (this.destroyed) return;
    this.buffer.push(metrics);
  }

  flush(): void {
    if (this.destroyed || this.buffer.length === 0) return;

    const batchCount = Math.min(this.buffer.length, MAX_METRICS_PER_FLUSH);
    const batch = this.buffer.splice(0, batchCount);

    const merged: Partial<AnalyticsAggregateMetrics> = {};
    for (const item of batch) {
      if (item.safety) merged.safety = item.safety;
      if (item.obstacles) merged.obstacles = item.obstacles;
      if (item.usage) merged.usage = item.usage;
      if (item.session) merged.session = item.session;
      if (item.lastUpdated) {
        merged.lastUpdated = Math.max(merged.lastUpdated ?? 0, item.lastUpdated);
      }
    }

    merged.lastUpdated = Date.now();

    console.log(`[AnalyticsSyncLayer] Flushed ${batchCount} metrics into single payload`);

    if (this.onSyncReady) {
      try {
        this.onSyncReady(merged);
      } catch (error) {
        console.error('[AnalyticsSyncLayer] onSyncReady callback error:', error);
      }
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  getBufferSize(): number {
    return this.buffer.length;
  }

  destroy(): void {
    this.destroyed = true;
    this.flush();
    if (this.flushTimer !== null) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.buffer = [];
    this.onSyncReady = null;
    console.log('[AnalyticsSyncLayer] Destroyed');
  }
}
