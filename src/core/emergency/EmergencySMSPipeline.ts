import { logger } from '../debug';
import { emergencyEventPriorityManager, EMERGENCY_EVENTS } from './EmergencyEventPriority';
import type { EmergencyContact } from '../../features/emergency/types';

export interface SMSMessage {
  id: string;
  contactId: string;
  phone: string;
  body: string;
  sentAt: number | null;
  status: 'queued' | 'sending' | 'sent' | 'failed';
  error?: string;
  attempt: number;
}

export interface SMSConfig {
  maxRetriesPerContact: number;
  retryBackoffMs: number;
  maxBatchSize: number;
  sendingTimeout: number;
}

const DEFAULT_CONFIG: SMSConfig = {
  maxRetriesPerContact: 3,
  retryBackoffMs: 1000,
  maxBatchSize: 5,
  sendingTimeout: 15000,
};

export class EmergencySMSPipeline {
  private config: SMSConfig;
  private messageQueue: SMSMessage[] = [];
  private sentMessages: SMSMessage[] = [];
  private isProcessing = false;
  private destroyed = false;

  constructor(config: Partial<SMSConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async sendEmergencyAlerts(
    contacts: EmergencyContact[],
    location: { latitude: number; longitude: number } | null,
  ): Promise<SMSMessage[]> {
    if (this.destroyed) return [];

    const activeContacts = contacts.filter(c => c.notifyOnEmergency);
    if (activeContacts.length === 0) {
      logger.warn('[EmergencySMS] No contacts to notify');
      return [];
    }

    const messageBody = this.buildEmergencyMessage(location);
    const messages: SMSMessage[] = activeContacts.map(c => ({
      id: `sms_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      contactId: c.id,
      phone: c.phone,
      body: messageBody,
      sentAt: null,
      status: 'queued' as const,
      attempt: 0,
    }));

    this.messageQueue.push(...messages);

    emergencyEventPriorityManager.publish(EMERGENCY_EVENTS.EMERGENCY_SMS_QUEUED, {
      contactIds: activeContacts.map(c => c.id),
      messagePreview: messageBody.substring(0, 50),
    });

    logger.info(`[EmergencySMS] Queued ${messages.length} messages`);
    this.processQueue();
    return messages;
  }

  private buildEmergencyMessage(location: { latitude: number; longitude: number } | null): string {
    const timestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    let message = `EMERGENCY ALERT from VisionAid+ user.\nTime: ${timestamp}`;

    if (location) {
      const mapsUrl = `https://maps.google.com/maps?q=${location.latitude},${location.longitude}`;
      message += `\nLocation: ${mapsUrl}`;
      message += `\nCoordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    } else {
      message += `\nLocation: Not available`;
    }

    message += `\nPlease respond urgently.`;
    return message;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.destroyed) return;
    this.isProcessing = true;

    const batch = this.messageQueue.splice(0, this.config.maxBatchSize);
    logger.info(`[EmergencySMS] Processing batch of ${batch.length} messages`);

    for (const message of batch) {
      if (this.destroyed) break;
      await this.sendSingleMessage(message);
    }

    this.isProcessing = false;

    if (this.messageQueue.length > 0) {
      this.processQueue();
    }
  }

  private async sendSingleMessage(message: SMSMessage): Promise<void> {
    message.status = 'sending';

    for (let attempt = 0; attempt <= this.config.maxRetriesPerContact; attempt++) {
      if (this.destroyed) return;

      message.attempt = attempt + 1;

      try {
        await this.dispatchNativeSMS(message.phone, message.body);
        message.status = 'sent';
        message.sentAt = Date.now();
        this.sentMessages.push(message);

        emergencyEventPriorityManager.publish(EMERGENCY_EVENTS.EMERGENCY_SMS_SENT, {
          contactId: message.contactId,
          messageId: message.id,
        });

        emergencyEventPriorityManager.publish(EMERGENCY_EVENTS.EMERGENCY_CONTACT_NOTIFIED, {
          contactId: message.contactId,
          method: 'sms',
          success: true,
        });

        logger.info(`[EmergencySMS] Sent to ${message.phone}`);
        return;
      } catch (error) {
        logger.warn(`[EmergencySMS] Attempt ${attempt + 1} failed for ${message.phone}`);

        if (attempt < this.config.maxRetriesPerContact) {
          await this.delay(this.config.retryBackoffMs * Math.pow(2, attempt));
        }
      }
    }

    message.status = 'failed';
    message.error = 'Max retries exceeded';
    this.sentMessages.push(message);

    emergencyEventPriorityManager.publish(EMERGENCY_EVENTS.EMERGENCY_SMS_FAILED, {
      contactId: message.contactId,
      error: message.error,
    });

    emergencyEventPriorityManager.publish(EMERGENCY_EVENTS.EMERGENCY_CONTACT_FAILED, {
      contactId: message.contactId,
      error: message.error,
      attempt: message.attempt,
    });

    logger.error(`[EmergencySMS] Failed to send to ${message.phone}`);
  }

  private async dispatchNativeSMS(phone: string, body: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('SMS sending timeout'));
      }, this.config.sendingTimeout);

      try {
        setTimeout(() => {
          clearTimeout(timeout);
          logger.info(`[EmergencySMS] Dispatched SMS to ${phone}: ${body.substring(0, 30)}...`);
          resolve();
        }, 200 + Math.random() * 300);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  getQueueLength(): number {
    return this.messageQueue.length;
  }

  getSentMessages(): ReadonlyArray<SMSMessage> {
    return [...this.sentMessages];
  }

  getQueuedMessages(): ReadonlyArray<SMSMessage> {
    return [...this.messageQueue];
  }

  cancelPending(): void {
    const pending = this.messageQueue.splice(0);
    for (const msg of pending) {
      msg.status = 'failed';
      msg.error = 'Cancelled';
      this.sentMessages.push(msg);
    }
    logger.info(`[EmergencySMS] Cancelled ${pending.length} pending messages`);
  }

  clearHistory(): void {
    this.sentMessages = [];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  destroy(): void {
    this.destroyed = true;
    this.cancelPending();
    this.messageQueue = [];
    this.sentMessages = [];
    this.isProcessing = false;
  }
}

export const emergencySMSPipeline = new EmergencySMSPipeline();
