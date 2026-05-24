import type { PerformanceMetrics } from './types';

interface TickRecord {
  durationMs: number;
  batchSize: number;
}

const ROLLING_WINDOW_SIZE = 100;

export class AnalyticsPerformanceMonitor {
  private ticks: TickRecord[] = [];
  private droppedEvents = 0;
  private startTime: number;
  private destroyed = false;

  constructor() {
    this.startTime = Date.now();
    console.log('[AnalyticsPerfMon] Created');
  }

  recordTick(durationMs: number, batchSize: number): void {
    if (this.destroyed) return;

    this.ticks.push({ durationMs, batchSize });

    if (this.ticks.length > ROLLING_WINDOW_SIZE) {
      this.ticks.shift();
    }
  }

  recordDropped(): void {
    if (this.destroyed) return;
    this.droppedEvents++;
    console.log(`[AnalyticsPerfMon] Dropped event recorded (total: ${this.droppedEvents})`);
  }

  snapshot(): PerformanceMetrics {
    const totalEventsIngested = this.ticks.reduce((sum, t) => sum + t.batchSize, 0);
    const totalProcessingTime = this.ticks.reduce((sum, t) => sum + t.durationMs, 0);
    const batchCount = this.ticks.length;
    const uptimeMs = Date.now() - this.startTime;

    const avgProcessingTimeMs = batchCount > 0 ? totalProcessingTime / batchCount : 0;
    const avgBatchSize = batchCount > 0 ? totalEventsIngested / batchCount : 0;
    const peakProcessingTimeMs = batchCount > 0
      ? Math.max(...this.ticks.map(t => t.durationMs))
      : 0;
    const lastTickDuration = batchCount > 0
      ? this.ticks[this.ticks.length - 1].durationMs
      : 0;
    const eventsPerSecond = uptimeMs > 0 ? (totalEventsIngested / uptimeMs) * 1000 : 0;
    const memoryEstimateBytes = this.ticks.length * 32 + this.droppedEvents * 8;

    return {
      totalEventsIngested,
      eventsPerSecond,
      averageProcessingTimeMs: avgProcessingTimeMs,
      peakProcessingTimeMs,
      batchCount,
      averageBatchSize: avgBatchSize,
      droppedEvents: this.droppedEvents,
      memoryEstimateBytes,
      lastTickDuration,
      uptimeMs,
    };
  }

  reset(): void {
    this.ticks = [];
    this.droppedEvents = 0;
    this.startTime = Date.now();
    console.log('[AnalyticsPerfMon] Reset');
  }

  destroy(): void {
    this.destroyed = true;
    this.reset();
    console.log('[AnalyticsPerfMon] Destroyed');
  }
}

export const analyticsPerformanceMonitor = new AnalyticsPerformanceMonitor();
