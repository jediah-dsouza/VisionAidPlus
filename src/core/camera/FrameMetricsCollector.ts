import { logger } from '../debug';

export class FrameMetricsCollector {
  private destroyed = false;
  private startTime = Date.now();
  private totalFrames = 0;
  private processedFrames = 0;
  private droppedFrames = 0;
  private totalProcessingLatency = 0;
  private processingLatencySamples = 0;
  private peakProcessingLatency = 0;

  recordFrame(frame: { timestamp?: number }): void {
    if (this.destroyed) return;
    this.totalFrames++;
    this.processedFrames++;
  }

  recordDrop(reason: string): void {
    if (this.destroyed) return;
    this.totalFrames++;
    this.droppedFrames++;
  }

  recordProcessingLatency(latencyMs: number): void {
    if (this.destroyed) return;
    this.totalProcessingLatency += latencyMs;
    this.processingLatencySamples++;
    if (latencyMs > this.peakProcessingLatency) {
      this.peakProcessingLatency = latencyMs;
    }
  }

  getSnapshot() {
    return {
      totalFrames: this.totalFrames,
      processedFrames: this.processedFrames,
      droppedFrames: this.droppedFrames,
      dropRate: this.totalFrames > 0 ? this.droppedFrames / this.totalFrames : 0,
      averageProcessingLatencyMs: this.processingLatencySamples > 0
        ? this.totalProcessingLatency / this.processingLatencySamples : 0,
      peakProcessingLatencyMs: this.peakProcessingLatency,
      uptimeMs: Date.now() - this.startTime,
    };
  }

  reset(): void {
    this.startTime = Date.now();
    this.totalFrames = 0;
    this.processedFrames = 0;
    this.droppedFrames = 0;
    this.totalProcessingLatency = 0;
    this.processingLatencySamples = 0;
    this.peakProcessingLatency = 0;
  }

  destroy(): void {
    this.destroyed = true;
  }
}
