import { logger } from '../debug';
import type { AIConfig } from './types';
import { DEFAULT_AI_CONFIG } from './types';

export class RenderingPerformanceMonitor {
  private config: AIConfig;
  private destroyed = false;
  private renderTimestamps: number[] = [];
  private renderCount = 0;
  private totalRenderTime = 0;
  private maxRenderTime = 0;
  private overlayCounts: number[] = [];

  constructor(config: Partial<AIConfig> = {}) {
    this.config = { ...DEFAULT_AI_CONFIG, ...config };
  }

  recordRender(overlayCount: number, renderTimeMs: number): void {
    if (this.destroyed) return;
    this.renderCount++;
    this.totalRenderTime += renderTimeMs;
    this.overlayCounts.push(overlayCount);
    if (renderTimeMs > this.maxRenderTime) this.maxRenderTime = renderTimeMs;
    this.renderTimestamps.push(Date.now());

    if (this.renderTimestamps.length > 200) this.renderTimestamps.shift();
    if (this.overlayCounts.length > 200) this.overlayCounts.shift();
  }

  getAverageRenderFps(): number {
    if (this.renderTimestamps.length < 2) return 0;
    const window = this.renderTimestamps.slice(-60);
    if (window.length < 2) return 0;
    const elapsed = (window[window.length - 1] - window[0]) / 1000;
    if (elapsed <= 0) return 0;
    return (window.length - 1) / elapsed;
  }

  getAverageRenderTime(): number {
    if (this.renderCount === 0) return 0;
    return this.totalRenderTime / this.renderCount;
  }

  getMaxRenderTime(): number {
    return this.maxRenderTime;
  }

  getAverageOverlayCount(): number {
    if (this.overlayCounts.length === 0) return 0;
    return this.overlayCounts.reduce((a, b) => a + b, 0) / this.overlayCounts.length;
  }

  getSnapshot() {
    return {
      renderCount: this.renderCount,
      averageRenderFps: this.getAverageRenderFps(),
      averageRenderTimeMs: this.getAverageRenderTime(),
      maxRenderTimeMs: this.maxRenderTime,
      averageOverlayCount: this.getAverageOverlayCount(),
    };
  }

  reset(): void {
    this.renderTimestamps = [];
    this.renderCount = 0;
    this.totalRenderTime = 0;
    this.maxRenderTime = 0;
    this.overlayCounts = [];
  }

  destroy(): void {
    this.destroyed = true;
    this.reset();
    logger.info('[RenderingPerformanceMonitor] Destroyed');
  }
}
