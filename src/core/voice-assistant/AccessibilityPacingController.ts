import type { VoiceAssistantConfig } from './types';
import { DEFAULT_VOICE_CONFIG } from './types';

export class AccessibilityPacingController {
  private config: VoiceAssistantConfig;
  private lastSpokenAt = 0;
  private burstCount = 0;
  private lastBurstReset = 0;

  constructor(config: Partial<VoiceAssistantConfig> = {}) {
    this.config = { ...DEFAULT_VOICE_CONFIG, ...config };
  }

  getNextInterval(): number {
    const now = Date.now();
    const elapsed = now - this.lastSpokenAt;

    if (this.lastSpokenAt === 0) {
      this.lastSpokenAt = now;
      this.burstCount = 1;
      this.lastBurstReset = now;
      return 0;
    }

    if (now - this.lastBurstReset > 10000) {
      this.burstCount = 0;
      this.lastBurstReset = now;
    }

    this.lastSpokenAt = now;
    this.burstCount++;

    if (this.burstCount > this.config.pacingMaxBurst) {
      return this.config.pacingMinIntervalMs;
    }

    return Math.max(this.config.minGapBetweenMessages, elapsed < 500 ? 400 : 200);
  }

  reset(): void {
    this.lastSpokenAt = 0;
    this.burstCount = 0;
  }

  updateConfig(config: Partial<VoiceAssistantConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
