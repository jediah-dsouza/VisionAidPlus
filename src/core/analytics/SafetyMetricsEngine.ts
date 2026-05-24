import type { AnalyticsEvent, SafetyMetrics, AnalyticsSeverity } from './types';
import { AnalyticsAggregationEngine } from './AnalyticsAggregationEngine';

const HAZARD_WINDOW_MS = 5 * 60 * 1000;
const MAX_TIME_SERIES = 100;
const P95_THRESHOLD = 0.95;

interface ResponseTimeRecord {
  timestamp: number;
  duration: number;
}

interface TimeSeriesEntry {
  timestamp: number;
  severity: AnalyticsSeverity;
  count: number;
}

export class SafetyMetricsEngine extends AnalyticsAggregationEngine {
  private hazardCount = 0;
  private criticalAlerts = 0;
  private warnings = 0;
  private infoEvents = 0;
  private responseTimes: ResponseTimeRecord[] = [];
  private readonly timeSeries: TimeSeriesEntry[] = [];
  private lastUpdated = 0;

  constructor() {
    super('safety_metrics');
    console.log('[AnalyticsSafetyEngine] Created');
  }

  processEvent(event: AnalyticsEvent): void {
    this.trackEvent(() => {
      if (event.severity === 'critical') {
        this.criticalAlerts++;
        this.hazardCount++;
      } else if (event.severity === 'warning') {
        this.warnings++;
        this.hazardCount++;
      } else if (event.severity === 'info') {
        this.infoEvents++;
      }

      if (typeof event.duration === 'number') {
        this.responseTimes.push({ timestamp: event.timestamp, duration: event.duration });
      }

      const last = this.timeSeries[this.timeSeries.length - 1];
      if (last && event.timestamp - last.timestamp < 1000 && last.severity === event.severity) {
        last.count++;
      } else {
        this.timeSeries.push({ timestamp: event.timestamp, severity: event.severity, count: 1 });
      }

      this.pruneWindow();

      this.lastUpdated = Date.now();
      this.memoryEstimateBytes =
        this.responseTimes.length * 24 + this.timeSeries.length * 48;
    });
  }

  private pruneWindow(): void {
    const cutoff = Date.now() - HAZARD_WINDOW_MS;

    this.responseTimes = this.responseTimes.filter(r => r.timestamp >= cutoff);

    while (this.timeSeries.length > MAX_TIME_SERIES) {
      this.timeSeries.shift();
    }

    let hazardTotal = 0;
    for (const entry of this.timeSeries) {
      if (entry.timestamp >= cutoff && (entry.severity === 'critical' || entry.severity === 'warning')) {
        hazardTotal += entry.count;
      }
    }
    this.hazardCount = hazardTotal;
  }

  private calculateP95(): number {
    if (this.responseTimes.length === 0) return 0;
    const sorted = [...this.responseTimes].sort((a, b) => a.duration - b.duration);
    const index = Math.ceil(P95_THRESHOLD * sorted.length) - 1;
    return sorted[Math.max(0, index)].duration;
  }

  snapshot(): SafetyMetrics {
    const responseTimeCount = this.responseTimes.length;
    const responseTimeTotal = this.responseTimes.reduce((sum, r) => sum + r.duration, 0);

    const cutoff = Date.now() - HAZARD_WINDOW_MS;
    const windowEvents = this.timeSeries.filter(e => e.timestamp >= cutoff);
    let sevCritical = 0;
    let sevWarning = 0;
    let sevInfo = 0;
    for (const e of windowEvents) {
      if (e.severity === 'critical') sevCritical += e.count;
      else if (e.severity === 'warning') sevWarning += e.count;
      else if (e.severity === 'info') sevInfo += e.count;
    }
    const windowTotal = sevCritical + sevWarning + sevInfo || 1;

    return {
      hazardCount: this.hazardCount,
      criticalAlerts: this.criticalAlerts,
      warnings: this.warnings,
      infoEvents: this.infoEvents,
      responseTimeAverageMs: responseTimeCount > 0 ? responseTimeTotal / responseTimeCount : 0,
      responseTimeP95Ms: this.calculateP95(),
      severityRatio: {
        critical: sevCritical / windowTotal,
        warning: sevWarning / windowTotal,
        info: sevInfo / windowTotal,
      },
      timeSeries: [...this.timeSeries],
      lastUpdated: this.lastUpdated,
    };
  }

  reset(): void {
    this.hazardCount = 0;
    this.criticalAlerts = 0;
    this.warnings = 0;
    this.infoEvents = 0;
    this.responseTimes = [];
    this.timeSeries.length = 0;
    this.lastUpdated = 0;
    this.memoryEstimateBytes = 0;
    console.log('[AnalyticsSafetyEngine] Reset');
  }

  destroy(): void {
    this.reset();
    super.destroy();
    console.log('[AnalyticsSafetyEngine] Destroyed');
  }
}
