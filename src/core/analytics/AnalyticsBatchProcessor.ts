import type { AnalyticsEvent } from './types';

export interface BatchProcessorConfig {
  batchSize: number;
  batchIntervalMs: number;
}

const DEFAULT_CONFIG: BatchProcessorConfig = {
  batchSize: 50,
  batchIntervalMs: 50,
};

export class AnalyticsBatchProcessor {
  private queue: AnalyticsEvent[] = [];
  private config: BatchProcessorConfig;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  private flushes = 0;

  public onBatchReady: ((batch: AnalyticsEvent[]) => void) | null = null;

  constructor(config: Partial<BatchProcessorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log(
      `[AnalyticsBatchProcessor] Created batchSize=${this.config.batchSize} interval=${this.config.batchIntervalMs}ms`,
    );
  }

  enqueue(event: AnalyticsEvent): void {
    if (this.destroyed) {
      console.warn('[AnalyticsBatchProcessor] Cannot enqueue on destroyed processor');
      return;
    }

    if (this.queue.length < this.config.batchSize) {
      this.queue.push(event);
      console.log(
        `[AnalyticsBatchProcessor] Enqueued event #${event.sequence} (queue: ${this.queue.length}/${this.config.batchSize})`,
      );
    } else {
      console.warn(
        `[AnalyticsBatchProcessor] Queue full (${this.queue.length}), dropping event #${event.sequence}`,
      );
      return;
    }

    if (this.queue.length >= this.config.batchSize) {
      this.flush();
      return;
    }

    if (!this.timer) {
      this.timer = setTimeout(() => {
        if (!this.destroyed && this.queue.length > 0) {
          this.flush();
        }
        this.timer = null;
      }, this.config.batchIntervalMs);
    }
  }

  flush(): AnalyticsEvent[] {
    if (this.queue.length === 0) return [];

    const batch = this.queue.splice(0, this.config.batchSize);
    this.flushes++;

    console.log(
      `[AnalyticsBatchProcessor] Flushed batch #${this.flushes} (${batch.length} events, ${this.queue.length} remaining)`,
    );

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.onBatchReady) {
      try {
        this.onBatchReady(batch);
      } catch (error) {
        console.error('[AnalyticsBatchProcessor] onBatchReady error:', error);
      }
    }

    return batch;
  }

  getQueueDepth(): number {
    return this.queue.length;
  }

  get totalFlushes(): number {
    return this.flushes;
  }

  destroy(): void {
    this.destroyed = true;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length > 0) {
      console.log(`[AnalyticsBatchProcessor] Draining ${this.queue.length} events on destroy`);
      this.queue = [];
    }

    this.onBatchReady = null;
    this.flushes = 0;
    console.log('[AnalyticsBatchProcessor] Destroyed');
  }
}

export const analyticsBatchProcessor = new AnalyticsBatchProcessor();
