import { logger } from '../debug';

export type EmergencyStatus =
  | 'idle'
  | 'countdown'
  | 'triggered'
  | 'sending'
  | 'escalating'
  | 'resolved'
  | 'cancelled';

export type EmergencyEvent =
  | 'START_COUNTDOWN'
  | 'COUNTDOWN_TICK'
  | 'COUNTDOWN_EXPIRED'
  | 'CONFIRM_EMERGENCY'
  | 'CANCEL_EMERGENCY'
  | 'SEND_STARTED'
  | 'SEND_SUCCESS'
  | 'SEND_FAILED'
  | 'ESCALATE'
  | 'RESOLVE'
  | 'RECOVERY_TIMEOUT'
  | 'FORCE_RESET';

interface Transition {
  from: Set<EmergencyStatus>;
  to: EmergencyStatus;
}

interface StateListener {
  id: string;
  onEnter?: (status: EmergencyStatus, prev: EmergencyStatus) => void;
  onExit?: (status: EmergencyStatus, next: EmergencyStatus) => void;
}

const VALID_TRANSITIONS: Record<EmergencyEvent, Transition> = {
  START_COUNTDOWN: {
    from: new Set<EmergencyStatus>(['idle', 'resolved', 'cancelled']),
    to: 'countdown',
  },
  COUNTDOWN_TICK: {
    from: new Set<EmergencyStatus>(['countdown']),
    to: 'countdown',
  },
  COUNTDOWN_EXPIRED: {
    from: new Set<EmergencyStatus>(['countdown']),
    to: 'triggered',
  },
  CONFIRM_EMERGENCY: {
    from: new Set<EmergencyStatus>(['countdown']),
    to: 'triggered',
  },
  CANCEL_EMERGENCY: {
    from: new Set<EmergencyStatus>(['countdown', 'triggered', 'sending']),
    to: 'cancelled',
  },
  SEND_STARTED: {
    from: new Set<EmergencyStatus>(['triggered']),
    to: 'sending',
  },
  SEND_SUCCESS: {
    from: new Set<EmergencyStatus>(['sending']),
    to: 'sending',
  },
  SEND_FAILED: {
    from: new Set<EmergencyStatus>(['sending']),
    to: 'sending',
  },
  ESCALATE: {
    from: new Set<EmergencyStatus>(['triggered', 'sending']),
    to: 'escalating',
  },
  RESOLVE: {
    from: new Set<EmergencyStatus>(['triggered', 'sending', 'escalating']),
    to: 'resolved',
  },
  RECOVERY_TIMEOUT: {
    from: new Set<EmergencyStatus>(['resolved', 'cancelled']),
    to: 'idle',
  },
  FORCE_RESET: {
    from: new Set<EmergencyStatus>(['idle', 'countdown', 'triggered', 'sending', 'escalating', 'resolved', 'cancelled']),
    to: 'idle',
  },
};

export class EmergencyStateMachine {
  private status: EmergencyStatus = 'idle';
  private listeners: StateListener[] = [];
  private destroyed = false;
  private transitionLog: Array<{ from: EmergencyStatus; to: EmergencyStatus; event: EmergencyEvent; timestamp: number }> = [];
  private readonly MAX_LOG_SIZE = 50;

  get currentStatus(): EmergencyStatus {
    return this.status;
  }

  get isActive(): boolean {
    return this.status === 'countdown' || this.status === 'triggered' || this.status === 'sending' || this.status === 'escalating';
  }

  get isIdle(): boolean {
    return this.status === 'idle';
  }

  get transitionHistory(): ReadonlyArray<{ from: EmergencyStatus; to: EmergencyStatus; event: EmergencyEvent; timestamp: number }> {
    return [...this.transitionLog];
  }

  send(event: EmergencyEvent): boolean {
    if (this.destroyed) return false;

    const transition = VALID_TRANSITIONS[event];
    if (!transition) {
      logger.error(`[EmergencyStateMachine] Unknown event: ${event}`);
      return false;
    }

    if (!transition.from.has(this.status)) {
      logger.warn(
        `[EmergencyStateMachine] Invalid transition: ${this.status} --[${event}]--> ${transition.to}`,
      );
      return false;
    }

    const prev = this.status;

    for (const listener of this.listeners) {
      try {
        listener.onExit?.(prev, transition.to);
      } catch (error) {
        logger.error('[EmergencyStateMachine] onExit listener error', error);
      }
    }

    this.status = transition.to;

    this.transitionLog.unshift({ from: prev, to: this.status, event, timestamp: Date.now() });
    if (this.transitionLog.length > this.MAX_LOG_SIZE) {
      this.transitionLog.pop();
    }

    logger.info(
      `[EmergencyStateMachine] ${prev} --[${event}]--> ${this.status}`,
    );

    for (const listener of this.listeners) {
      try {
        listener.onEnter?.(this.status, prev);
      } catch (error) {
        logger.error('[EmergencyStateMachine] onEnter listener error', error);
      }
    }

    return true;
  }

  canTransition(event: EmergencyEvent): boolean {
    if (this.destroyed) return false;
    const transition = VALID_TRANSITIONS[event];
    return transition?.from.has(this.status) ?? false;
  }

  addListener(listener: Omit<StateListener, 'id'>): () => void {
    const id = `stm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const entry: StateListener = { ...listener, id };
    this.listeners.push(entry);

    return () => {
      this.listeners = this.listeners.filter(l => l.id !== id);
    };
  }

  removeAllListeners(): void {
    this.listeners = [];
  }

  reset(): void {
    if (this.destroyed) return;
    this.status = 'idle';
    this.transitionLog = [];
    logger.info('[EmergencyStateMachine] Reset to idle');
  }

  destroy(): void {
    this.destroyed = true;
    this.listeners = [];
    this.transitionLog = [];
  }
}

export const emergencyStateMachine = new EmergencyStateMachine();
