import type { AnalyticsEvent, SessionSummary, SessionSegment } from './types';
import { AnalyticsAggregationEngine } from './AnalyticsAggregationEngine';

export class SessionSummaryGenerator extends AnalyticsAggregationEngine {
  private currentSession: SessionSummary | null = null;
  private confidenceSum = 0;
  private confidenceCount = 0;

  constructor() {
    super('session_summary');
    console.log('[AnalyticsSessionSummary] Created');
  }

  processEvent(event: AnalyticsEvent): void {
    if (!this.currentSession) return;

    this.trackEvent(() => {
      const session = this.currentSession!;

      if (event.category === 'obstacle') {
        session.totalDetections++;
        session.totalObstacles++;
      } else if (event.category === 'safety' || event.category === 'alert') {
        session.totalAlerts++;
        if (event.severity === 'critical') {
          session.criticalEvents++;
        }
      }

      const confidence = event.payload?.confidence as number | undefined;
      if (typeof confidence === 'number') {
        this.confidenceSum += confidence;
        this.confidenceCount++;
        session.averageConfidence = this.confidenceSum / this.confidenceCount;
      }

      if (session.startTime > 0) {
        session.duration = Date.now() - session.startTime;
      }

      this.memoryEstimateBytes = 256;
    });
  }

  snapshot(): SessionSummary | null {
    if (!this.currentSession) return null;

    return {
      ...this.currentSession,
      duration: this.currentSession.startTime > 0
        ? Date.now() - this.currentSession.startTime
        : this.currentSession.duration,
      segments: [...this.currentSession.segments],
    };
  }

  reset(): void {
    this.currentSession = null;
    this.confidenceSum = 0;
    this.confidenceCount = 0;
    this.memoryEstimateBytes = 0;
    console.log('[AnalyticsSessionSummary] Reset');
  }

  startSession(sessionId: string): void {
    this.currentSession = {
      sessionId,
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      totalDetections: 0,
      totalAlerts: 0,
      totalObstacles: 0,
      criticalEvents: 0,
      averageConfidence: 0,
      activeDuration: 0,
      isActive: true,
      segments: [],
    };
    this.confidenceSum = 0;
    this.confidenceCount = 0;
    console.log(`[AnalyticsSessionSummary] Session started: ${sessionId}`);
  }

  endSession(): SessionSummary | null {
    if (!this.currentSession) return null;

    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
    this.currentSession.isActive = false;
    this.currentSession.activeDuration = this.currentSession.duration;

    const summary: SessionSummary = {
      ...this.currentSession,
      segments: [...this.currentSession.segments],
    };

    console.log(
      `[AnalyticsSessionSummary] Session ended: ${summary.sessionId} (${summary.duration}ms, ${summary.totalDetections} detections)`,
    );

    this.reset();
    return summary;
  }

  destroy(): void {
    this.reset();
    super.destroy();
    console.log('[AnalyticsSessionSummary] Destroyed');
  }
}
