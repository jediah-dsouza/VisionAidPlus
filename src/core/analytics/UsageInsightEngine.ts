import type { AnalyticsEvent, UsageMetrics } from './types';
import { AnalyticsAggregationEngine } from './AnalyticsAggregationEngine';

interface SessionDuration {
  sessionId: string;
  startTime: number;
  endTime?: number;
}

export class UsageInsightEngine extends AnalyticsAggregationEngine {
  private featureActivationCounts: Record<string, number> = {};
  private sessions: Map<string, SessionDuration> = new Map();
  private completedSessionLengths: number[] = [];
  private usageByHour: Record<number, number> = {};
  private lastUpdated = 0;

  constructor() {
    super('usage_insight');
    console.log('[AnalyticsUsageEngine] Created');
  }

  processEvent(event: AnalyticsEvent): void {
    this.trackEvent(() => {
      this.featureActivationCounts[event.eventType] = (this.featureActivationCounts[event.eventType] || 0) + 1;

      const eventDate = new Date(event.timestamp);
      const hour = eventDate.getHours();
      this.usageByHour[hour] = (this.usageByHour[hour] || 0) + 1;

      if (event.eventType === 'session_start' || event.eventType === 'session_started') {
        if (!this.sessions.has(event.sessionId)) {
          this.sessions.set(event.sessionId, {
            sessionId: event.sessionId,
            startTime: event.timestamp,
          });
        }
      } else if (event.eventType === 'session_end' || event.eventType === 'session_ended') {
        const session = this.sessions.get(event.sessionId);
        if (session && !session.endTime) {
          session.endTime = event.timestamp;
          const duration = session.endTime - session.startTime;
          if (duration > 0) {
            this.completedSessionLengths.push(duration);
          }
        }
      }

      this.lastUpdated = Date.now();
      this.memoryEstimateBytes =
        Object.keys(this.featureActivationCounts).length * 32 +
        this.sessions.size * 64 +
        this.completedSessionLengths.length * 8 +
        Object.keys(this.usageByHour).length * 16;
    });
  }

  snapshot(): UsageMetrics {
    const averageSessionLength = this.completedSessionLengths.length > 0
      ? this.completedSessionLengths.reduce((sum, d) => sum + d, 0) / this.completedSessionLengths.length
      : 0;

    let peakUsageHour = 0;
    let peakCount = 0;
    for (const [hourStr, count] of Object.entries(this.usageByHour)) {
      const h = Number(hourStr);
      if (count > peakCount) {
        peakCount = count;
        peakUsageHour = h;
      }
    }

    let totalSessionDuration = this.completedSessionLengths.reduce((sum, d) => sum + d, 0);
    for (const session of this.sessions.values()) {
      if (!session.endTime) {
        totalSessionDuration += Date.now() - session.startTime;
      }
    }

    return {
      totalSessionDuration,
      featureActivationCounts: { ...this.featureActivationCounts },
      averageSessionLength,
      peakUsageHour,
      usageByHour: { ...this.usageByHour },
      lastUpdated: this.lastUpdated,
    };
  }

  reset(): void {
    this.featureActivationCounts = {};
    this.sessions.clear();
    this.completedSessionLengths = [];
    this.usageByHour = {};
    this.lastUpdated = 0;
    this.memoryEstimateBytes = 0;
    console.log('[AnalyticsUsageEngine] Reset');
  }

  destroy(): void {
    this.reset();
    super.destroy();
    console.log('[AnalyticsUsageEngine] Destroyed');
  }
}
