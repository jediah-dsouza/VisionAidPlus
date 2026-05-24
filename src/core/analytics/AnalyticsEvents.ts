export const ANALYTICS_EVENTS = {
  EVENT_INGESTED: 'analytics:eventIngested',
  BATCH_PROCESSED: 'analytics:batchProcessed',
  METRICS_UPDATED: 'analytics:metricsUpdated',
  RETENTION_PRUNED: 'analytics:retentionPruned',
  EXPORT_READY: 'analytics:exportReady',
  PERSISTENCE_WRITTEN: 'analytics:persistenceWritten',
  ERROR: 'analytics:error',
  SYNC_FLUSHED: 'analytics:syncFlushed',
  SESSION_STARTED: 'analytics:sessionStarted',
  SESSION_ENDED: 'analytics:sessionEnded',
  ALERT_HISTORY_UPDATED: 'analytics:alertHistoryUpdated',
  FILTER_CHANGED: 'analytics:filterChanged',
} as const;
