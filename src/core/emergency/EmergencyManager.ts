import { eventBus, EVENTS, EventPriority } from '../events/EventBus';
import { logger } from '../debug';
import { accessibilityEngine } from '../accessibility';
import { emergencyStateMachine, EmergencyStatus } from './EmergencyStateMachine';
import { emergencyCountdownManager } from './EmergencyCountdownManager';
import { emergencyEventPriorityManager, EMERGENCY_EVENTS } from './EmergencyEventPriority';
import { emergencyGPSPipeline } from './EmergencyGPSPipeline';
import { emergencySMSPipeline } from './EmergencySMSPipeline';
import { emergencyContactManager } from './EmergencyContactManager';
import type { GPSLocation } from './EmergencyGPSPipeline';

export interface EmergencySession {
  id: string;
  startedAt: number;
  triggeredAt: number | null;
  resolvedAt: number | null;
  cancelledAt: number | null;
  status: EmergencyStatus;
  contactsNotified: number;
  contactsFailed: number;
  gpsLocation: GPSLocation | null;
  smsSent: number;
  smsFailed: number;
  escalationAttempts: number;
  duration: number;
}

export interface EmergencyManagerConfig {
  autoPrepareGPS: boolean;
  autoSendSMS: boolean;
  escalatedBackoffMs: number;
  maxEscalationAttempts: number;
  recoveryTimeoutMs: number;
}

const DEFAULT_CONFIG: EmergencyManagerConfig = {
  autoPrepareGPS: true,
  autoSendSMS: true,
  escalatedBackoffMs: 30000,
  maxEscalationAttempts: 3,
  recoveryTimeoutMs: 30000,
};

export class EmergencyManager {
  private config: EmergencyManagerConfig;
  private currentSession: EmergencySession | null = null;
  private initialized = false;
  private destroyed = false;
  private recoveryTimer: ReturnType<typeof setTimeout> | null = null;
  private stateMachineCleanup: (() => void) | null = null;
  private countdownCleanup: (() => void) | null = null;
  private eventPriorityCleanup: (() => void) | null = null;

  constructor(config: Partial<EmergencyManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  initialize(): void {
    if (this.initialized || this.destroyed) return;

    logger.info('[EmergencyManager] Initializing...');

    this.stateMachineCleanup = emergencyStateMachine.addListener({
      onEnter: (status: EmergencyStatus) => {
        this.handleStateChange(status);
      },
    });

    this.countdownCleanup = emergencyCountdownManager.addListener({
      onTick: (remaining: number) => {
        emergencyEventPriorityManager.publish(EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_TICK, {
          remaining,
          elapsed: (this.currentSession?.startedAt ?? Date.now())
            ? Date.now() - (this.currentSession?.startedAt ?? Date.now())
            : 0,
        });

        if (remaining > 0 && remaining <= 3) {
          accessibilityEngine.triggerHaptic('emergency');
        }
      },
      onExpired: () => {
        this.onEmergencyTriggered();
      },
      onCancelled: () => {
        logger.info('[EmergencyManager] Countdown cancelled externally');
        emergencySMSPipeline.cancelPending();
        accessibilityEngine.exitEmergencyMode();
        this.scheduleRecovery();
      },
    });

    this.eventPriorityCleanup = emergencyEventPriorityManager.subscribeToEmergencyEvents();

    this.initialized = true;
    logger.info('[EmergencyManager] Initialized');
  }

  startCountdown(duration?: number): boolean {
    if (this.destroyed || !this.initialized) return false;

    if (emergencyStateMachine.isActive) {
      logger.warn('[EmergencyManager] Already in active emergency state');
      return false;
    }

    const id = `emergency_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    this.currentSession = {
      id,
      startedAt: Date.now(),
      triggeredAt: null,
      resolvedAt: null,
      cancelledAt: null,
      status: 'countdown',
      contactsNotified: 0,
      contactsFailed: 0,
      gpsLocation: null,
      smsSent: 0,
      smsFailed: 0,
      escalationAttempts: 0,
      duration: 0,
    };

    const started = emergencyCountdownManager.start(duration);
    if (!started) return false;

    emergencyEventPriorityManager.publish(EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_STARTED, {
      duration: duration ?? 5,
      startedAt: this.currentSession.startedAt,
    });

    return true;
  }

  private onEmergencyTriggered(): void {
    if (!this.currentSession) return;

    this.currentSession.status = 'triggered';
    this.currentSession.triggeredAt = Date.now();

    emergencyEventPriorityManager.publish(EMERGENCY_EVENTS.EMERGENCY_TRIGGERED, {
      triggeredAt: this.currentSession.triggeredAt,
      fromCountdown: true,
    });

    eventBus.publish(EVENTS.EMERGENCY_TRIGGERED, { triggeredAt: this.currentSession.triggeredAt }, 'critical');

    accessibilityEngine.enterEmergencyMode();
    accessibilityEngine.announce(
      'Emergency activated. Sending alerts to your emergency contacts.',
      'critical',
      true,
    );
    accessibilityEngine.triggerHaptic('emergency');

    this.executeEmergencyProtocol();
  }

  private async executeEmergencyProtocol(): Promise<void> {
    if (!this.currentSession || this.destroyed) return;

    emergencyEventPriorityManager.publish(EMERGENCY_EVENTS.EMERGENCY_SENDING, {
      contactCount: emergencyContactManager.getNotifiableContacts().length,
      timestamp: Date.now(),
    });

    if (this.config.autoPrepareGPS) {
      const location = await emergencyGPSPipeline.prepareLocation();
      if (this.currentSession) {
        this.currentSession.gpsLocation = location;
      }
    }

    if (this.config.autoSendSMS) {
      const contacts = emergencyContactManager.getNotifiableContacts();
      if (contacts.length > 0) {
        const messages = await emergencySMSPipeline.sendEmergencyAlerts(
          contacts,
          this.currentSession.gpsLocation
            ? {
                latitude: this.currentSession.gpsLocation.latitude,
                longitude: this.currentSession.gpsLocation.longitude,
              }
            : null,
        );

        if (this.currentSession) {
          this.currentSession.smsSent = messages.filter(m => m.status === 'sent').length;
          this.currentSession.smsFailed = messages.filter(m => m.status === 'failed').length;
          this.currentSession.contactsNotified = this.currentSession.smsSent;
          this.currentSession.contactsFailed = this.currentSession.smsFailed;
        }
      }
    }
  }

  cancelEmergency(reason?: string): boolean {
    if (this.destroyed) return false;

    const cancelled = emergencyCountdownManager.cancel() || emergencyStateMachine.send('CANCEL_EMERGENCY');

    if (!cancelled) return false;

    if (this.currentSession) {
      this.currentSession.status = 'cancelled';
      this.currentSession.cancelledAt = Date.now();
    }

    emergencyEventPriorityManager.publish(EMERGENCY_EVENTS.EMERGENCY_CANCELLED, {
      cancelledAt: Date.now(),
      reason,
    });

    eventBus.publish(EVENTS.EMERGENCY_CANCELLED, { cancelledAt: Date.now(), reason }, 'high');

    emergencySMSPipeline.cancelPending();
    accessibilityEngine.exitEmergencyMode();
    accessibilityEngine.announce('Emergency cancelled', 'high', true);

    this.scheduleRecovery();

    return true;
  }

  resolveEmergency(): boolean {
    if (this.destroyed) return false;

    const success = emergencyStateMachine.send('RESOLVE');
    if (!success) return false;

    if (this.currentSession) {
      this.currentSession.status = 'resolved';
      this.currentSession.resolvedAt = Date.now();
      this.currentSession.duration = this.currentSession.resolvedAt - this.currentSession.startedAt;
    }

    emergencyEventPriorityManager.publish(EMERGENCY_EVENTS.EMERGENCY_RESOLVED, {
      resolvedAt: Date.now(),
      duration: this.currentSession?.duration ?? 0,
    });

    accessibilityEngine.exitEmergencyMode();
    accessibilityEngine.announce('Emergency has been resolved', 'high', true);

    this.scheduleRecovery();
    return true;
  }

  escalate(): boolean {
    if (this.destroyed || !this.currentSession) return false;

    const success = emergencyStateMachine.send('ESCALATE');
    if (!success) return false;

    this.currentSession.escalationAttempts++;
    this.currentSession.status = 'escalating';

    emergencyEventPriorityManager.publish(EMERGENCY_EVENTS.EMERGENCY_ESCALATED, {
      attempt: this.currentSession.escalationAttempts,
      timestamp: Date.now(),
    });

    accessibilityEngine.announce(
      `Emergency escalating. Attempt ${this.currentSession.escalationAttempts}`,
      'critical',
      true,
    );

    const backoff = this.config.escalatedBackoffMs * Math.pow(2, this.currentSession.escalationAttempts - 1);
    setTimeout(() => {
      if (!this.destroyed && this.currentSession?.status === 'escalating') {
        this.executeEmergencyProtocol();
      }
    }, Math.min(backoff, 120000));

    return true;
  }

  private handleStateChange(status: EmergencyStatus): void {
    if (status === 'idle') {
      this.currentSession = null;
    }
  }

  private scheduleRecovery(): void {
    if (this.recoveryTimer) clearTimeout(this.recoveryTimer);

    this.recoveryTimer = setTimeout(() => {
      if (this.destroyed) return;

      emergencyStateMachine.send('RECOVERY_TIMEOUT');
      emergencyEventPriorityManager.publish(EMERGENCY_EVENTS.EMERGENCY_RECOVERY, {
        timestamp: Date.now(),
      });
      this.currentSession = null;
    }, this.config.recoveryTimeoutMs);
  }

  getSession(): Readonly<EmergencySession | null> {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  get status(): EmergencyStatus {
    return emergencyStateMachine.currentStatus;
  }

  get isActive(): boolean {
    return emergencyStateMachine.isActive;
  }

  get countdownRemaining(): number {
    return emergencyCountdownManager.remaining;
  }

  get isCountdownRunning(): boolean {
    return emergencyCountdownManager.isRunning;
  }

  updateConfig(config: Partial<EmergencyManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  reset(): void {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }

    emergencyStateMachine.reset();
    emergencyCountdownManager.reset();
    emergencySMSPipeline.clearHistory();

    this.currentSession = null;
    accessibilityEngine.exitEmergencyMode();

    logger.info('[EmergencyManager] Reset');
  }

  destroy(): void {
    if (this.destroyed) return;

    this.destroyed = true;
    if (this.recoveryTimer) clearTimeout(this.recoveryTimer);

    if (this.stateMachineCleanup) {
      this.stateMachineCleanup();
      this.stateMachineCleanup = null;
    }

    if (this.countdownCleanup) {
      this.countdownCleanup();
      this.countdownCleanup = null;
    }

    if (this.eventPriorityCleanup) {
      this.eventPriorityCleanup();
      this.eventPriorityCleanup = null;
    }

    this.reset();
    logger.info('[EmergencyManager] Destroyed');
  }
}

export const emergencyManager = new EmergencyManager();
