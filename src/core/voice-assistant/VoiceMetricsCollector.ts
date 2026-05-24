import { logger } from '../debug';
import { eventBus } from '../events/EventBus';
import { VOICE_EVENTS } from './VoiceEventBus';
import type { VoiceMetrics } from './types';

export class VoiceMetricsCollector {
  private startTime = Date.now();
  private destroyed = false;
  private snapshot: VoiceMetrics = {
    totalMessages: 0,
    totalSpoken: 0,
    totalInterrupted: 0,
    totalFailed: 0,
    totalDuplicatesSuppressed: 0,
    totalStarvationPrevented: 0,
    averageQueueWaitMs: 0,
    peakQueueDepth: 0,
    currentQueueDepth: 0,
    uptimeMs: 0,
    lastSpokenAt: null,
    errors: 0,
  };
  private reportInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {}

  updateFrom(metrics: VoiceMetrics): void {
    if (this.destroyed) return;
    this.snapshot = { ...metrics, uptimeMs: Date.now() - this.startTime };
  }

  recordError(): void {
    this.snapshot.errors++;
  }

  getSnapshot(): VoiceMetrics {
    return {
      ...this.snapshot,
      uptimeMs: Date.now() - this.startTime,
    };
  }

  startAutoReporting(intervalMs: number = 30000): void {
    if (this.destroyed || this.reportInterval) return;

    this.reportInterval = setInterval(() => {
      if (this.destroyed) return;
      const snapshot = this.getSnapshot();
      eventBus.publish(VOICE_EVENTS.METRICS_UPDATE, { metrics: snapshot }, 'low');
      logger.info('[VoiceMetrics]', snapshot);
    }, intervalMs);
  }

  stopAutoReporting(): void {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
  }

  reset(): void {
    this.startTime = Date.now();
    this.snapshot = {
      totalMessages: 0,
      totalSpoken: 0,
      totalInterrupted: 0,
      totalFailed: 0,
      totalDuplicatesSuppressed: 0,
      totalStarvationPrevented: 0,
      averageQueueWaitMs: 0,
      peakQueueDepth: 0,
      currentQueueDepth: 0,
      uptimeMs: 0,
      lastSpokenAt: null,
      errors: 0,
    };
  }

  destroy(): void {
    this.destroyed = true;
    this.stopAutoReporting();
    logger.info('[VoiceMetrics] Destroyed');
  }
}
