import { logger } from '../debug';
import { eventBus } from '../events/EventBus';
import { VOICE_EVENTS } from './VoiceEventBus';
import type { VoiceCommand, VoiceAssistantConfig } from './types';
import { DEFAULT_VOICE_CONFIG } from './types';

export class CommandHistoryRegistry {
  private commands: VoiceCommand[] = [];
  private config: VoiceAssistantConfig;
  private destroyed = false;

  constructor(config: Partial<VoiceAssistantConfig> = {}) {
    this.config = { ...DEFAULT_VOICE_CONFIG, ...config };
  }

  record(command: VoiceCommand): void {
    if (this.destroyed) return;

    this.commands.push(command);

    if (this.commands.length > this.config.commandHistoryMax) {
      this.commands.splice(0, this.commands.length - this.config.commandHistoryMax);
    }

    eventBus.publish(VOICE_EVENTS.COMMAND_RECEIVED, { command }, 'high');
  }

  markExecuted(
    id: string,
    result: 'success' | 'failed',
    durationMs?: number,
  ): void {
    const cmd = this.commands.find(c => c.id === id);
    if (!cmd) return;

    cmd.processed = true;
    cmd.result = result;
    cmd.durationMs = durationMs;

    eventBus.publish(VOICE_EVENTS.COMMAND_EXECUTED, { command: cmd }, 'normal');
  }

  getHistory(limit?: number): VoiceCommand[] {
    const items = [...this.commands].reverse();
    return limit ? items.slice(0, limit) : items;
  }

  getRecent(seconds: number = 60): VoiceCommand[] {
    const cutoff = Date.now() - seconds * 1000;
    return this.commands.filter(c => c.timestamp >= cutoff);
  }

  getLastCommand(): VoiceCommand | null {
    return this.commands.length > 0
      ? this.commands[this.commands.length - 1]
      : null;
  }

  getCount(): number {
    return this.commands.length;
  }

  clear(): void {
    this.commands = [];
    logger.info('[CommandHistory] Cleared');
  }

  destroy(): void {
    this.destroyed = true;
    this.clear();
  }
}
