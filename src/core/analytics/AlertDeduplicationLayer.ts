import type { AlertRecord } from './types';

interface DedupConfig {
  windowMs: number;
}

const DEFAULT_DEDUP_CONFIG: DedupConfig = {
  windowMs: 3000,
};

export class AlertDeduplicationLayer {
  private config: DedupConfig;
  private dedupMap: Map<string, number> = new Map();
  private destroyed = false;

  constructor(config?: Partial<DedupConfig>) {
    this.config = { ...DEFAULT_DEDUP_CONFIG, ...config };
    console.log('[AnalyticsAlertDedup] Deduplication layer initialized');
  }

  isDuplicate(alert: AlertRecord): boolean {
    if (this.destroyed) return false;

    const lastTimestamp = this.dedupMap.get(alert.dedupGroup);
    if (lastTimestamp === undefined) return false;

    return (alert.timestamp - lastTimestamp) < this.config.windowMs;
  }

  register(alert: AlertRecord): void {
    if (this.destroyed) return;

    const lastTimestamp = this.dedupMap.get(alert.dedupGroup);
    if (lastTimestamp !== undefined && (alert.timestamp - lastTimestamp) < this.config.windowMs) {
      console.log(`[AnalyticsAlertDedup] Duplicate alert suppressed for group: ${alert.dedupGroup}`);
      return;
    }

    this.dedupMap.set(alert.dedupGroup, alert.timestamp);
  }

  clear(): void {
    if (this.destroyed) return;
    this.dedupMap.clear();
    console.log('[AnalyticsAlertDedup] Dedup map cleared');
  }

  getMapSize(): number {
    return this.dedupMap.size;
  }

  destroy(): void {
    this.destroyed = true;
    this.dedupMap.clear();
    console.log('[AnalyticsAlertDedup] Destroyed');
  }
}
