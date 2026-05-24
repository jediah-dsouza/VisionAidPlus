import type { AnalyticsEvent, AnalyticsAggregateMetrics, ExportFormat, ExportPayload } from './types';

const MAX_EXPORT_RECORDS = 5000;

function computeChecksum(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export class AnalyticsExportPreparationLayer {
  private destroyed = false;

  constructor() {
    console.log('[AnalyticsExport] Export layer initialized');
  }

  prepareExport(
    events: AnalyticsEvent[],
    aggregates: Partial<AnalyticsAggregateMetrics>,
    format: ExportFormat,
  ): ExportPayload {
    if (this.destroyed) {
      throw new Error('[AnalyticsExport] Cannot prepare export on destroyed layer');
    }

    const cappedEvents = events.slice(0, MAX_EXPORT_RECORDS);
    const rawData = JSON.stringify(cappedEvents);
    const checksum = computeChecksum(rawData);

    console.log(`[AnalyticsExport] Prepared export: ${cappedEvents.length} records, format=${format}`);

    return {
      data: cappedEvents,
      aggregates,
      format,
      timestamp: Date.now(),
      recordCount: cappedEvents.length,
      checksum,
      metadata: {
        deviceId: 'unknown',
        appVersion: '1.0.0',
        sessionId: '',
        exportTimestamp: Date.now(),
      },
    };
  }

  toJson(payload: ExportPayload): string {
    if (this.destroyed) return '';
    return JSON.stringify(payload, null, 2);
  }

  toCsv(payload: ExportPayload): string {
    if (this.destroyed) return '';

    const rows: string[] = [];
    const headers = [
      'id', 'timestamp', 'category', 'severity', 'source',
      'eventType', 'sessionId', 'sequence', 'payload', 'duration', 'metadata',
    ];
    rows.push(headers.join(','));

    for (const event of payload.data as AnalyticsEvent[]) {
      const row = [
        this.escapeCsv(event.id),
        String(event.timestamp),
        event.category,
        event.severity,
        event.source,
        this.escapeCsv(event.eventType),
        event.sessionId,
        String(event.sequence),
        this.escapeCsv(JSON.stringify(event.payload)),
        event.duration !== undefined ? String(event.duration) : '',
        this.escapeCsv(JSON.stringify(event.metadata ?? {})),
      ];
      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  private escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  destroy(): void {
    this.destroyed = true;
    console.log('[AnalyticsExport] Destroyed');
  }
}
