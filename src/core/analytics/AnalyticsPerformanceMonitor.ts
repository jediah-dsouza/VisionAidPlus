import type { PerformanceMetrics } from './types';

interface TickRecord {
  durationMs: number;
  batchSize: number;
}

const ROLLING_WINDOW_SIZE = 100;

export class AnalyticsPerformanceMonitor {
  private ring: TickRecord[] = new Array(ROLLING_WINDOW_SIZE);
  private ringIndex = 0;
  private ringCount = 0;
  private droppedEvents = 0;
  private startTime: number;
  private destroyed = false;

  constructor() {
    this.startTime = Date.now();
    if (__DEV__) {
      console.log('[AnalyticsPerfMon] Created');
    }
  }

  get ticks(): TickRecord[] {
    return this.ringCount < ROLLING_WINDOW_SIZE
      ? this.ring.slice(0, this.ringCount)
      : [...this.ring.slice(this.ringIndex), ...this.ring.slice(0, this.ringIndex)];
  }

  recordTick(durationMs: number, batchSize: number): void {
    if (this.destroyed) return;

    this.ring[this.ringIndex] = { durationMs, batchSize };
    this.ringIndex = (this.ringIndex + 1) % ROLLING_WINDOW_SIZE;
    if (this.ringCount < ROLLING_WINDOW_SIZE) {
      this.ringCount++;
    }
  }

  recordDropped(): void {
    if (this.destroyed) return;
    this.droppedEvents++;
    if (__DEV__) {
      console.log(`[AnalyticsPerfMon] Dropped event recorded (total: ${this.droppedEvents})`);
    }
  }

  snapshot(): PerformanceMetrics {
    const ticks = this.ticks;
    const totalEventsIngested = ticks.reduce((sum, t) => sum + t.batchSize, 0);
    const totalProcessingTime = ticks.reduce((sum, t) => sum + t.durationMs, 0);
    const batchCount = ticks.length;
    const uptimeMs = Date.now() - this.startTime;

    const avgProcessingTimeMs = batchCount > 0 ? totalProcessingTime / batchCount : 0;
    const avgBatchSize = batchCount > 0 ? totalEventsIngested / batchCount : 0;
    const peakProcessingTimeMs = batchCount > 0
      ? Math.max(...ticks.map(t => t.durationMs))
      : 0;
    const lastTickDuration = batchCount > 0
      ? ticks[ticks.length - 1].durationMs
      : 0;
    const eventsPerSecond = uptimeMs > 0 ? (totalEventsIngested / uptimeMs) * 1000 : 0;
    const memoryEstimateBytes = this.ringCount * 32 + this.droppedEvents * 8;

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
    this.ring = new Array(ROLLING_WINDOW_SIZE);
    this.ringIndex = 0;
    this.ringCount = 0;
    this.droppedEvents = 0;
    this.startTime = Date.now();
    if (__DEV__) {
      console.log('[AnalyticsPerfMon] Reset');
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.reset();
    if (__DEV__) {
      console.log('[AnalyticsPerfMon] Destroyed');
    }
  }
}

export const analyticsPerformanceMonitor = new AnalyticsPerformanceMonitor();
