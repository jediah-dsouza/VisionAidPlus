import type { AnalyticsEvent } from './types';

interface ListNode {
  event: AnalyticsEvent;
  prev: ListNode | null;
  next: ListNode | null;
}

const MAX_ENTRIES = 10_000;
const SPATIAL_REBUILD_INTERVAL = 500;

export class HistoricalEventIndexer {
  private head: ListNode | null = null;
  private tail: ListNode | null = null;
  private count = 0;
  private insertsSinceRebuild = 0;
  private destroyed = false;

  constructor() {
    console.log(`[AnalyticsIndexer] Created (max ${MAX_ENTRIES} entries)`);
  }

  append(event: AnalyticsEvent): void {
    if (this.destroyed) {
      console.warn('[AnalyticsIndexer] Cannot append to destroyed indexer');
      return;
    }

    if (this.count >= MAX_ENTRIES) {
      this.evictOldest();
    }

    const node: ListNode = { event, prev: null, next: null };

    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      node.prev = this.tail;
      if (this.tail) {
        this.tail.next = node;
      }
      this.tail = node;
    }

    this.count++;
    this.insertsSinceRebuild++;

    if (this.insertsSinceRebuild >= SPATIAL_REBUILD_INTERVAL) {
      this.rebuildSpatialIndex();
      this.insertsSinceRebuild = 0;
    }
  }

  query(
    predicate: (e: AnalyticsEvent) => boolean,
    limit?: number,
  ): AnalyticsEvent[] {
    if (this.destroyed) return [];

    const results: AnalyticsEvent[] = [];
    let current = this.tail;

    while (current) {
      if (predicate(current.event)) {
        results.push(current.event);
        if (limit !== undefined && results.length >= limit) break;
      }
      current = current.prev;
    }

    console.log(`[AnalyticsIndexer] Query returned ${results.length} results`);
    return results;
  }

  removeOlderThan(timestamp: number): number {
    if (this.destroyed || !this.head) return 0;

    let removed = 0;
    let current: ListNode | null = this.head;

    while (current && current.event.timestamp < timestamp) {
      const next = current.next;
      this.unlinkNode(current);
      removed++;
      current = next;
    }

    if (removed > 0) {
      console.log(`[AnalyticsIndexer] Removed ${removed} events older than ${timestamp}`);
    }

    return removed;
  }

  clear(): void {
    this.head = null;
    this.tail = null;
    this.count = 0;
    this.insertsSinceRebuild = 0;
    console.log('[AnalyticsIndexer] Cleared all events');
  }

  getCount(): number {
    return this.count;
  }

  private evictOldest(): void {
    if (!this.head) return;

    const evicted = this.head.event;
    this.unlinkNode(this.head);
    console.log(
      `[AnalyticsIndexer] Evicted oldest event #${evicted.sequence} (max ${MAX_ENTRIES} reached)`,
    );
  }

  private unlinkNode(node: ListNode): void {
    const prev = node.prev;
    const next = node.next;

    if (prev) {
      prev.next = next;
    } else {
      this.head = next;
    }

    if (next) {
      next.prev = prev;
    } else {
      this.tail = prev;
    }

    node.prev = null;
    node.next = null;
    this.count--;
  }

  private rebuildSpatialIndex(): void {
    const eventTypes = new Map<string, number>();
    const categories = new Set<string>();
    let current = this.head;

    while (current) {
      const key = `${current.event.category}:${current.event.eventType}`;
      eventTypes.set(key, (eventTypes.get(key) ?? 0) + 1);
      categories.add(current.event.category);
      current = current.next;
    }

    console.log(
      `[AnalyticsIndexer] Rebuilt spatial index: ${eventTypes.size} type variants, ${categories.size} categories, ${this.count} entries`,
    );
  }

  destroy(): void {
    this.destroyed = true;
    this.clear();
    console.log('[AnalyticsIndexer] Destroyed');
  }
}

export const historicalEventIndexer = new HistoricalEventIndexer();
