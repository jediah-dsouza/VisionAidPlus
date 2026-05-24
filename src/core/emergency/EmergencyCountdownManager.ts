import { logger } from '../debug';
import { emergencyStateMachine, EmergencyStatus } from './EmergencyStateMachine';

export interface CountdownConfig {
  defaultDuration: number;
  tickInterval: number;
  maxDuration: number;
  minDuration: number;
  autoConfirmOnExpiry: boolean;
}

export interface CountdownState {
  remaining: number;
  total: number;
  startedAt: number | null;
  isRunning: boolean;
  elapsed: number;
  paused: boolean;
  pausedRemaining: number | null;
}

export interface CountdownListener {
  id: string;
  onTick?: (remaining: number) => void;
  onExpired?: () => void;
  onCancelled?: () => void;
  onPaused?: (remaining: number) => void;
  onResumed?: (remaining: number) => void;
}

const DEFAULT_CONFIG: CountdownConfig = {
  defaultDuration: 5,
  tickInterval: 1000,
  maxDuration: 30,
  minDuration: 1,
  autoConfirmOnExpiry: true,
};

export class EmergencyCountdownManager {
  private config: CountdownConfig;
  private state: CountdownState = {
    remaining: 0,
    total: 0,
    startedAt: null,
    isRunning: false,
    elapsed: 0,
    paused: false,
    pausedRemaining: null,
  };
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: CountdownListener[] = [];
  private destroyed = false;

  constructor(config: Partial<CountdownConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupStateMachineListeners();
  }

  private setupStateMachineListeners(): void {
    emergencyStateMachine.addListener({
      onEnter: (status: EmergencyStatus) => {
        if (status === 'idle' || status === 'resolved' || status === 'cancelled') {
          this.stopTickTimer();
          this.state.isRunning = false;
          this.state.paused = false;
        }
      },
    });
  }

  start(duration?: number): boolean {
    if (this.destroyed) return false;

    const seconds = duration ?? this.config.defaultDuration;
    const clamped = Math.max(this.config.minDuration, Math.min(seconds, this.config.maxDuration));

    if (!emergencyStateMachine.canTransition('START_COUNTDOWN')) {
      logger.warn('[EmergencyCountdown] Cannot start countdown from current state');
      return false;
    }

    emergencyStateMachine.send('START_COUNTDOWN');

    this.state = {
      remaining: clamped,
      total: clamped,
      startedAt: Date.now(),
      isRunning: true,
      elapsed: 0,
      paused: false,
      pausedRemaining: null,
    };

    logger.info(`[EmergencyCountdown] Started: ${clamped}s`);

    this.startTickTimer();
    return true;
  }

  private startTickTimer(): void {
    this.stopTickTimer();

    this.tickTimer = setInterval(() => {
      if (this.destroyed) return;
      if (this.state.paused) return;

      const newRemaining = this.state.remaining - 1;

      if (newRemaining <= 0) {
        this.state.remaining = 0;
        this.state.elapsed = this.state.total;

        this.emitTick(0);

        if (this.config.autoConfirmOnExpiry) {
          this.expire();
        }
      } else {
        this.state.remaining = newRemaining;
        this.state.elapsed = this.state.total - newRemaining;
        this.emitTick(newRemaining);
      }
    }, this.config.tickInterval);
  }

  private expire(): void {
    if (this.destroyed) return;
    this.stopTickTimer();
    this.state.isRunning = false;

    const success = emergencyStateMachine.send('COUNTDOWN_EXPIRED');
    if (success) {
      logger.info('[EmergencyCountdown] Expired — emergency triggered');
      this.emitExpired();
    }
  }

  pause(): boolean {
    if (this.destroyed || !this.state.isRunning || this.state.paused) return false;

    this.state.paused = true;
    this.state.pausedRemaining = this.state.remaining;

    emergencyStateMachine.send('COUNTDOWN_TICK');

    logger.info(`[EmergencyCountdown] Paused at ${this.state.remaining}s`);
    this.emitPaused(this.state.remaining);
    return true;
  }

  resume(): boolean {
    if (this.destroyed || !this.state.isRunning || !this.state.paused) return false;

    this.state.paused = false;
    this.state.pausedRemaining = null;

    emergencyStateMachine.send('COUNTDOWN_TICK');

    logger.info(`[EmergencyCountdown] Resumed at ${this.state.remaining}s`);
    this.emitResumed(this.state.remaining);
    return true;
  }

  cancel(): boolean {
    if (this.destroyed) return false;

    const success = emergencyStateMachine.send('CANCEL_EMERGENCY');
    if (!success) return false;

    this.stopTickTimer();
    this.state.isRunning = false;
    this.state.paused = false;

    logger.info('[EmergencyCountdown] Cancelled');
    this.emitCancelled();
    return true;
  }

  confirm(): boolean {
    if (this.destroyed) return false;

    const success = emergencyStateMachine.send('CONFIRM_EMERGENCY');
    if (!success) return false;

    this.stopTickTimer();
    this.state.isRunning = false;

    logger.info('[EmergencyCountdown] Confirmed — emergency triggered early');
    return true;
  }

  setDuration(seconds: number): void {
    this.config.defaultDuration = Math.max(
      this.config.minDuration,
      Math.min(seconds, this.config.maxDuration),
    );
  }

  getState(): Readonly<CountdownState> {
    return { ...this.state };
  }

  get remaining(): number {
    return this.state.remaining;
  }

  get isRunning(): boolean {
    return this.state.isRunning;
  }

  get isPaused(): boolean {
    return this.state.paused;
  }

  addListener(listener: Omit<CountdownListener, 'id'>): () => void {
    const id = `cnt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const entry: CountdownListener = { ...listener, id };
    this.listeners.push(entry);

    return () => {
      this.listeners = this.listeners.filter(l => l.id !== id);
    };
  }

  removeAllListeners(): void {
    this.listeners = [];
  }

  private emitTick(remaining: number): void {
    for (const listener of this.listeners) {
      try { listener.onTick?.(remaining); } catch (e) { logger.error('[EmergencyCountdown] onTick error', e); }
    }
  }

  private emitExpired(): void {
    for (const listener of this.listeners) {
      try { listener.onExpired?.(); } catch (e) { logger.error('[EmergencyCountdown] onExpired error', e); }
    }
  }

  private emitCancelled(): void {
    for (const listener of this.listeners) {
      try { listener.onCancelled?.(); } catch (e) { logger.error('[EmergencyCountdown] onCancelled error', e); }
    }
  }

  private emitPaused(remaining: number): void {
    for (const listener of this.listeners) {
      try { listener.onPaused?.(remaining); } catch (e) { logger.error('[EmergencyCountdown] onPaused error', e); }
    }
  }

  private emitResumed(remaining: number): void {
    for (const listener of this.listeners) {
      try { listener.onResumed?.(remaining); } catch (e) { logger.error('[EmergencyCountdown] onResumed error', e); }
    }
  }

  private stopTickTimer(): void {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  reset(): void {
    this.stopTickTimer();
    this.state = {
      remaining: 0,
      total: 0,
      startedAt: null,
      isRunning: false,
      elapsed: 0,
      paused: false,
      pausedRemaining: null,
    };
  }

  destroy(): void {
    this.destroyed = true;
    this.stopTickTimer();
    this.listeners = [];
    this.reset();
  }
}

export const emergencyCountdownManager = new EmergencyCountdownManager();
