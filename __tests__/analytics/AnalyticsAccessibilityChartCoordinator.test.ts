import { AnalyticsAccessibilityChartCoordinator } from '../../src/core/analytics/AnalyticsAccessibilityChartCoordinator';
import type { ObstacleMetrics, SafetyMetrics, UsageMetrics } from '../../src/core/analytics/types';

describe('AnalyticsAccessibilityChartCoordinator', () => {
  let coord: AnalyticsAccessibilityChartCoordinator;

  beforeEach(() => {
    coord = new AnalyticsAccessibilityChartCoordinator();
  });

  afterEach(() => {
    coord.destroy();
  });

  it('summarizeObstacleTrend returns string', () => {
    const metrics: ObstacleMetrics = {
      totalDetections: 42,
      typeDistribution: {},
      distanceHistogram: [],
      directionDistribution: {},
      averageConfidence: 0.8,
      peakDensity: 5,
      densityWindowSeconds: 60,
      timeSeries: [{ timestamp: Date.now() - 60000, count: 10 }],
      lastUpdated: Date.now(),
    };
    const summary = coord.summarizeObstacleTrend(metrics);
    expect(summary).toContain('42');
    expect(summary).toContain('obstacle');
  });

  it('summarizeSafetyTrend includes hazard count', () => {
    const metrics: SafetyMetrics = {
      hazardCount: 5,
      criticalAlerts: 2,
      warnings: 3,
      infoEvents: 1,
      responseTimeAverageMs: 100,
      responseTimeP95Ms: 200,
      severityRatio: { critical: 0.4, warning: 0.4, info: 0.2 },
      timeSeries: [],
      lastUpdated: Date.now(),
    };
    const summary = coord.summarizeSafetyTrend(metrics);
    expect(summary).toContain('5');
    expect(summary).toContain('hazard');
    expect(summary).toContain('critical');
  });

  it('summarizeSafetyTrend omits zero counts', () => {
    const metrics: SafetyMetrics = {
      hazardCount: 0, criticalAlerts: 0, warnings: 0, infoEvents: 0,
      responseTimeAverageMs: 0, responseTimeP95Ms: 0,
      severityRatio: { critical: 0, warning: 0, info: 0 },
      timeSeries: [],
      lastUpdated: 0,
    };
    const summary = coord.summarizeSafetyTrend(metrics);
    expect(summary).toContain('0 hazards');
  });

  it('summarizeUsagePattern includes session duration', () => {
    const metrics: UsageMetrics = {
      totalSessionDuration: 3600000,
      featureActivationCounts: { navigation: 5, voice: 3 },
      averageSessionLength: 600000,
      peakUsageHour: 14,
      usageByHour: { 14: 10 },
      lastUpdated: Date.now(),
    };
    const summary = coord.summarizeUsagePattern(metrics);
    expect(summary).toContain('60');
    expect(summary).toContain('minutes');
    expect(summary).toContain('2 features');
  });

  it('returns empty string when destroyed', () => {
    coord.destroy();
    const metrics = { totalDetections: 0 } as ObstacleMetrics;
    expect(coord.summarizeObstacleTrend(metrics)).toBe('');
  });
});
