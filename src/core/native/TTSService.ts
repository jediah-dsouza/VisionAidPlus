import { eventBus, EVENTS, EventPriority } from '../events/EventBus';
import { logger } from '../debug';
import env from '../../env';

export interface TTSConfig {
  language: string;
  speechRate: number;
  pitch: number;
  volume: number;
}

export interface TTSQueueItem {
  id: string;
  text: string;
  priority: EventPriority;
  timestamp: number;
}

abstract class TTSServiceBase {
  abstract speak(text: string, priority?: EventPriority): Promise<void>;
  abstract stop(): Promise<void>;
  abstract pause(): Promise<void>;
  abstract resume(): Promise<void>;
  abstract setLanguage(language: string): Promise<void>;
  abstract setSpeechRate(rate: number): Promise<void>;
  abstract isSpeaking(): boolean;
  abstract addToQueue(text: string, priority?: EventPriority): void;
  abstract clearQueue(): void;
}

class MockTTSService extends TTSServiceBase {
  private speaking = false;
  private queue: TTSQueueItem[] = [];
  private currentId = 0;

  async speak(text: string, priority: EventPriority = 'normal'): Promise<void> {
    if (this.speaking) {
      this.addToQueue(text, priority);
      return;
    }

    this.speaking = true;
    eventBus.publish(EVENTS.TTS_PLAYBACK_STARTED, { text }, 'normal');
    logger.info(`TTS: Speaking (mock) - "${text}"`);

    await new Promise(resolve => setTimeout(resolve, 2000));

    this.speaking = false;
    eventBus.publish(EVENTS.TTS_PLAYBACK_COMPLETED, { text }, 'normal');

    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) {
        await this.speak(next.text, next.priority);
      }
    }
  }

  async stop(): Promise<void> {
    this.queue = [];
    this.speaking = false;
    logger.info('TTS: Stopped (mock)');
  }

  async pause(): Promise<void> {
    logger.info('TTS: Paused (mock)');
  }

  async resume(): Promise<void> {
    logger.info('TTS: Resumed (mock)');
  }

  async setLanguage(_language: string): Promise<void> {
    logger.info('TTS: Language set (mock)');
  }

  async setSpeechRate(_rate: number): Promise<void> {
    logger.info('TTS: Speech rate set (mock)');
  }

  isSpeaking(): boolean {
    return this.speaking;
  }

  addToQueue(text: string, priority: EventPriority = 'normal'): void {
    const item: TTSQueueItem = {
      id: `${this.currentId++}`,
      text,
      priority,
      timestamp: Date.now(),
    };

    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    const insertIndex = this.queue.findIndex(
      i => priorityOrder[i.priority] > priorityOrder[priority],
    );

    if (insertIndex === -1) {
      this.queue.push(item);
    } else {
      this.queue.splice(insertIndex, 0, item);
    }
  }

  clearQueue(): void {
    this.queue = [];
  }
}

class RealTTSService extends TTSServiceBase {
  async speak(_text: string, _priority?: EventPriority): Promise<void> {
    logger.info('TTS: Real implementation - speak');
  }
  async stop(): Promise<void> {
    logger.info('TTS: Real implementation - stop');
  }
  async pause(): Promise<void> {
    logger.info('TTS: Real implementation - pause');
  }
  async resume(): Promise<void> {
    logger.info('TTS: Real implementation - resume');
  }
  async setLanguage(_language: string): Promise<void> {
    logger.info('TTS: Real implementation - setLanguage');
  }
  async setSpeechRate(_rate: number): Promise<void> {
    logger.info('TTS: Real implementation - setSpeechRate');
  }
  isSpeaking(): boolean {
    return false;
  }
  addToQueue(_text: string, _priority?: EventPriority): void {}
  clearQueue(): void {}
}

const config: TTSConfig = {
  language: env.TTS_DEFAULT_LANGUAGE,
  speechRate: env.TTS_SPEECH_RATE,
  pitch: 1.0,
  volume: 1.0,
};

export const ttsService = new MockTTSService();
