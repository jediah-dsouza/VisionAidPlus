import type { AnalyticsEvent, EngineMetrics } from './types';

export abstract class AnalyticsAggregationEngine {
  protected engineName: string;
  protected eventCount = 0;
  protected lastProcessedAt = 0;
  protected processingTimeMs = 0;
  protected memoryEstimateBytes = 0;
  protected destroyed = false;

  constructor(engineName: string) {
    this.engineName = engineName;
    console.log(`[AnalyticsAggEngine] Created engine: ${engineName}`);
  }

  abstract processEvent(event: AnalyticsEvent): void;
  abstract snapshot(): any;
  abstract reset(): void;

  getMetrics(): EngineMetrics {
    return {
      engineName: this.engineName,
      eventCount: this.eventCount,
      lastProcessedAt: this.lastProcessedAt,
      memoryEstimateBytes: this.memoryEstimateBytes,
      processingTimeMs: this.processingTimeMs,
    };
  }

  protected trackEvent(processFn: () => void): void {
    const start = performance.now();
    try {
      processFn();
      this.eventCount++;
      this.lastProcessedAt = Date.now();
    } catch (error) {
      console.error(`[AnalyticsAggEngine] ${this.engineName} process error:`, error);
    }
    this.processingTimeMs += performance.now() - start;
  }

  get name(): string {
    return this.engineName;
  }

  get isDestroyed(): boolean {
    return this.destroyed;
  }

  destroy(): void {
    this.destroyed = true;
    this.eventCount = 0;
    this.lastProcessedAt = 0;
    this.processingTimeMs = 0;
    this.memoryEstimateBytes = 0;
    console.log(`[AnalyticsAggEngine] Engine ${this.engineName} destroyed`);
  }
}
