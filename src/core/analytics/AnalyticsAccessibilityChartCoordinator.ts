import type { ObstacleMetrics, SafetyMetrics, UsageMetrics } from './types';

export class AnalyticsAccessibilityChartCoordinator {
  private destroyed = false;

  constructor() {
    console.log('[AnalyticsAccessibility] Chart coordinator initialized');
  }

  summarizeObstacleTrend(metrics: ObstacleMetrics): string {
    if (this.destroyed) return '';

    const { timeSeries, totalDetections, peakDensity, densityWindowSeconds } = metrics;
    let peakTime = '';

    if (timeSeries.length > 0) {
      let maxCount = 0;
      let maxTimestamp = 0;
      for (const point of timeSeries) {
        if (point.count > maxCount) {
          maxCount = point.count;
          maxTimestamp = point.timestamp;
        }
      }
      if (maxTimestamp > 0) {
        const minutesAgo = Math.round((Date.now() - maxTimestamp) / 60000);
        peakTime = `, peak at ${minutesAgo} minutes`;
      }
    }

    return `Obstacle trend: ${totalDetections} obstacles in the last hour${peakTime}`;
  }

  summarizeSafetyTrend(metrics: SafetyMetrics): string {
    if (this.destroyed) return '';

    const { hazardCount, criticalAlerts, warnings, infoEvents, severityRatio } = metrics;

    const parts: string[] = [`Safety overview: ${hazardCount} hazards detected`];

    if (criticalAlerts > 0) {
      parts.push(`${criticalAlerts} critical alerts`);
    }
    if (warnings > 0) {
      parts.push(`${warnings} warnings`);
    }
    if (infoEvents > 0) {
      parts.push(`${infoEvents} information events`);
    }

    const criticalRatio = severityRatio.critical ?? 0;
    if (criticalRatio > 0) {
      const percentage = Math.round(criticalRatio * 100);
      parts.push(`${percentage}% critical severity ratio`);
    }

    return parts.join(', ');
  }

  summarizeUsagePattern(metrics: UsageMetrics): string {
    if (this.destroyed) return '';

    const { totalSessionDuration, featureActivationCounts, averageSessionLength, peakUsageHour } = metrics;

    const totalMinutes = Math.round(totalSessionDuration / 60000);
    const avgMinutes = Math.round(averageSessionLength / 60000);
    const featureCount = Object.keys(featureActivationCounts).length;
    const totalActivations = Object.values(featureActivationCounts).reduce((a, b) => a + b, 0);

    const hourStr = peakUsageHour !== undefined
      ? ` with peak usage around ${peakUsageHour}:00`
      : '';

    return `Usage pattern: ${totalMinutes} minutes total, ${avgMinutes} min average session, ${featureCount} features used ${totalActivations} times${hourStr}`;
  }

  destroy(): void {
    this.destroyed = true;
    console.log('[AnalyticsAccessibility] Destroyed');
  }
}
