import { logger } from '../debug';
import { eventBus } from '../events/EventBus';
import { VOICE_EVENTS } from './VoiceEventBus';
import { SpeechQueueManager } from './SpeechQueueManager';
import { SpeechDeduplicationEngine } from './SpeechDeduplicationEngine';
import { InterruptionCoordinator } from './InterruptionCoordinator';
import { AccessibilityPacingController } from './AccessibilityPacingController';
import type {
  SpeechMessage,
  SpeechQueueItem,
  VoiceLifecycleState,
  VoiceAssistantConfig,
  VoiceMetrics,
} from './types';
import { DEFAULT_VOICE_CONFIG } from './types';

export class SpeechLifecycleManager {
  private state: VoiceLifecycleState = 'idle';
  private config: VoiceAssistantConfig;
  private current: SpeechQueueItem | null = null;
  private queue: SpeechQueueManager;
  private dedup: SpeechDeduplicationEngine;
  private interruption: InterruptionCoordinator;
  private pacing: AccessibilityPacingController;
  private destroyed = false;
  private speakingTimer: ReturnType<typeof setTimeout> | null = null;
  private processing = false;
  private currentResolve: ((value: boolean) => void) | null = null;

  constructor(
    config: Partial<VoiceAssistantConfig> = {},
    queue?: SpeechQueueManager,
    dedup?: SpeechDeduplicationEngine,
    interruption?: InterruptionCoordinator,
    pacing?: AccessibilityPacingController,
  ) {
    this.config = { ...DEFAULT_VOICE_CONFIG, ...config };
    this.queue = queue ?? new SpeechQueueManager(this.config);
    this.dedup = dedup ?? new SpeechDeduplicationEngine(this.config);
    this.interruption = interruption ?? new InterruptionCoordinator(this.config, this.queue);
    this.pacing = pacing ?? new AccessibilityPacingController(this.config);
  }

  getState(): VoiceLifecycleState {
    return this.state;
  }

  getCurrent(): SpeechQueueItem | null {
    return this.current;
  }

  getQueueManager(): SpeechQueueManager {
    return this.queue;
  }

  getDedupEngine(): SpeechDeduplicationEngine {
    return this.dedup;
  }

  getInterruptionCoordinator(): InterruptionCoordinator {
    return this.interruption;
  }

  getPacingController(): AccessibilityPacingController {
    return this.pacing;
  }

  speak(message: SpeechMessage): boolean {
    if (this.destroyed) return false;

    if (this.dedup.isDuplicate(message)) {
      this.queue.recordDuplicateSuppressed();
      eventBus.publish(VOICE_EVENTS.DUPLICATE_SUPPRESSED, { messageId: message.id }, 'low');
      return false;
    }

    this.dedup.record(message);

    if (this.interruption.shouldInterrupt(this.current, message)) {
      this.interrupt(message);
      return true;
    }

    const queued = this.queue.enqueue(message);
    if (queued) {
      this.scheduleProcessing();
      return true;
    }
    return false;
  }

  private interrupt(incoming: SpeechMessage): void {
    const previous = this.current;

    if (previous) {
      this.queue.recordInterrupted();
      eventBus.publish(VOICE_EVENTS.SPEECH_INTERRUPTED, {
        interruptedId: previous.id,
        incomingId: incoming.id,
        incomingPriority: incoming.priority,
      }, 'high');

      this.interruption.handleInterruption(previous);
    }

    this.state = 'interrupted';
    this.clearSpeakingTimer();

    const queued = this.queue.enqueue(incoming);
    if (queued) {
      this.scheduleProcessing();
    }
  }

  private scheduleProcessing(): void {
    if (this.processing || this.destroyed) return;
    if (this.state === 'speaking' || this.state === 'paused') return;

    this.processing = true;
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.destroyed) { this.processing = false; return; }

    const gap = this.pacing.getNextInterval();

    await this.delay(gap);

    if (this.destroyed) { this.processing = false; return; }

    const next = this.queue.dequeue();
    if (!next) {
      this.state = 'idle';
      this.processing = false;
      eventBus.publish(VOICE_EVENTS.QUEUE_DRAINED, { dropped: 0 }, 'low');
      return;
    }

    this.current = next;
    this.state = 'speaking';
    this.queue.recordSpoken();

    eventBus.publish(VOICE_EVENTS.SPEECH_STARTED, { item: next }, 'high');

    try {
      const success = await this.deliverSpeech(next);

      if (this.destroyed) { this.processing = false; return; }

      if (success) {
        next.spoken = true;
        this.state = 'idle';
        this.current = null;
        eventBus.publish(VOICE_EVENTS.SPEECH_COMPLETED, { item: next }, 'normal');

        this.queue.pruneStale();

        if (!this.queue.isEmpty()) {
          this.scheduleProcessing();
        } else {
          this.processing = false;
        }
      } else {
        this.handleFailure(next);
      }
    } catch (err) {
      logger.error('[VoiceLifecycle] Speech error:', err);
      this.handleFailure(next);
    }
  }

  private deliverSpeech(item: SpeechQueueItem): Promise<boolean> {
    return new Promise(resolve => {
      this.currentResolve = resolve;
      this.speakingTimer = setTimeout(() => {
        resolve(true);
        this.speakingTimer = null;
        this.currentResolve = null;
      }, this.config.minGapBetweenMessages);
    });
  }

  private handleFailure(item: SpeechQueueItem): void {
    if (item.retryCount < this.config.maxRetries) {
      item.retryCount++;
      logger.warn(`[VoiceLifecycle] Retry ${item.retryCount}/${this.config.maxRetries} for ${item.id}`);
      setTimeout(() => {
        this.queue.enqueue({ ...item, retryCount: item.retryCount });
      }, this.config.retryDelayMs);
    } else {
      this.queue.recordFailed();
      eventBus.publish(VOICE_EVENTS.SPEECH_FAILED, { item }, 'high');
      logger.error(`[VoiceLifecycle] Speech failed after ${this.config.maxRetries} retries: ${item.id}`);
    }

    this.state = 'idle';
    this.current = null;
    this.processing = false;

    if (!this.queue.isEmpty()) {
      this.scheduleProcessing();
    }
  }

  pause(): void {
    if (this.state !== 'speaking') return;
    this.state = 'paused';
    this.clearSpeakingTimer();
    eventBus.publish(VOICE_EVENTS.SPEECH_PAUSED, { currentId: this.current?.id }, 'normal');
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.state = 'idle';
    eventBus.publish(VOICE_EVENTS.SPEECH_RESUMED, {}, 'normal');
    this.scheduleProcessing();
  }

  cancelCurrent(): void {
    if (this.current) {
      this.current.interrupted = true;
      const cancelled = this.current;
      this.current = null;
      this.state = 'idle';
      this.processing = false;
      this.clearSpeakingTimer();
      eventBus.publish(VOICE_EVENTS.SPEECH_CANCELLED, { item: cancelled }, 'normal');
    }
  }

  cancelAll(): void {
    this.cancelCurrent();
    this.queue.clear();
    this.state = 'idle';
    this.processing = false;
  }

  getMetrics(): VoiceMetrics {
    return this.queue.getMetrics();
  }

  private clearSpeakingTimer(): void {
    if (this.speakingTimer) {
      clearTimeout(this.speakingTimer);
      this.speakingTimer = null;
    }
    if (this.currentResolve) {
      this.currentResolve(false);
      this.currentResolve = null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }

  updateConfig(config: Partial<VoiceAssistantConfig>): void {
    this.config = { ...this.config, ...config };
    this.dedup.updateConfig(this.config);
    this.pacing.updateConfig(this.config);
  }

  destroy(): void {
    this.destroyed = true;
    this.cancelAll();
    this.queue.destroy();
    logger.info('[VoiceLifecycle] Destroyed');
  }
}
