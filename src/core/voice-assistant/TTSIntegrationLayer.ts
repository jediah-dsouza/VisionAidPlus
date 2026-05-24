import { logger } from '../debug';
import { eventBus, EventPriority } from '../events/EventBus';
import { ttsService } from '../native/TTSService';
import { accessibilityEngine } from '../accessibility';
import { VOICE_EVENTS } from './VoiceEventBus';
import type { SpeechMessage, SpeechQueueItem, VoiceAssistantConfig } from './types';
import { DEFAULT_VOICE_CONFIG } from './types';


export class TTSIntegrationLayer {
  private config: VoiceAssistantConfig;
  private destroyed = false;
  private bridgeActive = false;

  constructor(config: Partial<VoiceAssistantConfig> = {}) {
    this.config = { ...DEFAULT_VOICE_CONFIG, ...config };
  }

  speakViaTTS(item: SpeechQueueItem): void {
    if (this.destroyed) return;

    if (this.config.quietHoursEnabled && item.priority !== 'critical') {
      return;
    }

    try {
      ttsService.speak(item.text, item.priority as EventPriority);
    } catch (err) {
      logger.error('[TTSIntegration] ttsService.speak failed:', err);
    }
  }

  announceViaAccessibility(item: SpeechQueueItem): void {
    if (this.destroyed) return;

    try {
      accessibilityEngine.announce(
        item.text,
        item.priority as any,
        item.priority === 'critical',
      );
    } catch (err) {
      logger.error('[TTSIntegration] accessibilityEngine.announce failed:', err);
    }
  }

  deliver(item: SpeechQueueItem): void {
    if (this.destroyed) return;

    this.speakViaTTS(item);
    this.announceViaAccessibility(item);
  }

  initialize(): void {
    if (this.bridgeActive) return;
    this.bridgeActive = true;
    logger.info('[TTSIntegration] Bridge active');
  }

  destroy(): void {
    this.destroyed = true;
    this.bridgeActive = false;
    logger.info('[TTSIntegration] Destroyed');
  }
}
