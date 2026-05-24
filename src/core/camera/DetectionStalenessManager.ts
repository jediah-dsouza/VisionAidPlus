import { logger } from '../debug';
import type { DetectionContract, AIConfig } from './types';
import { DEFAULT_AI_CONFIG } from './types';

export class DetectionStalenessManager {
  private config: AIConfig;
  private destroyed = false;
  private prunedCount = 0;

  constructor(config: Partial<AIConfig> = {}) {
    this.config = { ...DEFAULT_AI_CONFIG, ...config };
  }

  isStale(detection: DetectionContract): boolean {
    if (this.destroyed) return false;
    const age = Date.now() - detection.processedAt;
    if (detection.priority === 'critical') return age > this.config.stalenessTtlMs * 2;
    return age > this.config.stalenessTtlMs;
  }

  prune(detections: DetectionContract[]): DetectionContract[] {
    if (this.destroyed) return detections;

    const fresh = detections.filter(d => {
      const stale = this.isStale(d);
      if (stale) this.prunedCount++;
      return !stale;
    });

    if (this.prunedCount > 0) {
      logger.info(`[DetectionStaleness] Pruned ${this.prunedCount} stale`);
    }
    return fresh;
  }

  getPrunedCount(): number {
    return this.prunedCount;
  }

  reset(): void {
    this.prunedCount = 0;
  }

  destroy(): void {
    this.destroyed = true;
    logger.info('[DetectionStaleness] Destroyed');
  }
}
