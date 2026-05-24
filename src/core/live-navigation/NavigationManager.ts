import { logger } from '../debug';
import { eventBus } from '../events/EventBus';
import { accessibilityEngine } from '../accessibility';
import { obstacleRegistry } from './ObstacleRegistry';
import { obstacleLifecycleManager } from './ObstacleLifecycleManager';
import { obstaclePrioritizationEngine } from './ObstaclePrioritizationEngine';
import { directionalGuidanceEngine } from './DirectionalGuidanceEngine';
import { radarSyncSystem } from './RadarSyncSystem';
import { subscribeToObstacleEvents, subscribeToDangerEvents, NAVIGATION_EVENTS } from './NavigationEventBus';
import type {
  ObstacleEvent, Obstacle, EnvironmentMode, NavigationStatus,
  NavigationSession, NavigationConfig, DangerLevel, GuidanceInstruction,
  NavigationMetrics, NavigationPerformanceReport,
} from './types';
import { DEFAULT_NAVIGATION_CONFIG } from './types';

export class NavigationManager {
  private config: NavigationConfig;
  private session: NavigationSession | null = null;
  private initialized = false;
  private destroyed = false;
  private paused = false;
  private backgrounded = false;
  private guidanceTimer: ReturnType<typeof setInterval> | null = null;
  private radarTimer: ReturnType<typeof setInterval> | null = null;
  private accessibilityCleanup: (() => void) | null = null;
  private obstacleCleanup: (() => void) | null = null;
  private dangerCleanup: (() => void) | null = null;

  private metrics: NavigationMetrics = {
    totalObstaclesDetected: 0,
    totalInstructionsIssued: 0,
    totalDangerAlerts: 0,
    averageLatencyMs: 0,
    peakLatencyMs: 0,
    cleanupCycles: 0,
    deduplicationHits: 0,
    staleObstaclesPruned: 0,
    renderCount: 0,
    lastUpdatedAt: 0,
  };

  constructor(config: Partial<NavigationConfig> = {}) {
    this.config = { ...DEFAULT_NAVIGATION_CONFIG, ...config };
  }

  initialize(): void {
    if (this.initialized || this.destroyed) return;
    logger.info('[NavigationManager] Initializing...');

    obstacleLifecycleManager.start();

    this.obstacleCleanup = subscribeToObstacleEvents(
      (payload) => this.handleObstacleDetected(payload as { obstacle: Obstacle }),
      (payload) => this.handleObstacleUpdated(payload as { obstacle: Obstacle }),
    );

    this.dangerCleanup = subscribeToDangerEvents(
      () => { this.metrics.totalDangerAlerts++; },
    );

    this.accessibilityCleanup = this.setupAccessibilityIntegration();

    this.initialized = true;
    logger.info('[NavigationManager] Initialized');
  }

  private setupAccessibilityIntegration(): () => void {
    const dangerUnsub = eventBus.subscribe(
      NAVIGATION_EVENTS.DANGER_ESCALATED,
      (payload: unknown) => {
        const { to } = payload as { to: DangerLevel };
        if (to === 'critical' || to === 'high') {
          accessibilityEngine.triggerHaptic('emergency');
          accessibilityEngine.announce(
            `Navigation danger: ${to} level`,
            'critical',
            true,
          );
        }
      },
      'critical',
    );

    const guidanceUnsub = eventBus.subscribe(
      NAVIGATION_EVENTS.GUIDANCE_ISSUED,
      (payload: unknown) => {
        const { instruction } = payload as { instruction: GuidanceInstruction };
        if (instruction.spoken) return;

        instruction.spoken = true;
        this.metrics.totalInstructionsIssued++;

        if (instruction.hapticPattern) {
          accessibilityEngine.triggerHaptic(instruction.hapticPattern as any);
        }

        accessibilityEngine.announce(
          instruction.text,
          instruction.priority,
          instruction.priority === 'critical',
        );
      },
      'high',
    );

    return () => {
      try { dangerUnsub(); } catch { }
      try { guidanceUnsub(); } catch { }
    };
  }

  startNavigation(): boolean {
    if (this.destroyed) return false;

    if (this.session && this.session.status === 'navigating') return false;

    this.session = {
      id: `nav_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      status: 'navigating',
      environment: 'outdoor',
      position: null,
      route: null,
      startedAt: Date.now(),
      pausedAt: null,
      totalPausedDuration: 0,
      obstacleCount: 0,
      dangerLevel: 'none',
      lastInstruction: null,
    };

    this.paused = false;
    this.startGuidanceLoop();
    this.startRadarLoop();

    eventBus.publish(NAVIGATION_EVENTS.NAVIGATION_STARTED, { session: this.session }, 'high');
    logger.info('[NavigationManager] Navigation started');
    return true;
  }

  stopNavigation(): void {
    if (!this.session) return;

    this.stopGuidanceLoop();
    this.stopRadarLoop();
    obstacleRegistry.clear();

    const session = this.session;
    this.session = null;
    this.paused = false;

    eventBus.publish(NAVIGATION_EVENTS.NAVIGATION_STOPPED, { sessionId: session.id }, 'high');
    accessibilityEngine.announce('Navigation stopped', 'high', true);
    logger.info('[NavigationManager] Navigation stopped');
  }

  pauseNavigation(): boolean {
    if (!this.session || this.paused) return false;

    this.paused = true;
    this.session.status = 'paused';
    this.session.pausedAt = Date.now();
    this.stopGuidanceLoop();
    this.stopRadarLoop();

    eventBus.publish(NAVIGATION_EVENTS.NAVIGATION_PAUSED, { sessionId: this.session.id }, 'normal');
    accessibilityEngine.announce('Navigation paused', 'normal', false);
    logger.info('[NavigationManager] Paused');
    return true;
  }

  resumeNavigation(): boolean {
    if (!this.session || !this.paused) return false;

    if (this.session.pausedAt) {
      this.session.totalPausedDuration += Date.now() - this.session.pausedAt;
    }

    this.paused = false;
    this.session.status = 'navigating';
    this.session.pausedAt = null;
    this.startGuidanceLoop();
    this.startRadarLoop();

    eventBus.publish(NAVIGATION_EVENTS.NAVIGATION_RESUMED, { sessionId: this.session.id }, 'normal');
    accessibilityEngine.announce('Navigation resumed', 'normal', false);
    logger.info('[NavigationManager] Resumed');
    return true;
  }

  handleObstacleEvent(event: ObstacleEvent): Obstacle | null {
    if (this.destroyed || this.paused) return null;

    const obstacle = obstacleRegistry.insertOrUpdate(event);
    if (obstacle) {
      this.metrics.totalObstaclesDetected++;
      this.processObstacles();
    }
    return obstacle;
  }

  private handleObstacleDetected(payload: { obstacle: Obstacle }): void {
    this.metrics.totalObstaclesDetected++;
  }

  private handleObstacleUpdated(payload: { obstacle: Obstacle }): void {
    this.processObstacles();
  }

  private processObstacles(): void {
    if (this.paused || !this.session) return;

    const activeObstacles = obstacleRegistry.getActive();

    this.session.obstacleCount = activeObstacles.length;

    const dangerLevel = obstaclePrioritizationEngine.evaluateAndPublishDanger(activeObstacles);

    if (this.session) {
      this.session.dangerLevel = dangerLevel;
    }

    const instructions = directionalGuidanceEngine.evaluateAndGenerateInstructions(activeObstacles);
    if (instructions.length > 0 && this.session) {
      this.session.lastInstruction = instructions[instructions.length - 1];
    }

    radarSyncSystem.syncAndPublish();
    this.metrics.renderCount++;
  }

  private startGuidanceLoop(): void {
    this.stopGuidanceLoop();
    this.guidanceTimer = setInterval(() => {
      this.processObstacles();
    }, this.config.guidanceUpdateIntervalMs);
  }

  private stopGuidanceLoop(): void {
    if (this.guidanceTimer) {
      clearInterval(this.guidanceTimer);
      this.guidanceTimer = null;
    }
  }

  private startRadarLoop(): void {
    this.stopRadarLoop();
    this.radarTimer = setInterval(() => {
      radarSyncSystem.syncAndPublish();
    }, this.config.renderThrottleMs);
  }

  private stopRadarLoop(): void {
    if (this.radarTimer) {
      clearInterval(this.radarTimer);
      this.radarTimer = null;
    }
  }

  setEnvironment(mode: EnvironmentMode): void {
    if (this.destroyed) return;

    const prev = this.session?.environment ?? 'outdoor';
    if (this.session) {
      this.session.environment = mode;
    }

    eventBus.publish(
      NAVIGATION_EVENTS.ENVIRONMENT_CHANGED,
      { from: prev, to: mode },
      'normal',
    );

    let announcement: string;
    switch (mode) {
      case 'indoor': announcement = 'Indoor navigation mode'; break;
      case 'outdoor': announcement = 'Outdoor navigation mode'; break;
      case 'night': announcement = 'Night navigation mode'; break;
      case 'tunnel': announcement = 'Tunnel navigation mode'; break;
    }
    accessibilityEngine.announce(announcement, 'high', false);
    logger.info(`[NavigationManager] Environment: ${prev} → ${mode}`);
  }

  getEnvironment(): EnvironmentMode {
    return this.session?.environment ?? 'outdoor';
  }

  setSensitivity(level: number): void {
    const clamped = Math.max(1, Math.min(10, level));
    this.config.sensitivityLevel = clamped;

    eventBus.publish(
      NAVIGATION_EVENTS.SENSITIVITY_CHANGED,
      { level: clamped },
      'normal',
    );

    logger.info(`[NavigationManager] Sensitivity: ${clamped}`);
  }

  getSensitivity(): number {
    return this.config.sensitivityLevel;
  }

  handleBackground(): void {
    this.backgrounded = true;
    if (this.session && !this.paused) {
      this.pauseNavigation();
    }
    logger.info('[NavigationManager] Backgrounded');
  }

  handleForeground(): void {
    this.backgrounded = false;
    logger.info('[NavigationManager] Foregrounded');
  }

  getSession(): NavigationSession | null {
    return this.session;
  }

  isNavigating(): boolean {
    return this.session?.status === 'navigating' && !this.paused;
  }

  isPaused(): boolean {
    return this.paused;
  }

  getMetrics(): NavigationMetrics {
    const registryMetrics = obstacleRegistry.getMetrics();
    return {
      ...this.metrics,
      deduplicationHits: registryMetrics.deduplicationHits,
      staleObstaclesPruned: registryMetrics.stalePruned,
      cleanupCycles: obstacleLifecycleManager.getCycles(),
      lastUpdatedAt: Date.now(),
    };
  }

  getPerformanceReport(): NavigationPerformanceReport {
    const latency = this.metrics.averageLatencyMs;
    return {
      averageRenderTimeMs: latency,
      averageGuidanceLatencyMs: this.config.guidanceUpdateIntervalMs,
      averageRadarSyncMs: this.config.renderThrottleMs,
      obstacleRegistrySize: obstacleRegistry.getCount(),
      eventBusQueueLength: 0,
      droppedFrames: 0,
      memoryEstimateBytes: obstacleRegistry.getCount() * 512,
    };
  }

  updateConfig(config: Partial<NavigationConfig>): void {
    this.config = { ...this.config, ...config };
    obstacleRegistry.updateConfig(this.config);
    obstacleLifecycleManager.updateConfig(this.config);
    obstaclePrioritizationEngine.updateConfig(this.config);
    directionalGuidanceEngine.updateConfig(this.config);
    radarSyncSystem.updateConfig(this.config);

    if (this.guidanceTimer) {
      this.startGuidanceLoop();
    }
    if (this.radarTimer) {
      this.startRadarLoop();
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    this.stopGuidanceLoop();
    this.stopRadarLoop();
    this.stopNavigation();

    if (this.obstacleCleanup) { this.obstacleCleanup(); this.obstacleCleanup = null; }
    if (this.dangerCleanup) { this.dangerCleanup(); this.dangerCleanup = null; }
    if (this.accessibilityCleanup) { this.accessibilityCleanup(); this.accessibilityCleanup = null; }

    obstacleLifecycleManager.destroy();

    logger.info('[NavigationManager] Destroyed');
  }
}

export const navigationManager = new NavigationManager();
