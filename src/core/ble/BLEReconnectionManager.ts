import { AppState, AppStateStatus } from 'react-native';
import { eventBus, EVENTS } from '@core/events/EventBus';
import { logger } from '@core/debug';
import { BLE_RECONNECT_BACKOFFS, BLE_LIMITS } from './constants';

export type ReconnectHandler = () => Promise<boolean>;

export interface ReconnectionState {
  isActive: boolean;
  deviceId: string | null;
  attempt: number;
  maxAttempts: number;
  nextBackoff: number;
  startedAt: number | null;
  lastAttemptAt: number | null;
  paused: boolean;
}

export class BLEReconnectionManager {
  private state: ReconnectionState = {
    isActive: false,
    deviceId: null,
    attempt: 0,
    maxAttempts: BLE_LIMITS.MAX_RECONNECT_ATTEMPTS,
    nextBackoff: BLE_RECONNECT_BACKOFFS[0],
    startedAt: null,
    lastAttemptAt: null,
    paused: false,
  };

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectHandler: ReconnectHandler | null = null;
  private appStateSubscription: (() => void) | null = null;
  private destroyed = false;

  get isReconnecting(): boolean {
    return this.state.isActive;
  }

  get currentAttempt(): number {
    return this.state.attempt;
  }

  get stateSnapshot(): Readonly<ReconnectionState> {
    return { ...this.state };
  }

  start(deviceId: string, handler: ReconnectHandler): void {
    if (this.destroyed) return;
    if (this.state.isActive) {
      logger.debug('[BLEReconnection] Already reconnecting, resetting');
      this.stop();
    }

    this.state = {
      isActive: true,
      deviceId,
      attempt: 0,
      maxAttempts: BLE_LIMITS.MAX_RECONNECT_ATTEMPTS,
      nextBackoff: BLE_RECONNECT_BACKOFFS[0],
      startedAt: Date.now(),
      lastAttemptAt: null,
      paused: false,
    };

    this.reconnectHandler = handler;

    logger.info('[BLEReconnection] Started reconnection', { deviceId });

    this.setupAppStateListener();
    this.scheduleNext();
  }

  stop(): void {
    if (!this.state.isActive && !this.reconnectTimer) return;

    this.state.isActive = false;
    this.reconnectHandler = null;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.teardownAppStateListener();
    logger.debug('[BLEReconnection] Stopped');
  }

  pause(): void {
    if (!this.state.isActive) return;
    this.state.paused = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    logger.debug('[BLEReconnection] Paused (app in background)');
  }

  resume(): void {
    if (!this.state.isActive || !this.state.paused) return;
    this.state.paused = false;

    logger.debug('[BLEReconnection] Resumed (app in foreground)');
    this.scheduleNext();
  }

  reset(deviceId?: string): void {
    this.destroyed = false;
    this.stop();
    this.state = {
      isActive: false,
      deviceId: deviceId ?? null,
      attempt: 0,
      maxAttempts: BLE_LIMITS.MAX_RECONNECT_ATTEMPTS,
      nextBackoff: BLE_RECONNECT_BACKOFFS[0],
      startedAt: null,
      lastAttemptAt: null,
      paused: false,
    };
  }

  private setupAppStateListener(): void {
    try {
      const handleAppState = (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          this.resume();
        } else if (nextState === 'background') {
          this.pause();
        }
      };

      const subscription = AppState.addEventListener('change', handleAppState);
      this.appStateSubscription = () => subscription.remove();
    } catch {
      logger.warn('[BLEReconnection] Failed to setup AppState listener');
    }
  }

  private teardownAppStateListener(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription();
      this.appStateSubscription = null;
    }
  }

  private scheduleNext(): void {
    if (this.destroyed) return;
    if (!this.state.isActive || this.state.paused) return;
    if (this.state.attempt >= this.state.maxAttempts) {
      this.onReconnectFailed();
      return;
    }

    const backoff = this.getCurrentBackoff();
    this.state.nextBackoff = backoff;

    logger.debug(
      `[BLEReconnection] Scheduling attempt ${this.state.attempt + 1}/${this.state.maxAttempts} in ${backoff}ms`,
    );

    this.reconnectTimer = setTimeout(() => this.executeAttempt(), backoff);
  }

  private async executeAttempt(): Promise<void> {
    if (this.destroyed || !this.state.isActive || !this.reconnectHandler) return;

    this.state.attempt++;
    this.state.lastAttemptAt = Date.now();

    logger.info(
      `[BLEReconnection] Attempt ${this.state.attempt}/${this.state.maxAttempts}`,
    );

    this.emitReconnecting(this.state.deviceId!, this.state.attempt, this.state.maxAttempts);

    try {
      const success = await this.reconnectHandler();

      if (success) {
        logger.info('[BLEReconnection] Reconnection successful');
        this.stop();
        return;
      }
    } catch (error) {
      logger.error('[BLEReconnection] Reconnection attempt error:', error);
    }

    if (this.state.attempt < this.state.maxAttempts) {
      this.scheduleNext();
    } else {
      this.onReconnectFailed();
    }
  }

  private onReconnectFailed(): void {
    logger.warn('[BLEReconnection] All reconnection attempts exhausted');
    this.state.isActive = false;

    eventBus.publish(EVENTS.BLE_ERROR, {
      deviceId: this.state.deviceId!,
      error: 'Reconnection failed after all attempts',
    }, 'high');
  }

  private getCurrentBackoff(): number {
    const index = Math.min(this.state.attempt, BLE_RECONNECT_BACKOFFS.length - 1);
    return BLE_RECONNECT_BACKOFFS[index];
  }

  private emitReconnecting(deviceId: string, attempt: number, maxAttempts: number): void {
    eventBus.publish(EVENTS.BLE_DEVICE_RECONNECTING, { deviceId, attempt, maxAttempts }, 'high');
  }

  destroy(): void {
    this.destroyed = true;
    this.stop();
    this.reconnectHandler = null;
  }
}

export const bleReconnectionManager = new BLEReconnectionManager();
