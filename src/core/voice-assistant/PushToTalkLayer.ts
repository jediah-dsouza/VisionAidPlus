import { logger } from '../debug';
import { eventBus } from '../events/EventBus';
import { VOICE_EVENTS } from './VoiceEventBus';
import type { PushToTalkState, VoiceAssistantConfig } from './types';
import { DEFAULT_VOICE_CONFIG } from './types';

export class PushToTalkLayer {
  private config: VoiceAssistantConfig;
  private state: PushToTalkState = this.emptyState();
  private destroyed = false;
  private levelTimer: ReturnType<typeof setInterval> | null = null;
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: Partial<VoiceAssistantConfig> = {}) {
    this.config = { ...DEFAULT_VOICE_CONFIG, ...config };
  }

  private emptyState(): PushToTalkState {
    return {
      active: false,
      startedAt: null,
      durationMs: 0,
      buffer: null,
      level: 0,
    };
  }

  activate(): void {
    if (this.destroyed || this.state.active) return;

    this.state = {
      active: true,
      startedAt: Date.now(),
      durationMs: 0,
      buffer: null,
      level: 0,
    };

    this.startLevelSimulation();
    this.startTimeout();

    eventBus.publish(VOICE_EVENTS.PTT_ACTIVATED, { startedAt: this.state.startedAt }, 'high');
    logger.info('[PTT] Activated');
  }

  deactivate(): PushToTalkState {
    if (this.destroyed || !this.state.active) return this.state;

    this.state.durationMs = Date.now() - (this.state.startedAt ?? Date.now());
    this.stopTimers();

    const snapshot = { ...this.state };
    this.state = this.emptyState();

    eventBus.publish(VOICE_EVENTS.PTT_DEACTIVATED, {
      durationMs: snapshot.durationMs,
      level: snapshot.level,
    }, 'normal');

    logger.info(`[PTT] Deactivated (${snapshot.durationMs}ms)`);
    return snapshot;
  }

  getState(): PushToTalkState {
    return { ...this.state };
  }

  isActive(): boolean {
    return this.state.active;
  }

  getLevel(): number {
    return this.state.level;
  }

  private startLevelSimulation(): void {
    this.levelTimer = setInterval(() => {
      if (!this.state.active) return;
      const variation = Math.random() * 0.3;
      this.state.level = Math.min(1, Math.max(0, this.state.level + (Math.random() > 0.5 ? variation : -variation)));
      if (this.state.startedAt) {
        this.state.durationMs = Date.now() - this.state.startedAt;
      }
    }, 100);
  }

  private startTimeout(): void {
    this.timeoutTimer = setTimeout(() => {
      if (this.state.active) {
        logger.info('[PTT] Timeout reached');
        this.deactivate();
      }
    }, this.config.pttTimeoutMs);
  }

  private stopTimers(): void {
    if (this.levelTimer) {
      clearInterval(this.levelTimer);
      this.levelTimer = null;
    }
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.deactivate();
    this.stopTimers();
    logger.info('[PTT] Destroyed');
  }
}
