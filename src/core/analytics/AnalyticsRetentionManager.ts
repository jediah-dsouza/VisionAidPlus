import { HistoricalEventIndexer } from './HistoricalEventIndexer';

interface RetentionConfig {
  alertTtlMs: number;
  aggregateTtlMs: number;
  sessionTtlMs: number;
}

const DEFAULT_RETENTION_CONFIG: RetentionConfig = {
  alertTtlMs: 7 * 24 * 3600 * 1000,
  aggregateTtlMs: 30 * 24 * 3600 * 1000,
  sessionTtlMs: 90 * 24 * 3600 * 1000,
};

const MAX_PINNED_ALERTS = 1000;
const PRUNE_INTERVAL_MS = 5 * 60 * 1000;

export class AnalyticsRetentionManager {
  private config: RetentionConfig;
  private indexer: HistoricalEventIndexer;
  private customTtls: Map<string, number> = new Map();
  private pinnedAlertIds: Set<string> = new Set();
  private pruneTimer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;

  constructor(indexer: HistoricalEventIndexer, config?: Partial<RetentionConfig>) {
    this.indexer = indexer;
    this.config = { ...DEFAULT_RETENTION_CONFIG, ...config };
    console.log('[AnalyticsRetention] Manager initialized');

    this.prune();
    this.startAutoPrune();
  }

  prune(): number {
    if (this.destroyed) return 0;

    const now = Date.now();
    let totalPruned = 0;

    const cutoffByTtl = (ttlMs: number): number => {
      const cutoff = now - ttlMs;
      const allOld = this.indexer.query(e => e.timestamp < cutoff);
      const prunable = allOld.filter(e => !this.pinnedAlertIds.has(e.id));
      for (const event of prunable) {
        this.indexer.removeOlderThan(event.timestamp + 1);
      }
      return prunable.length;
    };

    for (const [, ttlMs] of this.customTtls) {
      totalPruned += cutoffByTtl(ttlMs);
    }

    totalPruned += cutoffByTtl(this.config.alertTtlMs);
    totalPruned += cutoffByTtl(this.config.aggregateTtlMs);
    totalPruned += cutoffByTtl(this.config.sessionTtlMs);

    if (this.pinnedAlertIds.size > MAX_PINNED_ALERTS) {
      const excess = this.pinnedAlertIds.size - MAX_PINNED_ALERTS;
      const entries = Array.from(this.pinnedAlertIds);
      for (let i = 0; i < excess && i < entries.length; i++) {
        this.pinnedAlertIds.delete(entries[i]);
      }
      console.log(`[AnalyticsRetention] Trimmed ${excess} pinned alerts to maintain cap`);
    }

    console.log(`[AnalyticsRetention] Pruned ${totalPruned} records`);
    return totalPruned;
  }

  setCustomTtl(category: string, ttlMs: number): void {
    if (this.destroyed) return;
    this.customTtls.set(category, ttlMs);
    console.log(`[AnalyticsRetention] Custom TTL set for ${category}: ${ttlMs}ms`);
  }

  pinAlert(alertId: string): void {
    this.pinnedAlertIds.add(alertId);
    if (this.pinnedAlertIds.size > MAX_PINNED_ALERTS) {
      const first = this.pinnedAlertIds.values().next().value;
      if (first !== undefined) {
        this.pinnedAlertIds.delete(first);
      }
    }
  }

  unpinAlert(alertId: string): void {
    this.pinnedAlertIds.delete(alertId);
  }

  private startAutoPrune(): void {
    this.pruneTimer = setInterval(() => {
      this.prune();
    }, PRUNE_INTERVAL_MS);
  }

  destroy(): void {
    this.destroyed = true;
    if (this.pruneTimer !== null) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = null;
    }
    this.customTtls.clear();
    this.pinnedAlertIds.clear();
    console.log('[AnalyticsRetention] Destroyed');
  }
}
