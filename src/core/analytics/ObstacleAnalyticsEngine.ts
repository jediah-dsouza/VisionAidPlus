import type { AnalyticsEvent, ObstacleMetrics } from './types';
import type { DetectionType } from '@core/camera/types';
import { AnalyticsAggregationEngine } from './AnalyticsAggregationEngine';

const MAX_TIME_SERIES = 100;
const DENSITY_WINDOW_SECONDS = 60;

type DistanceBucket =
  | '0-0.5m'
  | '0.5-1m'
  | '1-2m'
  | '2-5m'
  | '5-10m'
  | '10m+';

interface TimeSeriesEntry {
  timestamp: number;
  count: number;
}

function mapDistanceToBucket(distance: number): DistanceBucket {
  if (distance <= 0.5) return '0-0.5m';
  if (distance <= 1) return '0.5-1m';
  if (distance <= 2) return '1-2m';
  if (distance <= 5) return '2-5m';
  if (distance <= 10) return '5-10m';
  return '10m+';
}

export class ObstacleAnalyticsEngine extends AnalyticsAggregationEngine {
  private totalDetections = 0;
  private typeDistribution: Partial<Record<DetectionType, number>> = {};
  private distanceHistogram: Map<DistanceBucket, number> = new Map();
  private directionDistribution: Partial<Record<string, number>> = {};
  private confidenceSum = 0;
  private confidenceCount = 0;
  private timeSeries: TimeSeriesEntry[] = [];
  private lastUpdated = 0;

  constructor() {
    super('obstacle_analytics');
    console.log('[AnalyticsObstacleEngine] Created');
  }

  processEvent(event: AnalyticsEvent): void {
    if (event.category !== 'obstacle' && event.source !== 'ai') return;

    this.trackEvent(() => {
      this.totalDetections++;

      const detectionType = event.payload?.detectionType as DetectionType | undefined;
      if (detectionType) {
        this.typeDistribution[detectionType] = (this.typeDistribution[detectionType] || 0) + 1;
      }

      const distance = event.payload?.distance as number | undefined;
      if (typeof distance === 'number') {
        const bucket = mapDistanceToBucket(distance);
        this.distanceHistogram.set(bucket, (this.distanceHistogram.get(bucket) || 0) + 1);
      }

      const direction = event.payload?.direction as string | undefined;
      if (direction) {
        this.directionDistribution[direction] = (this.directionDistribution[direction] || 0) + 1;
      }

      const confidence = event.payload?.confidence as number | undefined;
      if (typeof confidence === 'number') {
        this.confidenceSum += confidence;
        this.confidenceCount++;
      }

      const last = this.timeSeries[this.timeSeries.length - 1];
      if (last && event.timestamp - last.timestamp < 1000) {
        last.count++;
      } else {
        this.timeSeries.push({ timestamp: event.timestamp, count: 1 });
      }

      while (this.timeSeries.length > MAX_TIME_SERIES) {
        this.timeSeries.shift();
      }

      this.lastUpdated = Date.now();
      this.memoryEstimateBytes =
        Object.keys(this.typeDistribution).length * 32 +
        this.distanceHistogram.size * 32 +
        Object.keys(this.directionDistribution).length * 32 +
        this.timeSeries.length * 24;
    });
  }

  snapshot(): ObstacleMetrics {
    const distanceHistogram: Array<{ range: string; count: number }> = [];
    for (const [range, count] of this.distanceHistogram.entries()) {
      distanceHistogram.push({ range, count });
    }

    return {
      totalDetections: this.totalDetections,
      typeDistribution: { ...this.typeDistribution },
      distanceHistogram,
      directionDistribution: { ...this.directionDistribution },
      averageConfidence: this.confidenceCount > 0 ? this.confidenceSum / this.confidenceCount : 0,
      peakDensity: this.calculatePeakDensity(),
      densityWindowSeconds: DENSITY_WINDOW_SECONDS,
      timeSeries: [...this.timeSeries],
      lastUpdated: this.lastUpdated,
    };
  }

  private calculatePeakDensity(): number {
    if (this.timeSeries.length === 0) return 0;
    let maxDetections = 0;
    for (let i = 0; i < this.timeSeries.length; i++) {
      let windowSum = 0;
      const windowStart = this.timeSeries[i].timestamp;
      for (let j = i; j < this.timeSeries.length; j++) {
        if (this.timeSeries[j].timestamp - windowStart <= DENSITY_WINDOW_SECONDS * 1000) {
          windowSum += this.timeSeries[j].count;
        } else {
          break;
        }
      }
      if (windowSum > maxDetections) maxDetections = windowSum;
    }
    return maxDetections;
  }

  reset(): void {
    this.totalDetections = 0;
    this.typeDistribution = {};
    this.distanceHistogram.clear();
    this.directionDistribution = {};
    this.confidenceSum = 0;
    this.confidenceCount = 0;
    this.timeSeries = [];
    this.lastUpdated = 0;
    this.memoryEstimateBytes = 0;
    console.log('[AnalyticsObstacleEngine] Reset');
  }

  destroy(): void {
    this.reset();
    super.destroy();
    console.log('[AnalyticsObstacleEngine] Destroyed');
  }
}
