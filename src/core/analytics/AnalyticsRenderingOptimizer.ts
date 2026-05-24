import type { AnalyticsAggregateMetrics } from './types';

const DEFAULT_THROTTLE_INTERVAL_MS = 100;

export class AnalyticsRenderingOptimizer {
  private throttleIntervalMs: number;
  private lastEmitted: Partial<AnalyticsAggregateMetrics> | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingMetrics: Partial<AnalyticsAggregateMetrics> | null = null;
  private destroyed = false;

  onMetricsReady: ((metrics: Partial<AnalyticsAggregateMetrics>) => void) | null = null;

  constructor(throttleIntervalMs: number = DEFAULT_THROTTLE_INTERVAL_MS) {
    this.throttleIntervalMs = throttleIntervalMs;
    console.log('[AnalyticsRenderOpt] Rendering optimizer initialized');
  }

  coalesce(metrics: Partial<AnalyticsAggregateMetrics>): Partial<AnalyticsAggregateMetrics> {
    this.pendingMetrics = metrics;

    if (this.debounceTimer === null) {
      this.debounceTimer = setTimeout(() => {
        this.emitMetrics();
      }, this.throttleIntervalMs);
    }

    return metrics;
  }

  setThrottleInterval(ms: number): void {
    this.throttleIntervalMs = ms;
    console.log(`[AnalyticsRenderOpt] Throttle interval set to ${ms}ms`);
  }

  private emitMetrics(): void {
    if (this.destroyed || this.pendingMetrics === null) return;

    this.debounceTimer = null;

    if (this.hasChanged(this.pendingMetrics)) {
      this.lastEmitted = { ...this.pendingMetrics };
      console.log('[AnalyticsRenderOpt] Emitting metrics update');

      if (this.onMetricsReady) {
        try {
          this.onMetricsReady(this.pendingMetrics);
        } catch (error) {
          console.error('[AnalyticsRenderOpt] onMetricsReady callback error:', error);
        }
      }
    }

    this.pendingMetrics = null;
  }

  private hasChanged(metrics: Partial<AnalyticsAggregateMetrics>): boolean {
    if (this.lastEmitted === null) return true;

    return JSON.stringify(metrics) !== JSON.stringify(this.lastEmitted);
  }

  destroy(): void {
    this.destroyed = true;
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.lastEmitted = null;
    this.pendingMetrics = null;
    this.onMetricsReady = null;
    console.log('[AnalyticsRenderOpt] Destroyed');
  }
}
