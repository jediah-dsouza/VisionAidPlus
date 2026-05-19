import { AccessibilityInfo } from 'react-native';
import { EventPriority } from '../events/EventBus';
import { voiceQueue, VoiceMessage } from './VoiceQueue';
import { logger } from '../debug';

export type SpeechState = 'idle' | 'speaking' | 'paused' | 'interrupted';

export interface SpeechControllerConfig {
  minGapBetweenMessages: number;
  maxRetries: number;
  retryDelay: number;
  allowInterruption: boolean;
}

const DEFAULT_CONFIG: SpeechControllerConfig = {
  minGapBetweenMessages: 300,
  maxRetries: 3,
  retryDelay: 500,
  allowInterruption: true,
};

export class SpeechController {
  private state: SpeechState = 'idle';
  private config: SpeechControllerConfig;
  private processingPromise: Promise<void> | null = null;
  private processingLoopId: ReturnType<typeof setTimeout> | null = null;
  private retryCount = 0;
  private pausedMessages: VoiceMessage[] = [];
  private onStateChange?: (state: SpeechState) => void;
  private destroyed = false;

  constructor(config: Partial<SpeechControllerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  setStateChangeListener(listener: (state: SpeechState) => void): void {
    this.onStateChange = listener;
  }

  private setState(newState: SpeechState): void {
    if (this.destroyed) return;
    if (this.state !== newState) {
      this.state = newState;
      logger.debug(`SpeechController: State changed to ${newState}`);
      this.onStateChange?.(newState);
    }
  }

  async speak(message: VoiceMessage): Promise<boolean> {
    if (this.destroyed) return false;

    if (this.state === 'interrupted' && message.priority !== 'critical') {
      this.pausedMessages.push(message);
      logger.debug(`SpeechController: Message paused: ${message.id}`);
      return false;
    }

    if (this.state === 'speaking' && !this.config.allowInterruption) {
      voiceQueue.add(message);
      return false;
    }

    if (this.state === 'speaking' && this.shouldInterrupt(message)) {
      await this.interrupt();
    }

    this.setState('speaking');
    this.retryCount = 0;

    return this.deliverMessage(message);
  }

  private shouldInterrupt(incoming: VoiceMessage): boolean {
    if (incoming.priority === 'critical') return true;
    if (incoming.priority === 'high') return this.state !== 'speaking';
    return false;
  }

  private async deliverMessage(message: VoiceMessage): Promise<boolean> {
    if (this.destroyed) return false;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      if (this.destroyed) return false;

      try {
        await AccessibilityInfo.announceForAccessibility(message.message);
        logger.debug(`SpeechController: Announced: "${message.message}"`);
        voiceQueue.completeCurrent();
        this.setState('idle');
        return true;
      } catch (error) {
        if (this.destroyed) return false;
        logger.error(`SpeechController: Announce failed (attempt ${attempt + 1})`, error);
        this.retryCount = attempt + 1;

        if (attempt < this.config.maxRetries) {
          await this.safeDelay(this.config.retryDelay);
        }
      }
    }

    logger.error(`SpeechController: Failed to announce after ${this.config.maxRetries} attempts`);
    return false;
  }

  async interrupt(): Promise<VoiceMessage | null> {
    if (this.destroyed) return null;

    const criticalMessage = voiceQueue.interrupt();
    if (criticalMessage) {
      logger.debug(`SpeechController: Interrupted for: ${criticalMessage.id}`);
      this.setState('interrupted');
      await this.safeDelay(100);
      await this.speak(criticalMessage);
      return criticalMessage;
    }
    return null;
  }

  async pause(): Promise<void> {
    if (this.destroyed) return;
    if (this.state === 'speaking') {
      this.setState('paused');
      logger.debug(`SpeechController: Paused`);
    }
  }

  async resume(): Promise<void> {
    if (this.destroyed) return;
    if (this.state === 'paused') {
      this.setState('idle');
      if (this.pausedMessages.length > 0) {
        const message = this.pausedMessages.shift();
        if (message) {
          await this.speak(message);
        }
      }
      logger.debug(`SpeechController: Resumed`);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.destroyed) return;

    while (true) {
      if (this.destroyed) break;

      const nextMessage = voiceQueue.peek();

      if (!nextMessage) {
        break;
      }

      const message = voiceQueue.pop();
      if (message) {
        const success = await this.speak(message);
        if (!success && this.destroyed) break;
      }

      await this.safeDelay(this.config.minGapBetweenMessages);
    }

    if (!this.destroyed) {
      this.setState('idle');
    }
  }

  startProcessing(): void {
    if (this.destroyed) return;
    if (this.processingPromise) return;

    this.processingPromise = this.processQueue()
      .catch(error => {
        logger.error('SpeechController: Queue processing error', error);
      })
      .finally(() => {
        this.processingPromise = null;
      });
  }

  stopProcessing(): void {
    if (this.processingLoopId) {
      clearTimeout(this.processingLoopId);
      this.processingLoopId = null;
    }
    this.processingPromise = null;
  }

  getState(): SpeechState {
    return this.state;
  }

  getPausedMessages(): ReadonlyArray<VoiceMessage> {
    return [...this.pausedMessages];
  }

  clearPaused(): void {
    this.pausedMessages = [];
  }

  private safeDelay(ms: number): Promise<void> {
    if (this.destroyed) return Promise.resolve();
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  updateConfig(config: Partial<SpeechControllerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): SpeechControllerConfig {
    return { ...this.config };
  }

  destroy(): void {
    logger.info('SpeechController: Destroying...');
    this.destroyed = true;

    this.stopProcessing();

    this.pausedMessages = [];
    this.state = 'idle';
    this.onStateChange = undefined;

    logger.info('SpeechController: Destroyed');
  }
}

export const speechController = new SpeechController();
