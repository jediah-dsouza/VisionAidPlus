import { Vibration, Platform } from 'react-native';
import { EventPriority } from '../events/EventBus';
import { logger } from '../debug';
import { HapticPattern } from './EventPriorityMapper';

export type HapticIntensity = 'light' | 'medium' | 'heavy';

export interface HapticConfig {
  enabled: boolean;
  coordWithVoice: boolean;
  voiceGapMs: number;
}

interface HapticPatternDef {
  duration: number | number[];
  intensity?: HapticIntensity;
}

const DEFAULT_CONFIG: HapticConfig = {
  enabled: true,
  coordWithVoice: true,
  voiceGapMs: 50,
};

const MAX_PENDING_HAPTICS = 10;

const PATTERNS: Record<string, HapticPatternDef> = {
  light: { duration: 10, intensity: 'light' },
  medium: { duration: 20, intensity: 'medium' },
  heavy: { duration: 30, intensity: 'heavy' },
  success: { duration: [0, 50, 50, 50], intensity: 'medium' },
  warning: { duration: [0, 100, 50, 100], intensity: 'medium' },
  error: { duration: [0, 200, 50, 200, 50, 200], intensity: 'heavy' },
  emergency: {
    duration: [0, 100, 50, 100, 50, 100, 50, 100],
    intensity: 'heavy',
  },
};

export class HapticCoordinator {
  private config: HapticConfig;
  private lastVibrationTime = 0;
  private isVoiceSpeaking = false;
  private pendingHaptics: Array<{ pattern: string; timestamp: number }> = [];
  private processingPending = false;
  private destroyed = false;

  constructor(config: Partial<HapticConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  updateConfig(partial: Partial<HapticConfig>): void {
    if (this.destroyed) return;
    this.config = { ...this.config, ...partial };
  }

  getConfig(): HapticConfig {
    return { ...this.config };
  }

  setVoiceSpeaking(speaking: boolean): void {
    if (this.destroyed) return;
    this.isVoiceSpeaking = speaking;
    if (!speaking && this.config.coordWithVoice) {
      this.processPendingHaptics();
    }
  }

  vibrate(pattern: HapticPattern = 'light'): void {
    if (this.destroyed || !this.config.enabled) return;

    const patternDef = PATTERNS[pattern];
    if (!patternDef) {
      logger.warn(`HapticCoordinator: Unknown pattern ${pattern}`);
      return;
    }

    const now = Date.now();
    const timeSinceLastVibration = now - this.lastVibrationTime;

    if (this.config.coordWithVoice && this.isVoiceSpeaking) {
      if (timeSinceLastVibration < this.config.voiceGapMs * 2) {
        if (this.pendingHaptics.length >= MAX_PENDING_HAPTICS) {
          this.pendingHaptics.shift();
          logger.debug(`HapticCoordinator: Pending queue full, dropping oldest`);
        }
        this.pendingHaptics.push({ pattern, timestamp: now });
        logger.debug(`HapticCoordinator: Queued haptic ${pattern} (voice speaking)`);
        return;
      }
    }

    this.triggerVibration(patternDef, pattern);
  }

  vibrateSync(pattern: HapticPattern = 'light'): void {
    this.vibrate(pattern);
  }

  vibrateAsync(pattern: HapticPattern = 'light'): void {
    this.vibrate(pattern);
  }

  private triggerVibration(patternDef: HapticPatternDef, name: string): void {
    if (this.destroyed) return;

    try {
      const duration = patternDef.duration;
      Vibration.vibrate(duration);
      this.lastVibrationTime = Date.now();
      logger.debug(`HapticCoordinator: Triggered ${name} pattern`);
    } catch (error) {
      logger.error(`HapticCoordinator: Failed to trigger ${name}`, error);
    }
  }

  private async processPendingHaptics(): Promise<void> {
    if (this.destroyed || this.processingPending) return;
    this.processingPending = true;

    while (this.pendingHaptics.length > 0) {
      if (this.destroyed) break;

      const haptic = this.pendingHaptics.shift();
      if (haptic) {
        const patternDef = PATTERNS[haptic.pattern];
        if (patternDef) {
          await new Promise(resolve => setTimeout(resolve, this.config.voiceGapMs));
          if (!this.destroyed) {
            this.triggerVibration(patternDef, haptic.pattern);
          }
        }
      }
    }

    this.processingPending = false;
  }

  vibrateByPriority(priority: EventPriority): void {
    if (this.destroyed) return;
    switch (priority) {
      case 'critical':
        this.vibrate('emergency');
        break;
      case 'high':
        this.vibrate('warning');
        break;
      case 'normal':
        this.vibrate('medium');
        break;
      case 'low':
        this.vibrate('light');
        break;
    }
  }

  vibrateSuccess(): void {
    this.vibrate('success');
  }

  vibrateWarning(): void {
    this.vibrate('warning');
  }

  vibrateError(): void {
    this.vibrate('error');
  }

  cancel(): void {
    if (this.destroyed) return;
    try {
      Vibration.cancel();
    } catch (error) {
      logger.error('HapticCoordinator: Failed to cancel vibration', error);
    }
  }

  getPendingCount(): number {
    return this.pendingHaptics.length;
  }

  clearPending(): void {
    this.pendingHaptics = [];
  }

  isSupported(): boolean {
    return Platform.OS === 'android' || Platform.OS === 'ios';
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    this.cancel();
    this.pendingHaptics = [];
    this.processingPending = false;

    logger.debug('HapticCoordinator: Destroyed');
  }
}

export const hapticCoordinator = new HapticCoordinator();
