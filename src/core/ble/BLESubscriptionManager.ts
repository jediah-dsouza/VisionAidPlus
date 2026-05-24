import env from '../../env';
import { logger } from '@core/debug';
import type { BLEPacketType } from './types';
import type { BLESubscriptionInfo } from './types';
import { BLE_CHARACTERISTIC_UUIDS, BLE_LIMITS } from './constants';
import { blePacketParser } from './BLEPacketParser';

export interface CharacteristicSubscription {
  serviceUUID: string;
  characteristicUUID: string;
  packetType: BLEPacketType;
  onPacket: (packet: ReturnType<typeof blePacketParser.parse>) => void;
  onError: (error: Error) => void;
}

type NotificationHandler = (data: string) => void;

export class BLESubscriptionManager {
  private subscriptions: Map<string, CharacteristicSubscription> = new Map();
  private activeMonitors: Map<string, { handler: NotificationHandler; unsubscribe: () => void }> = new Map();
  private notificationTimestamps: number[] = [];
  private destroyed = false;

  get activeSubscriptions(): BLESubscriptionInfo[] {
    return Array.from(this.subscriptions.values()).map(sub => ({
      characteristicUUID: sub.characteristicUUID,
      serviceUUID: sub.serviceUUID,
      packetType: sub.packetType,
      isNotifying: this.activeMonitors.has(sub.characteristicUUID),
      subscribedAt: 0,
      lastNotificationAt: null,
      notificationCount: 0,
    }));
  }

  get subscriptionCount(): number {
    return this.subscriptions.size;
  }

  register(subscription: CharacteristicSubscription): () => void {
    if (this.destroyed) return () => {};

    const key = `${subscription.serviceUUID}:${subscription.characteristicUUID}`;

    if (this.subscriptions.has(key)) {
      logger.debug(`[BLESubscriptionManager] Re-registering subscription for ${key}`);
      this.subscriptions.delete(key);
    }

    this.subscriptions.set(key, subscription);
    logger.debug(
      `[BLESubscriptionManager] Registered subscription: ${subscription.packetType} @ ${key}`,
    );

    return () => {
      this.subscriptions.delete(key);
      logger.debug(
        `[BLESubscriptionManager] Unregistered subscription: ${subscription.packetType} @ ${key}`,
      );
    };
  }

  async startMonitoring(
    serviceUUID: string,
    characteristicUUID: string,
    onData: (parsed: ReturnType<typeof blePacketParser.parse>) => void,
    onError?: (error: Error) => void,
  ): Promise<boolean> {
    if (this.destroyed) return false;

    const key = `${serviceUUID}:${characteristicUUID}`;

    if (this.activeMonitors.has(key)) {
      logger.debug(`[BLESubscriptionManager] Already monitoring ${key}`);
      return true;
    }

    const handler: NotificationHandler = (data: string) => {
      if (!this.canAcceptNotification()) {
        logger.warn('[BLESubscriptionManager] Notification rate limit exceeded, dropping');
        return;
      }

      this.recordNotification();

      const rawString = blePacketParser.parseRaw(serviceUUID, characteristicUUID, data);
      const parsed = blePacketParser.parse(characteristicUUID, rawString);
      onData(parsed);
    };

    if (this.isRealtimeCharacteristic(characteristicUUID)) {
      try {
        if (env.MOCK_BLE_DEVICE) {
          logger.debug(`[BLESubscriptionManager] Mock monitoring ${key} (simulated)`);
        }

        this.activeMonitors.set(key, {
          handler,
          unsubscribe: () => {
            this.activeMonitors.delete(key);
          },
        });

        logger.info(`[BLESubscriptionManager] Started monitoring ${key}`);
        return true;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error(`[BLESubscriptionManager] Failed to start monitoring ${key}:`, err);
        onError?.(err);
        return false;
      }
    }

    logger.warn(`[BLESubscriptionManager] No handler for characteristic ${characteristicUUID}`);
    return false;
  }

  stopMonitoring(serviceUUID: string, characteristicUUID: string): void {
    const key = `${serviceUUID}:${characteristicUUID}`;
    const monitor = this.activeMonitors.get(key);

    if (monitor) {
      monitor.unsubscribe();
      logger.debug(`[BLESubscriptionManager] Stopped monitoring ${key}`);
    }
  }

  stopAllMonitoring(): void {
    this.activeMonitors.forEach((monitor, key) => {
      monitor.unsubscribe();
      logger.debug(`[BLESubscriptionManager] Stopped monitoring ${key}`);
    });
    this.activeMonitors.clear();
  }

  simulateNotification(characteristicUUID: string, data: string): void {
    const key = Object.entries(BLE_CHARACTERISTIC_UUIDS).find(
      ([, uuid]) => uuid === characteristicUUID,
    )?.[0];

    if (!key) {
      logger.warn(`[BLESubscriptionManager] No subscription for ${characteristicUUID}`);
      return;
    }

    const rawString = blePacketParser.parseRaw(
      '0000FFE0-0000-1000-8000-00805F9B34FB',
      characteristicUUID,
      data,
    );
    const parsed = blePacketParser.parse(characteristicUUID, rawString);

    this.activeMonitors.forEach(monitor => {
      monitor.handler(data);
    });
  }

  private isRealtimeCharacteristic(characteristicUUID: string): boolean {
    return Object.values(BLE_CHARACTERISTIC_UUIDS).includes(
      characteristicUUID as typeof BLE_CHARACTERISTIC_UUIDS[keyof typeof BLE_CHARACTERISTIC_UUIDS],
    );
  }

  private canAcceptNotification(): boolean {
    const now = Date.now();
    this.notificationTimestamps = this.notificationTimestamps.filter(
      ts => now - ts < 1000,
    );

    return (
      this.notificationTimestamps.length < BLE_LIMITS.MAX_SUBSCRIPTION_NOTIFICATIONS_PER_SEC
    );
  }

  private recordNotification(): void {
    this.notificationTimestamps.push(Date.now());
  }

  destroy(): void {
    this.destroyed = true;
    this.stopAllMonitoring();
    this.subscriptions.clear();
    this.notificationTimestamps = [];
  }
}

export const bleSubscriptionManager = new BLESubscriptionManager();
