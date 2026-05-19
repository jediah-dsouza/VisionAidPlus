import { AccessibilityInfo } from 'react-native';
import { eventBus, EVENTS, EventPriority } from '../events/EventBus';
import { logger } from '../debug';
import { VoiceMessage, voiceQueue } from './VoiceQueue';
import { speechController, SpeechState } from './SpeechController';
import { eventPriorityMapper, HapticPattern } from './EventPriorityMapper';
import { hapticCoordinator } from './HapticCoordinator';
import { focusManager } from './FocusManager';
import { accessibilityEventEmitter } from './AccessibilityEventEmitter';

export interface AccessibilityConfig {
  screenReaderEnabled: boolean;
  highContrastMode: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  hapticFeedback: boolean;
  voiceAnnouncements: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

interface AnnounceConfig {
  message: string;
  priority: EventPriority;
  interrupt?: boolean;
  source?: string;
}

interface EventBusUnsubscribe {
  event: string;
  unsubscribe: () => void;
}

class AccessibilityEngine {
  private config: AccessibilityConfig;
  private screenReaderActive = false;
  private announceQueue: AnnounceConfig[] = [];
  private isAnnouncing = false;
  private emergencyMode = false;
  private initialized = false;
  private destroyed = false;
  private eventBusUnsubscribes: EventBusUnsubscribe[] = [];
  private rnEventListeners: Array<{ remove: () => void }> = [];

  constructor() {
    this.config = {
      screenReaderEnabled: true,
      highContrastMode: true,
      largeText: true,
      reducedMotion: false,
      hapticFeedback: true,
      voiceAnnouncements: true,
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized || this.destroyed) return;

    try {
      this.screenReaderActive = await AccessibilityInfo.isScreenReaderEnabled().catch(() => false);
      logger.info(
        `Accessibility: Screen reader ${this.screenReaderActive ? 'enabled' : 'disabled'}`,
      );

      const screenReaderListener = AccessibilityInfo.addEventListener(
        'screenReaderChanged',
        enabled => {
          if (this.destroyed) return;
          this.screenReaderActive = enabled;
          accessibilityEventEmitter.emitScreenReaderChanged(enabled);
          logger.info(
            `Accessibility: Screen reader changed to ${enabled ? 'enabled' : 'disabled'}`,
          );
        },
      );
      this.rnEventListeners.push(screenReaderListener);

      const reduceMotionListener = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        enabled => {
          if (this.destroyed) return;
          this.config.reducedMotion = enabled;
          accessibilityEventEmitter.emitReduceMotionChanged(enabled);
        },
      );
      this.rnEventListeners.push(reduceMotionListener);

      this.setupEventBusIntegration();
      this.setupSpeechController();
      this.setupFocusManager();

      this.initialized = true;
      logger.info('AccessibilityEngine: Initialized successfully');
    } catch (error) {
      logger.error('Accessibility: Failed to initialize', error);
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      logger.warn('AccessibilityEngine: Used before initialization. Call initialize() first.');
    }
    if (this.destroyed) {
      logger.warn('AccessibilityEngine: Used after destroy(). Create new instance.');
    }
  }

  private setupEventBusIntegration(): void {
    const unsubscribes: EventBusUnsubscribe[] = [];

    const emergencyTriggeredUnsub = eventBus.subscribe(
      EVENTS.EMERGENCY_TRIGGERED,
      () => {
        if (this.destroyed) return;
        this.enterEmergencyMode();
      },
      'critical',
    );
    unsubscribes.push({ event: EVENTS.EMERGENCY_TRIGGERED, unsubscribe: emergencyTriggeredUnsub });

    const emergencyCancelledUnsub = eventBus.subscribe(
      EVENTS.EMERGENCY_CANCELLED,
      () => {
        if (this.destroyed) return;
        this.exitEmergencyMode();
      },
      'high',
    );
    unsubscribes.push({ event: EVENTS.EMERGENCY_CANCELLED, unsubscribe: emergencyCancelledUnsub });

    const aiDangerUnsub = eventBus.subscribe(
      EVENTS.AI_DANGER_DETECTED,
      (payload: { message?: string }) => {
        if (this.destroyed) return;
        this.handleCriticalEvent('AI_DANGER_DETECTED', payload?.message);
      },
      'critical',
    );
    unsubscribes.push({ event: EVENTS.AI_DANGER_DETECTED, unsubscribe: aiDangerUnsub });

    const aiObstacleUnsub = eventBus.subscribe(
      EVENTS.AI_OBSTACLE_DETECTED,
      (payload: { message?: string }) => {
        if (this.destroyed) return;
        this.handleHighPriorityEvent('AI_OBSTACLE_DETECTED', payload?.message);
      },
      'high',
    );
    unsubscribes.push({ event: EVENTS.AI_OBSTACLE_DETECTED, unsubscribe: aiObstacleUnsub });

    const navStartedUnsub = eventBus.subscribe(
      EVENTS.NAVIGATION_STARTED,
      () => {
        if (this.destroyed) return;
        this.handleHighPriorityEvent('NAVIGATION_STARTED');
      },
      'high',
    );
    unsubscribes.push({ event: EVENTS.NAVIGATION_STARTED, unsubscribe: navStartedUnsub });

    const alertUnsub = eventBus.subscribe(
      EVENTS.ALERT_RECEIVED,
      () => {
        if (this.destroyed) return;
        this.handleHighPriorityEvent('ALERT_RECEIVED');
      },
      'high',
    );
    unsubscribes.push({ event: EVENTS.ALERT_RECEIVED, unsubscribe: alertUnsub });

    const bleWeakUnsub = eventBus.subscribe(
      EVENTS.BLE_SIGNAL_WEAK,
      () => {
        if (this.destroyed) return;
        this.handleHighPriorityEvent('BLE_SIGNAL_WEAK');
      },
      'high',
    );
    unsubscribes.push({ event: EVENTS.BLE_SIGNAL_WEAK, unsubscribe: bleWeakUnsub });

    this.eventBusUnsubscribes = unsubscribes;
  }

  private setupSpeechController(): void {
    speechController.setStateChangeListener((state: SpeechState) => {
      if (this.destroyed) return;
      if (state === 'speaking') {
        hapticCoordinator.setVoiceSpeaking(true);
      } else {
        hapticCoordinator.setVoiceSpeaking(false);
      }
      if (state === 'idle') {
        accessibilityEventEmitter.emitAnnouncementCompleted('');
      }
    });
  }

  private setupFocusManager(): void {
    focusManager.setFocusAnnounceListener(async message => {
      if (this.destroyed) return;
      await this.announce(message, 'low');
    });
  }

  private handleCriticalEvent(eventName: string, customMessage?: string): void {
    if (this.destroyed) return;
    const mapping = eventPriorityMapper.getPriority(eventName);
    const message = customMessage || mapping.messageTemplate;

    this.announce(message, 'critical', true);
    this.triggerHaptic(mapping.hapticPattern || 'emergency');
  }

  private handleHighPriorityEvent(eventName: string, customMessage?: string): void {
    if (this.destroyed) return;
    const mapping = eventPriorityMapper.getPriority(eventName);
    const message = customMessage || mapping.messageTemplate;

    if (message) {
      this.announce(message, 'high', false);
    }
    if (mapping.hapticPattern) {
      this.triggerHaptic(mapping.hapticPattern);
    }
  }

  enterEmergencyMode(): void {
    if (this.destroyed) return;
    this.emergencyMode = true;
    speechController.interrupt();
    hapticCoordinator.vibrate('emergency');
    accessibilityEventEmitter.emitEmergencyModeEntered();
    logger.info('AccessibilityEngine: Emergency mode entered');
  }

  exitEmergencyMode(): void {
    if (this.destroyed) return;
    this.emergencyMode = false;
    accessibilityEventEmitter.emitEmergencyModeExited();
    logger.info('AccessibilityEngine: Emergency mode exited');
  }

  isEmergencyMode(): boolean {
    return this.emergencyMode;
  }

  updateConfig(partial: Partial<AccessibilityConfig>): void {
    if (this.destroyed) return;
    this.config = { ...this.config, ...partial };

    if (partial.hapticFeedback !== undefined) {
      hapticCoordinator.updateConfig({ enabled: partial.hapticFeedback });
    }

    eventBus.publish(EVENTS.SETTINGS_CHANGED, { accessibility: this.config }, 'low');
  }

  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  isScreenReaderActive(): boolean {
    return this.screenReaderActive;
  }

  async announce(
    message: string,
    priority: EventPriority = 'normal',
    interrupt = false,
  ): Promise<void> {
    if (this.destroyed) return;
    this.ensureInitialized();

    if (!this.config.voiceAnnouncements) return;
    if (!message) return;

    if (this.isInQuietHours() && priority !== 'critical') {
      logger.debug(`Accessibility: Message delayed due to quiet hours: ${message}`);
      return;
    }

    accessibilityEventEmitter.emitAnnouncementStarted(message, priority);

    const voiceMessage: Omit<VoiceMessage, 'id' | 'timestamp'> = {
      message,
      priority: this.emergencyMode && priority !== 'critical' ? 'high' : priority,
      source: 'AccessibilityEngine',
    };

    if (interrupt || priority === 'critical') {
      await speechController.interrupt();
      await speechController.speak({
        ...voiceMessage,
        id: `urgent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
      });
      return;
    }

    voiceQueue.add(voiceMessage);
    speechController.startProcessing();
  }

  private isInQuietHours(): boolean {
    if (!this.config.quietHoursEnabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const startParts = (this.config.quietHoursStart || '22:00').split(':');
    const endParts = (this.config.quietHoursEnd || '07:00').split(':');

    const startMinutes = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
    const endMinutes = parseInt(endParts[0], 10) * 60 + parseInt(endParts[1], 10);

    if (startMinutes <= endMinutes) {
      return currentTime >= startMinutes && currentTime <= endMinutes;
    }

    return currentTime >= startMinutes || currentTime <= endMinutes;
  }

  triggerHaptic(pattern: HapticPattern = 'light'): void {
    if (this.destroyed) return;
    if (!this.config.hapticFeedback) return;
    hapticCoordinator.vibrate(pattern);
  }

  triggerHapticByPriority(priority: EventPriority): void {
    if (this.destroyed) return;
    if (!this.config.hapticFeedback) return;
    hapticCoordinator.vibrateByPriority(priority);
  }

  async focusOnElement(elementId: string): Promise<void> {
    if (this.destroyed) return;
    this.ensureInitialized();
    logger.debug(`Accessibility: Focusing on element ${elementId}`);
    accessibilityEventEmitter.emitFocusChanged(elementId);
    await this.announce(`Focused on ${elementId}`, 'low');
  }

  announceNavigationChange(screenName: string): void {
    if (this.destroyed) return;
    focusManager.announceNavigationChange(screenName);
    this.announce(`Navigated to ${screenName}`, 'normal', true);
  }

  announceLiveRegion(update: string, priority: EventPriority = 'normal'): void {
    if (this.destroyed) return;
    focusManager.announceLiveRegion(update);
    this.announce(update, priority, priority === 'critical');
  }

  announceFromEvent(eventName: string, customMessage?: string): void {
    if (this.destroyed) return;
    const mapping = eventPriorityMapper.getPriority(eventName);
    const message = customMessage || mapping.messageTemplate;

    if (!message) return;

    this.announce(message, mapping.priority, mapping.canInterrupt);
    if (mapping.hapticPattern) {
      this.triggerHaptic(mapping.hapticPattern);
    }
  }

  getQueueSize(): number {
    return voiceQueue.getQueueSize();
  }

  clearQueue(): void {
    voiceQueue.clear();
  }

  getSpeechState(): SpeechState {
    return speechController.getState();
  }

  pauseSpeech(): void {
    if (this.destroyed) return;
    speechController.pause();
  }

  resumeSpeech(): void {
    if (this.destroyed) return;
    speechController.resume();
  }

  interruptSpeech(): Promise<void> {
    if (this.destroyed) return Promise.resolve();
    return speechController.interrupt().then(() => {});
  }

  isReady(): boolean {
    return this.initialized && !this.destroyed;
  }

  destroy(): void {
    if (this.destroyed) return;

    logger.info('AccessibilityEngine: Destroying...');

    this.destroyed = true;

    for (const { unsubscribe } of this.eventBusUnsubscribes) {
      try {
        unsubscribe();
      } catch (e) {
        logger.error('AccessibilityEngine: Failed to unsubscribe eventBus', e);
      }
    }
    this.eventBusUnsubscribes = [];

    for (const listener of this.rnEventListeners) {
      try {
        listener.remove();
      } catch (e) {
        logger.error('AccessibilityEngine: Failed to remove RN listener', e);
      }
    }
    this.rnEventListeners = [];

    try {
      speechController.destroy();
    } catch (e) {
      logger.error('AccessibilityEngine: Failed to destroy speechController', e);
    }

    try {
      hapticCoordinator.cancel();
      hapticCoordinator.clearPending();
    } catch (e) {
      logger.error('AccessibilityEngine: Failed to cleanup haptics', e);
    }

    try {
      focusManager.clearHistory();
    } catch (e) {
      logger.error('AccessibilityEngine: Failed to cleanup focus manager', e);
    }

    voiceQueue.clear();

    accessibilityEventEmitter.removeAllListeners();

    this.announceQueue = [];
    this.config = {
      screenReaderEnabled: false,
      highContrastMode: false,
      largeText: false,
      reducedMotion: false,
      hapticFeedback: false,
      voiceAnnouncements: false,
    };

    logger.info('AccessibilityEngine: Destroyed');
  }
}

export const accessibilityEngine = new AccessibilityEngine();

export type { AnnounceConfig };
