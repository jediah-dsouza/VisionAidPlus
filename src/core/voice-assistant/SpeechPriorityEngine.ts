import { logger } from '../debug';
import type { VoicePriority, VoiceCategory, VoiceSource, SpeechMessage, SpeechQueueItem, VoiceAssistantConfig } from './types';
import { DEFAULT_VOICE_CONFIG, PRIORITY_WEIGHTS } from './types';

const CATEGORY_BASE_PRIORITY: Record<VoiceCategory, VoicePriority> = {
  emergency: 'critical',
  navigation: 'high',
  obstacle: 'high',
  system: 'normal',
  command: 'normal',
  accessibility: 'low',
  notification: 'background',
};

const SOURCE_WEIGHT: Record<VoiceSource, number> = {
  emergency: 100,
  navigation: 80,
  ai: 60,
  tts: 40,
  accessibility: 30,
  user: 20,
};

export class SpeechPriorityEngine {
  private config: VoiceAssistantConfig;

  constructor(config: Partial<VoiceAssistantConfig> = {}) {
    this.config = { ...DEFAULT_VOICE_CONFIG, ...config };
  }

  getPriorityForCategory(category: VoiceCategory): VoicePriority {
    return CATEGORY_BASE_PRIORITY[category];
  }

  computePriorityScore(item: SpeechMessage): number {
    const priorityWeight = PRIORITY_WEIGHTS[item.priority];
    const sourceWeight = SOURCE_WEIGHT[item.source];
    return priorityWeight * 10 + (100 - sourceWeight);
  }

  computeStarvationScore(
    item: SpeechQueueItem,
    currentTime: number,
  ): number {
    const waitTime = currentTime - item.enqueuedAt;
    if (waitTime < this.config.starvationThresholdMs) return 0;
    const excessTime = waitTime - this.config.starvationThresholdMs;
    return (excessTime / 1000) * this.config.starvationBoostFactor;
  }

  getQueueInsertIndex(
    queue: SpeechQueueItem[],
    newItem: SpeechMessage,
  ): number {
    const newScore = this.computePriorityScore(newItem);
    const now = Date.now();

    for (let i = 0; i < queue.length; i++) {
      const existing = queue[i];
      const existingScore = existing.priorityScore;
      const starvedScore =
        existingScore - this.computeStarvationScore(existing, now);
      const newStarvedScore = newScore;
      if (newStarvedScore < starvedScore) {
        return i;
      }
    }
    return queue.length;
  }

  shouldInterrupt(
    current: SpeechMessage | null,
    incoming: SpeechMessage,
  ): boolean {
    if (!current) return true;
    if (incoming.priority === 'critical') return true;
    if (incoming.priority === 'high' && current.priority !== 'critical') return true;
    if (current.priority === 'background') return true;
    return false;
  }

  isDuplicate(
    existing: SpeechMessage[],
    incoming: SpeechMessage,
    windowMs: number = this.config.dedupWindowMs,
  ): boolean {
    const now = Date.now();
    const window = now - windowMs;
    for (const msg of existing) {
      if (msg.timestamp < window) continue;
      if (
        msg.text === incoming.text &&
        msg.priority === incoming.priority &&
        msg.category === incoming.category
      ) {
        return true;
      }
    }
    return false;
  }

  updateConfig(config: Partial<VoiceAssistantConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
