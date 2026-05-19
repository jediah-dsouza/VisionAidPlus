import { EventPriority } from '../events/EventBus';
import { logger } from '../debug';

export type VoiceMessage = {
  id: string;
  message: string;
  priority: EventPriority;
  timestamp: number;
  source?: string;
  metadata?: Record<string, unknown>;
};

const PRIORITY_WEIGHTS: Record<EventPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export class VoiceQueue {
  private queue: VoiceMessage[] = [];
  private processing = false;
  private currentMessageId: string | null = null;
  private maxQueueSize = 50;
  private droppedMessages: VoiceMessage[] = [];

  add(message: Omit<VoiceMessage, 'id' | 'timestamp'>): string {
    const id = `voice_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const voiceMessage: VoiceMessage = {
      ...message,
      id,
      timestamp: Date.now(),
    };

    if (message.priority === 'critical') {
      this.queue.unshift(voiceMessage);
      logger.debug(`VoiceQueue: Critical message added to front: ${id}`);
    } else if (message.priority === 'high') {
      const firstNormalOrLow = this.queue.findIndex(
        m => m.priority === 'normal' || m.priority === 'low',
      );
      if (firstNormalOrLow === -1) {
        this.queue.push(voiceMessage);
      } else {
        this.queue.splice(firstNormalOrLow, 0, voiceMessage);
      }
      logger.debug(`VoiceQueue: High priority message added: ${id}`);
    } else {
      this.queue.push(voiceMessage);
      logger.debug(`VoiceQueue: Normal/Low priority message queued: ${id}`);
    }

    if (this.queue.length > this.maxQueueSize) {
      const dropped = this.queue.shift();
      if (dropped) {
        this.droppedMessages.push(dropped);
        logger.debug(`VoiceQueue: Queue overflow, dropped: ${dropped.id}`);
      }
    }

    return id;
  }

  peek(): VoiceMessage | null {
    return this.queue[0] || null;
  }

  pop(): VoiceMessage | null {
    const message = this.queue.shift();
    if (message) {
      this.currentMessageId = message.id;
    }
    return message || null;
  }

  remove(id: string): boolean {
    const index = this.queue.findIndex(m => m.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      logger.debug(`VoiceQueue: Removed message: ${id}`);
      return true;
    }
    return false;
  }

  clear(): void {
    this.queue = [];
    this.currentMessageId = null;
    logger.debug(`VoiceQueue: Cleared all messages`);
  }

  interrupt(): VoiceMessage | null {
    const critical = this.queue.find(m => m.priority === 'critical');
    if (critical) {
      const index = this.queue.indexOf(critical);
      this.queue.splice(index, 1);
      this.currentMessageId = critical.id;
      return critical;
    }

    const high = this.queue.find(m => m.priority === 'high');
    if (high) {
      const index = this.queue.indexOf(high);
      this.queue.splice(index, 1);
      this.currentMessageId = high.id;
      return high;
    }

    return null;
  }

  getCurrentMessageId(): string | null {
    return this.currentMessageId;
  }

  completeCurrent(): void {
    this.currentMessageId = null;
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getQueuedMessages(): ReadonlyArray<VoiceMessage> {
    return [...this.queue];
  }

  sortByPriority(): void {
    this.queue.sort((a, b) => PRIORITY_WEIGHTS[a.priority] - PRIORITY_WEIGHTS[b.priority]);
  }

  getDroppedMessages(): ReadonlyArray<VoiceMessage> {
    return [...this.droppedMessages];
  }

  clearDropped(): void {
    this.droppedMessages = [];
  }
}

export const voiceQueue = new VoiceQueue();
