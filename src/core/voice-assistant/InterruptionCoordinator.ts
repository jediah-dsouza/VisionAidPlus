import { logger } from '../debug';
import { eventBus } from '../events/EventBus';
import { VOICE_EVENTS } from './VoiceEventBus';
import { SpeechQueueManager } from './SpeechQueueManager';
import type { SpeechMessage, SpeechQueueItem, VoiceAssistantConfig } from './types';
import { DEFAULT_VOICE_CONFIG, PRIORITY_WEIGHTS } from './types';

export class InterruptionCoordinator {
  private config: VoiceAssistantConfig;
  private queue: SpeechQueueManager;
  private interruptedItems: SpeechQueueItem[] = [];
  private lastInterruptAt = 0;

  constructor(
    config: Partial<VoiceAssistantConfig> = {},
    queue: SpeechQueueManager,
  ) {
    this.config = { ...DEFAULT_VOICE_CONFIG, ...config };
    this.queue = queue;
  }

  shouldInterrupt(
    current: SpeechQueueItem | null,
    incoming: SpeechMessage,
  ): boolean {
    if (!current) return false;

    const currentWeight = PRIORITY_WEIGHTS[current.priority];
    const incomingWeight = PRIORITY_WEIGHTS[incoming.priority];

    if (incoming.priority === 'critical') return true;
    if (incoming.priority === 'high' && current.priority !== 'critical') return true;
    if (current.priority === 'background') return true;

    return incomingWeight < currentWeight;
  }

  handleInterruption(interrupted: SpeechQueueItem): void {
    const now = Date.now();

    this.queue.recordInterrupted();

    this.interruptedItems.push({
      ...interrupted,
      interrupted: true,
    });

    this.lastInterruptAt = now;

    if (this.interruptedItems.length > 10) {
      this.interruptedItems.shift();
    }

    logger.info(
      `[InterruptionCoordinator] Interrupted: ${interrupted.id} (${interrupted.priority})`,
    );

    eventBus.publish(VOICE_EVENTS.PRIORITY_ESCALATED, {
      interruptedId: interrupted.id,
      interruptedPriority: interrupted.priority,
    }, 'normal');
  }

  getInterruptedCount(): number {
    return this.interruptedItems.length;
  }

  clearInterrupted(): void {
    this.interruptedItems = [];
  }

  getInterruptedItems(): ReadonlyArray<SpeechQueueItem> {
    return this.interruptedItems;
  }
}
