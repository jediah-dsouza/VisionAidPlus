import { logger } from '../debug';
import type { DetectionContract, AIConfig } from './types';
import { DEFAULT_AI_CONFIG } from './types';

interface DedupSignature {
  type: string;
  positionHash: string;
  confidenceBin: number;
  recordedAt: number;
}

export class DetectionDeduplicationLayer {
  private config: AIConfig;
  private signatures: DedupSignature[] = [];
  private destroyed = false;
  private suppressedCount = 0;

  constructor(config: Partial<AIConfig> = {}) {
    this.config = { ...DEFAULT_AI_CONFIG, ...config };
  }

  isDuplicate(detection: DetectionContract): boolean {
    if (this.destroyed) return false;
    if (detection.priority === 'critical') return false;

    const sig = this.makeSignature(detection);
    const window = Date.now() - this.config.dedupWindowMs;

    for (const existing of this.signatures) {
      if (existing.recordedAt < window) continue;
      if (
        existing.type === sig.type &&
        existing.positionHash === sig.positionHash &&
        existing.confidenceBin === sig.confidenceBin
      ) {
        this.suppressedCount++;
        return true;
      }
    }
    return false;
  }

  record(detection: DetectionContract): void {
    if (this.destroyed || detection.priority === 'critical') return;

    this.signatures.push({
      ...this.makeSignature(detection),
      recordedAt: Date.now(),
    });

    if (this.signatures.length > 500) {
      this.signatures = this.signatures.slice(-250);
    }
  }

  getSuppressedCount(): number {
    return this.suppressedCount;
  }

  clear(): void {
    this.signatures = [];
    this.suppressedCount = 0;
  }

  private makeSignature(detection: DetectionContract): Omit<DedupSignature, 'recordedAt'> {
    const posHash = `${Math.round(detection.position.x / 10)},${Math.round(detection.position.y / 10)},${Math.round(detection.position.width / 10)},${Math.round(detection.position.height / 10)}`;
    const confidenceBin = Math.round(detection.confidence.overall * 10) / 10;
    return {
      type: detection.type,
      positionHash: posHash,
      confidenceBin,
    };
  }

  destroy(): void {
    this.destroyed = true;
    this.clear();
    logger.info('[DetectionDedup] Destroyed');
  }
}
