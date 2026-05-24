import { logger } from '../debug';
import type { SpeechMessage, VoiceAssistantConfig } from './types';
import { DEFAULT_VOICE_CONFIG } from './types';

interface DedupEntry {
  text: string;
  priority: string;
  category: string;
  timestamp: number;
}

export class SpeechDeduplicationEngine {
  private config: VoiceAssistantConfig;
  private recentMessages: DedupEntry[] = [];
  private destroyed = false;

  constructor(config: Partial<VoiceAssistantConfig> = {}) {
    this.config = { ...DEFAULT_VOICE_CONFIG, ...config };
  }

  isDuplicate(message: SpeechMessage): boolean {
    if (this.destroyed) return false;
    if (message.priority === 'critical') return false;

    const now = Date.now();
    const window = now - this.config.dedupWindowMs;

    this.prune(window);

    for (const entry of this.recentMessages) {
      if (entry.timestamp < window) continue;
      if (
        entry.text === message.text &&
        entry.priority === message.priority &&
        entry.category === message.category
      ) {
        return true;
      }
    }
    return false;
  }

  record(message: SpeechMessage): void {
    if (this.destroyed) return;

    this.recentMessages.push({
      text: message.text,
      priority: message.priority,
      category: message.category,
      timestamp: message.timestamp,
    });

    if (this.recentMessages.length > 200) {
      this.recentMessages.splice(0, 50);
    }
  }

  private prune(window: number): void {
    const before = this.recentMessages.length;
    this.recentMessages = this.recentMessages.filter(e => e.timestamp >= window);
    if (this.recentMessages.length < before) {
      logger.debug(`[Dedup] Pruned ${before - this.recentMessages.length} entries`);
    }
  }

  clear(): void {
    this.recentMessages = [];
  }

  getEntryCount(): number {
    return this.recentMessages.length;
  }

  updateConfig(config: Partial<VoiceAssistantConfig>): void {
    this.config = { ...this.config, ...config };
  }

  destroy(): void {
    this.destroyed = true;
    this.clear();
    logger.info('[Dedup] Destroyed');
  }
}
