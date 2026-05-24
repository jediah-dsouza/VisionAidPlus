import type { AnalyticsEvent, AlertRecord, AlertStatus } from './types';
import type { DetectionPriority } from '@core/camera/types';
import { AnalyticsAggregationEngine } from './AnalyticsAggregationEngine';

const MAX_ALERTS = 1000;
const DEDUP_WINDOW_MS = 3000;

export class AlertHistoryManager extends AnalyticsAggregationEngine {
  private buffer: AlertRecord[] = [];
  private dedupTimestamps: Map<string, number> = new Map();
  private dedupCounts: Map<string, number> = new Map();
  private totalEventCount = 0;

  constructor() {
    super('alert_history');
    console.log('[AnalyticsAlertHistory] Created');
  }

  processEvent(event: AnalyticsEvent): void {
    this.trackEvent(() => {
      const dedupGroup = (event.payload?.dedupGroup as string) || event.id;
      const lastTimestamp = this.dedupTimestamps.get(dedupGroup);

      if (lastTimestamp !== undefined && event.timestamp - lastTimestamp < DEDUP_WINDOW_MS) {
        this.dedupCounts.set(dedupGroup, (this.dedupCounts.get(dedupGroup) || 1) + 1);
        this.totalEventCount++;
        return;
      }

      const record: AlertRecord = {
        id: event.id,
        timestamp: event.timestamp,
        category: event.category,
        severity: event.severity,
        priority: (event.payload?.priority as DetectionPriority) || 'normal',
        source: event.source,
        detectionType: (event.payload?.detectionType as import('@core/camera/types').DetectionType) || null,
        title: (event.payload?.title as string) || event.eventType,
        description: (event.payload?.description as string) || '',
        status: 'active' as AlertStatus,
        acknowledgedAt: null,
        resolvedAt: null,
        duration: event.duration ?? null,
        dedupGroup,
        sequence: event.sequence,
        metadata: { ...(event.metadata || {}), dedupCount: this.dedupCounts.get(dedupGroup) || 0 },
      };

      this.buffer.push(record);
      this.dedupTimestamps.set(dedupGroup, event.timestamp);
      this.dedupCounts.set(dedupGroup, 1);
      this.totalEventCount++;

      if (this.buffer.length > MAX_ALERTS) {
        const removed = this.buffer.shift();
        if (removed) {
          this.dedupTimestamps.delete(removed.dedupGroup);
          this.dedupCounts.delete(removed.dedupGroup);
        }
      }

      this.memoryEstimateBytes = this.buffer.length * 256;
    });
  }

  snapshot(): { alerts: AlertRecord[]; count: number } {
    return {
      alerts: [...this.buffer],
      count: this.totalEventCount,
    };
  }

  reset(): void {
    this.buffer = [];
    this.dedupTimestamps.clear();
    this.dedupCounts.clear();
    this.totalEventCount = 0;
    this.memoryEstimateBytes = 0;
    console.log('[AnalyticsAlertHistory] Reset');
  }

  acknowledgeAlert(id: string): void {
    const record = this.buffer.find(r => r.id === id);
    if (record && record.status === 'active') {
      record.status = 'acknowledged';
      record.acknowledgedAt = Date.now();
    }
  }

  resolveAlert(id: string): void {
    const record = this.buffer.find(r => r.id === id);
    if (record && (record.status === 'active' || record.status === 'acknowledged')) {
      record.status = 'resolved';
      record.resolvedAt = Date.now();
    }
  }

  dismissAlert(id: string): void {
    const record = this.buffer.find(r => r.id === id);
    if (record) {
      record.status = 'dismissed';
    }
  }

  getActiveAlerts(): AlertRecord[] {
    return this.buffer.filter(r => r.status === 'active' || r.status === 'acknowledged');
  }

  getCriticalAlerts(): AlertRecord[] {
    return this.buffer.filter(r => r.severity === 'critical');
  }

  getRecentAlerts(limit?: number): AlertRecord[] {
    const reversed = [...this.buffer].reverse();
    return limit !== undefined ? reversed.slice(0, limit) : reversed;
  }

  destroy(): void {
    this.reset();
    super.destroy();
    console.log('[AnalyticsAlertHistory] Destroyed');
  }
}
