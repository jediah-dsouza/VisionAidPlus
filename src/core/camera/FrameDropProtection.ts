import { logger } from '../debug';

export class FrameDropProtection {
  private destroyed = false;
  private dropHistory: number[] = [];
  private consecutiveDrops = 0;
  private totalDrops = 0;

  recordDrop(): void {
    if (this.destroyed) return;
    this.consecutiveDrops++;
    this.totalDrops++;
    this.dropHistory.push(Date.now());

    if (this.dropHistory.length > 100) {
      this.dropHistory.shift();
    }
  }

  recordProcessed(): void {
    if (this.destroyed) return;
    this.consecutiveDrops = 0;
  }

  isStarving(): boolean {
    if (this.destroyed) return false;
    const window = 5000;
    const recent = this.dropHistory.filter(t => Date.now() - t < window);
    return recent.length > 30;
  }

  getConsecutiveDrops(): number {
    return this.consecutiveDrops;
  }

  getTotalDrops(): number {
    return this.totalDrops;
  }

  getDropRate(windowMs: number = 5000): number {
    const now = Date.now();
    const recent = this.dropHistory.filter(t => now - t < windowMs);
    return recent.length / (windowMs / 1000);
  }

  reset(): void {
    this.dropHistory = [];
    this.consecutiveDrops = 0;
    this.totalDrops = 0;
  }

  destroy(): void {
    this.destroyed = true;
    this.reset();
    logger.info('[FrameDropProtection] Destroyed');
  }
}
