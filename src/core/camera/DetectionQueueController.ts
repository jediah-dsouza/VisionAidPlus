import { logger } from '../debug';
import { eventBus } from '../events/EventBus';
import { AI_EVENTS } from '../events/AI_EVENTS';
import type { DetectionContract, DetectionQueueItem, DetectionPriority, AIConfig } from './types';
import { DEFAULT_AI_CONFIG, DETECTION_TYPE_PRIORITY } from './types';

const PRIORITY_WEIGHT: Record<DetectionPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
  background: 4,
};

export class DetectionQueueController {
  private queue: DetectionQueueItem[] = [];
  private config: AIConfig;
  private destroyed = false;
  private positionCounter = 0;
  private overflowCount = 0;

  constructor(config: Partial<AIConfig> = {}) {
    this.config = { ...DEFAULT_AI_CONFIG, ...config };
  }

  enqueue(detection: DetectionContract): DetectionQueueItem | null {
    if (this.destroyed) return null;

    if (this.queue.length >= this.config.maxQueueSize) {
      const oldest = this.queue.shift();
      if (oldest) {
        this.overflowCount++;
        eventBus.publish(AI_EVENTS.QUEUE_OVERFLOW, {
          droppedCount: 1, droppedId: oldest.detection.id,
        }, 'normal');
      }
    }

    const item: DetectionQueueItem = {
      detection,
      enqueuedAt: Date.now(),
      queuePosition: this.positionCounter++,
      priorityScore: this.computeScore(detection),
      starvationScore: 0,
    };

    const insertIdx = this.findInsertIndex(item);
    this.queue.splice(insertIdx, 0, item);
    return item;
  }

  dequeue(priorities?: DetectionPriority[]): DetectionQueueItem | null {
    if (this.destroyed || this.queue.length === 0) return null;

    const allowed = priorities
      ? new Set(priorities)
      : new Set<DetectionPriority>(['critical', 'high', 'normal', 'low', 'background']);

    let bestIdx = -1;
    let bestScore = Infinity;
    const now = Date.now();

    for (let i = 0; i < this.queue.length; i++) {
      const item = this.queue[i];
      if (!allowed.has(item.detection.priority)) continue;

      const waitTime = now - item.enqueuedAt;
      const starvationBoost = waitTime > this.config.starvationThresholdMs
        ? ((waitTime - this.config.starvationThresholdMs) / 1000) * this.config.starvationBoostFactor
        : 0;
      const adjustedScore = item.priorityScore - starvationBoost;

      if (adjustedScore < bestScore) {
        bestScore = adjustedScore;
        bestIdx = i;
      }
    }

    if (bestIdx === -1) return null;
    return this.queue.splice(bestIdx, 1)[0];
  }

  peek(): DetectionQueueItem | null {
    if (this.destroyed || this.queue.length === 0) return null;
    return this.queue.reduce((best, item) =>
      item.priorityScore < best.priorityScore ? item : best, this.queue[0]);
  }

  remove(id: string): boolean {
    const idx = this.queue.findIndex(i => i.detection.id === id);
    if (idx === -1) return false;
    this.queue.splice(idx, 1);
    return true;
  }

  getLength(): number {
    return this.queue.length;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  clear(): void {
    this.queue = [];
  }

  getOverflowCount(): number {
    return this.overflowCount;
  }

  private computeScore(detection: DetectionContract): number {
    const priorityWeight = PRIORITY_WEIGHT[detection.priority];
    const confidencePenalty = Math.round((1 - detection.confidence.overall) * 10);
    return priorityWeight * 100 + confidencePenalty;
  }

  private findInsertIndex(item: DetectionQueueItem): number {
    for (let i = 0; i < this.queue.length; i++) {
      if (item.priorityScore < this.queue[i].priorityScore) return i;
    }
    return this.queue.length;
  }

  destroy(): void {
    this.destroyed = true;
    this.clear();
    logger.info('[DetectionQueue] Destroyed');
  }
}
