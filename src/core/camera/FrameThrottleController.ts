import { logger } from '../debug';

export class FrameThrottleController {
  private targetFps: number;
  private destroyed = false;
  private frameCount = 0;
  private lastFrameTime = 0;
  private droppedCount = 0;
  private processedCount = 0;

  constructor(targetFps: number = 30) {
    this.targetFps = Math.max(1, Math.min(60, targetFps));
  }

  shouldProcess(): boolean {
    if (this.destroyed) return false;
    const now = Date.now();
    const minInterval = 1000 / this.targetFps;

    if (now - this.lastFrameTime < minInterval) {
      this.droppedCount++;
      return false;
    }
    return true;
  }

  recordProcessed(): void {
    if (this.destroyed) return;
    this.processedCount++;
    this.lastFrameTime = Date.now();
  }

  setTargetFps(fps: number): void {
    this.targetFps = Math.max(1, Math.min(60, fps));
  }

  getTargetFps(): number {
    return this.targetFps;
  }

  getEffectiveFps(): number {
    if (this.destroyed) return 0;
    const elapsed = Date.now() - this.lastFrameTime;
    if (elapsed <= 0) return this.targetFps;
    const actualFps = (this.processedCount / (elapsed / 1000));
    return Math.min(this.targetFps, Math.round(actualFps));
  }

  getDropRate(): number {
    const total = this.processedCount + this.droppedCount;
    if (total === 0) return 0;
    return this.droppedCount / total;
  }

  reset(): void {
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.droppedCount = 0;
    this.processedCount = 0;
  }

  destroy(): void {
    this.destroyed = true;
  }
}
