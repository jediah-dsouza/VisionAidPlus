import { logger } from '../debug';
import { VOICE_EVENTS } from './VoiceEventBus';
import { eventBus } from '../events/EventBus';
import { SpeechPriorityEngine } from './SpeechPriorityEngine';
import type {
  SpeechMessage,
  SpeechQueueItem,
  VoicePriority,
  VoiceAssistantConfig,
  VoiceMetrics,
} from './types';
import { DEFAULT_VOICE_CONFIG, PRIORITY_ORDER } from './types';

export class SpeechQueueManager {
  private queue: SpeechQueueItem[] = [];
  private config: VoiceAssistantConfig;
  private priorityEngine: SpeechPriorityEngine;
  private metrics = this.createEmptyMetrics();
  private destroyed = false;
  private positionCounter = 0;

  constructor(
    config: Partial<VoiceAssistantConfig> = {},
    priorityEngine?: SpeechPriorityEngine,
  ) {
    this.config = { ...DEFAULT_VOICE_CONFIG, ...config };
    this.priorityEngine = priorityEngine ?? new SpeechPriorityEngine(this.config);
  }

  private createEmptyMetrics(): VoiceMetrics {
    return {
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

  enqueue(item: SpeechMessage): SpeechQueueItem | null {
    if (this.destroyed) return null;

    if (this.queue.length >= this.config.maxQueueSize) {
      const oldest = this.queue.shift();
      if (oldest) {
        logger.warn(`[VoiceQueue] Overflow, dropped oldest: ${oldest.id}`);
        eventBus.publish(VOICE_EVENTS.QUEUE_OVERFLOW, { droppedId: oldest.id }, 'normal');
      }
    }

    const priorityScore = this.priorityEngine.computePriorityScore(item);
    const queueItem: SpeechQueueItem = {
      ...item,
      enqueuedAt: Date.now(),
      queuePosition: this.positionCounter++,
      priorityScore,
      starvationScore: 0,
    };

    const insertIdx = this.priorityEngine.getQueueInsertIndex(this.queue, item);
    this.queue.splice(insertIdx, 0, queueItem);

    this.metrics.totalMessages++;
    this.metrics.currentQueueDepth = this.queue.length;
    if (this.queue.length > this.metrics.peakQueueDepth) {
      this.metrics.peakQueueDepth = this.queue.length;
    }

    eventBus.publish(VOICE_EVENTS.SPEECH_QUEUED, { item: queueItem }, 'normal');
    return queueItem;
  }

  dequeue(
    priorities?: VoicePriority[],
  ): SpeechQueueItem | null {
    if (this.destroyed || this.queue.length === 0) return null;

    const allowed = priorities ?? PRIORITY_ORDER;
    const allowedSet = new Set(allowed);

    let bestIdx = -1;
    let bestScore = Infinity;

    const now = Date.now();

    for (let i = 0; i < this.queue.length; i++) {
      const item = this.queue[i];
      if (!allowedSet.has(item.priority)) continue;

      const starvationBoost = this.priorityEngine.computeStarvationScore(item, now);
      const adjustedScore = item.priorityScore - starvationBoost;

      if (starvationBoost > 0 && adjustedScore < item.priorityScore) {
        this.metrics.totalStarvationPrevented++;
        eventBus.publish(VOICE_EVENTS.STARVATION_PREVENTED, {
          itemId: item.id,
          waitMs: now - item.enqueuedAt,
          boost: starvationBoost,
        }, 'normal');
      }

      if (adjustedScore < bestScore) {
        bestScore = adjustedScore;
        bestIdx = i;
      }
    }

    if (bestIdx === -1) return null;

    const removed = this.queue.splice(bestIdx, 1)[0];
    this.metrics.currentQueueDepth = this.queue.length;

    const waitMs = Date.now() - removed.enqueuedAt;
    this.metrics.averageQueueWaitMs =
      (this.metrics.averageQueueWaitMs * (this.metrics.totalSpoken) + waitMs) /
      (this.metrics.totalSpoken + 1);

    return removed;
  }

  peek(priorities?: VoicePriority[]): SpeechQueueItem | null {
    if (this.queue.length === 0) return null;
    const allowed = priorities ?? PRIORITY_ORDER;
    const allowedSet = new Set(allowed);
    return this.queue.find(i => allowedSet.has(i.priority)) ?? null;
  }

  remove(id: string): boolean {
    const idx = this.queue.findIndex(i => i.id === id);
    if (idx === -1) return false;
    this.queue.splice(idx, 1);
    this.metrics.currentQueueDepth = this.queue.length;
    return true;
  }

  removeByCategory(category: string): number {
    const before = this.queue.length;
    this.queue = this.queue.filter(i => i.category !== category);
    const removed = before - this.queue.length;
    this.metrics.currentQueueDepth = this.queue.length;
    return removed;
  }

  clear(): void {
    const dropped = this.queue.length;
    this.queue = [];
    this.metrics.currentQueueDepth = 0;
    eventBus.publish(VOICE_EVENTS.QUEUE_DRAINED, { dropped }, 'normal');
    logger.info(`[VoiceQueue] Cleared ${dropped} items`);
  }

  pruneStale(): number {
    const now = Date.now();
    const before = this.queue.length;
    this.queue = this.queue.filter(i => i.expiresAt > now);
    const pruned = before - this.queue.length;
    this.metrics.currentQueueDepth = this.queue.length;
    if (pruned > 0) {
      logger.info(`[VoiceQueue] Pruned ${pruned} stale items`);
    }
    return pruned;
  }

  getLength(): number {
    return this.queue.length;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  getQueue(): ReadonlyArray<SpeechQueueItem> {
    return this.queue;
  }

  recordSpoken(): void {
    this.metrics.totalSpoken++;
    this.metrics.lastSpokenAt = Date.now();
  }

  recordInterrupted(): void {
    this.metrics.totalInterrupted++;
  }

  recordFailed(): void {
    this.metrics.totalFailed++;
  }

  recordDuplicateSuppressed(): void {
    this.metrics.totalDuplicatesSuppressed++;
  }

  getMetrics(): VoiceMetrics {
    return { ...this.metrics, uptimeMs: Date.now() - (this.metrics.lastSpokenAt ?? Date.now()) + 1000 };
  }

  destroy(): void {
    this.destroyed = true;
    this.clear();
    logger.info('[VoiceQueue] Destroyed');
  }
}
