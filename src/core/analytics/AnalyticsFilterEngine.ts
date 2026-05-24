import type { AnalyticsEvent, AnalyticsFilter } from './types';

const MAX_RESULTS = 500;

export class AnalyticsFilterEngine {
  private destroyed = false;

  constructor() {
    console.log('[AnalyticsFilter] Engine initialized');
  }

  execute(events: AnalyticsEvent[], filter: AnalyticsFilter): AnalyticsEvent[] {
    if (this.destroyed) return [];

    const results: AnalyticsEvent[] = [];

    for (const event of events) {
      if (this.match(event, filter)) {
        results.push(event);
        if (results.length >= MAX_RESULTS) break;
      }
    }

    console.log(`[AnalyticsFilter] Filter executed: ${results.length} results (capped at ${MAX_RESULTS})`);
    return results;
  }

  match(event: AnalyticsEvent, filter: AnalyticsFilter): boolean {
    if (this.destroyed) return false;

    if (event.timestamp < filter.timeRange.start) return false;
    if (filter.timeRange.end !== undefined && event.timestamp > filter.timeRange.end) return false;

    if (!filter.categories.includes(event.category)) return false;
    if (!filter.severities.includes(event.severity)) return false;
    if (!filter.priorities.includes(event.priority as any)) return false;
    if (!filter.sources.includes(event.source)) return false;

    if (filter.textSearch) {
      const searchLower = filter.textSearch.toLowerCase();
      const eventTypeLower = event.eventType.toLowerCase();
      const payloadStr = JSON.stringify(event.payload).toLowerCase();

      if (
        !eventTypeLower.includes(searchLower) &&
        !payloadStr.includes(searchLower)
      ) {
        return false;
      }
    }

    return true;
  }

  destroy(): void {
    this.destroyed = true;
    console.log('[AnalyticsFilter] Destroyed');
  }
}
