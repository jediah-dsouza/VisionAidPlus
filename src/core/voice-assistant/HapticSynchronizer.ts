import { logger } from '../debug';
import { eventBus } from '../events/EventBus';
import { accessibilityEngine } from '../accessibility';
import { VOICE_EVENTS } from './VoiceEventBus';
import type { VoiceAssistantConfig, SpeechQueueItem } from './types';
import { DEFAULT_VOICE_CONFIG } from './types';

export class HapticSynchronizer {
  private config: VoiceAssistantConfig;
  private destroyed = false;
  private lastHapticAt = 0;

  constructor(config: Partial<VoiceAssistantConfig> = {}) {
    this.config = { ...DEFAULT_VOICE_CONFIG, ...config };
  }

  syncWithSpeech(item: SpeechQueueItem): void {
    if (this.destroyed) return;

    if (!item.hapticPattern) return;

    const now = Date.now();
    if (now - this.lastHapticAt < this.config.hapticCooldownMs) {
      return;
    }

    try {
      accessibilityEngine.triggerHaptic(item.hapticPattern as any);
      this.lastHapticAt = now;

      eventBus.publish(VOICE_EVENTS.HAPTIC_SYNC, {
        pattern: item.hapticPattern,
        speechId: item.id,
      }, 'low');
    } catch (err) {
      logger.error('[HapticSync] Failed:', err);
    }
  }

  triggerPattern(pattern: string): void {
    if (this.destroyed) return;

    const now = Date.now();
    if (now - this.lastHapticAt < this.config.hapticCooldownMs) return;

    try {
      accessibilityEngine.triggerHaptic(pattern as any);
      this.lastHapticAt = now;
    } catch (err) {
      logger.error('[HapticSync] Pattern failed:', err);
    }
  }

  getLastHapticAt(): number {
    return this.lastHapticAt;
  }

  destroy(): void {
    this.destroyed = true;
    logger.info('[HapticSync] Destroyed');
  }
}
