import type { AnalyticsAggregateMetrics, SessionSummary, SessionSegment } from './types';
import type { AnalyticsAggregationEngine } from './AnalyticsAggregationEngine';
import { ANALYTICS_EVENTS } from './AnalyticsEvents';

interface SessionCoordinatorConfig {
  onSessionStart?: (sessionId: string) => void;
  onSessionEnd?: (summary: SessionSummary) => void;
}

export class SessionAnalyticsCoordinator {
  private engines: AnalyticsAggregationEngine[] = [];
  private isActive = false;
  private activeSessionId: string | null = null;
  private sessionStartTime = 0;
  private destroyed = false;
  private config: SessionCoordinatorConfig;

  constructor(config: SessionCoordinatorConfig = {}) {
    this.config = config;
    console.log('[AnalyticsSessionCoord] Coordinator initialized');
  }

  registerEngine(engine: AnalyticsAggregationEngine): void {
    if (this.destroyed) return;
    this.engines.push(engine);
  }

  startSession(sessionId: string): void {
    if (this.destroyed) {
      console.warn('[AnalyticsSessionCoord] Cannot start session on destroyed coordinator');
      return;
    }

    if (this.isActive) {
      console.warn('[AnalyticsSessionCoord] Session already active, ending first');
      this.endSession();
    }

    this.activeSessionId = sessionId;
    this.isActive = true;
    this.sessionStartTime = Date.now();

    for (const engine of this.engines) {
      engine.reset();
    }

    console.log(`[AnalyticsSessionCoord] Session started: ${sessionId}`);
    this.config.onSessionStart?.(sessionId);
  }

  endSession(): SessionSummary | null {
    if (this.destroyed || !this.isActive || !this.activeSessionId) {
      console.warn('[AnalyticsSessionCoord] No active session to end');
      return null;
    }

    const summary = this.buildSummary();
    this.isActive = false;
    this.activeSessionId = null;

    console.log(`[AnalyticsSessionCoord] Session ended`);
    this.config.onSessionEnd?.(summary);

    return summary;
  }

  getActiveSessionId(): string | null {
    return this.activeSessionId;
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  private buildSummary(): SessionSummary {
    const endTime = Date.now();
    const duration = endTime - this.sessionStartTime;

    let totalDetections = 0;
    let totalAlerts = 0;
    let totalObstacles = 0;
    let criticalEvents = 0;
    let averageConfidence = 0;

    for (const engine of this.engines) {
      const metrics = engine.getMetrics();
      totalDetections += metrics.eventCount;
    }

    for (const engine of this.engines) {
      const snap = engine.snapshot();
      if (typeof snap.totalAlerts === 'number') totalAlerts += snap.totalAlerts;
      if (typeof snap.totalObstacles === 'number') totalObstacles += snap.totalObstacles;
      if (typeof snap.criticalEvents === 'number') criticalEvents += snap.criticalEvents;
      if (typeof snap.averageConfidence === 'number') averageConfidence = snap.averageConfidence;
    }

    const segments: SessionSegment[] = [];

    return {
      sessionId: this.activeSessionId ?? '',
      startTime: this.sessionStartTime,
      endTime,
      duration,
      totalDetections,
      totalAlerts,
      totalObstacles,
      criticalEvents,
      averageConfidence,
      activeDuration: duration,
      isActive: false,
      segments,
    };
  }

  destroy(): void {
    this.destroyed = true;
    this.engines = [];
    this.isActive = false;
    this.activeSessionId = null;
    this.sessionStartTime = 0;
    console.log('[AnalyticsSessionCoord] Destroyed');
  }
}
