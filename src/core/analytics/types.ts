import type { DetectionType, DetectionPriority } from '@core/camera/types';

export type AnalyticsCategory =
  | 'safety'
  | 'obstacle'
  | 'usage'
  | 'alert'
  | 'session'
  | 'performance';

export type AnalyticsSeverity = 'info' | 'warning' | 'critical';

export type AnalyticsSource =
  | 'voice'
  | 'ble'
  | 'emergency'
  | 'navigation'
  | 'ai'
  | 'safety'
  | 'system';

export interface AnalyticsEvent {
  id: string;
  timestamp: number;
  category: AnalyticsCategory;
  severity: AnalyticsSeverity;
  source: AnalyticsSource;
  eventType: string;
  sessionId: string;
  sequence: number;
  payload: Record<string, unknown>;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface AlertRecord {
  id: string;
  timestamp: number;
  category: AnalyticsCategory;
  severity: AnalyticsSeverity;
  priority: DetectionPriority;
  source: AnalyticsSource;
  detectionType: DetectionType | null;
  title: string;
  description: string;
  status: AlertStatus;
  acknowledgedAt: number | null;
  resolvedAt: number | null;
  duration: number | null;
  dedupGroup: string;
  sequence: number;
  metadata: Record<string, unknown>;
}

export interface ObstacleMetrics {
  totalDetections: number;
  typeDistribution: Partial<Record<DetectionType, number>>;
  distanceHistogram: Array<{ range: string; count: number }>;
  directionDistribution: Partial<Record<string, number>>;
  averageConfidence: number;
  peakDensity: number;
  densityWindowSeconds: number;
  timeSeries: Array<{ timestamp: number; count: number }>;
  lastUpdated: number;
}

export interface SafetyMetrics {
  hazardCount: number;
  criticalAlerts: number;
  warnings: number;
  infoEvents: number;
  responseTimeAverageMs: number;
  responseTimeP95Ms: number;
  severityRatio: Record<AnalyticsSeverity, number>;
  timeSeries: Array<{ timestamp: number; severity: AnalyticsSeverity; count: number }>;
  lastUpdated: number;
}

export interface UsageMetrics {
  totalSessionDuration: number;
  featureActivationCounts: Record<string, number>;
  averageSessionLength: number;
  peakUsageHour: number;
  usageByHour: Record<number, number>;
  lastUpdated: number;
}

export interface SessionSummary {
  sessionId: string;
  startTime: number;
  endTime: number | null;
  duration: number;
  totalDetections: number;
  totalAlerts: number;
  totalObstacles: number;
  criticalEvents: number;
  averageConfidence: number;
  activeDuration: number;
  isActive: boolean;
  segments: SessionSegment[];
}

export interface SessionSegment {
  segmentId: string;
  startTime: number;
  endTime: number;
  detectionCount: number;
  alertCount: number;
  obstacleCount: number;
  metrics: Record<string, number>;
}

export interface AnalyticsAggregateMetrics {
  safety: SafetyMetrics;
  obstacles: ObstacleMetrics;
  usage: UsageMetrics;
  session: SessionSummary | null;
  lastUpdated: number;
}

export interface AnalyticsFilter {
  timeRange: {
    start: number;
    end?: number;
  };
  categories: AnalyticsCategory[];
  severities: AnalyticsSeverity[];
  priorities: DetectionPriority[];
  sources: AnalyticsSource[];
  textSearch?: string;
}

export type ExportFormat = 'json' | 'csv';

export interface ExportPayload {
  data: AnalyticsEvent[] | AlertRecord[];
  aggregates: Partial<AnalyticsAggregateMetrics>;
  format: ExportFormat;
  timestamp: number;
  recordCount: number;
  checksum: string;
  metadata: {
    deviceId: string;
    appVersion: string;
    sessionId: string;
    exportTimestamp: number;
  };
}

export interface PerformanceMetrics {
  totalEventsIngested: number;
  eventsPerSecond: number;
  averageProcessingTimeMs: number;
  peakProcessingTimeMs: number;
  batchCount: number;
  averageBatchSize: number;
  droppedEvents: number;
  memoryEstimateBytes: number;
  lastTickDuration: number;
  uptimeMs: number;
}

export interface PersistenceState {
  lastSyncTimestamp: number;
  pendingWrites: number;
  totalWrites: number;
  totalReads: number;
  storageSizeEstimate: number;
  lastError: string | null;
}

export interface AnalyticsRuntimeState {
  isActive: boolean;
  sessionId: string | null;
  aggregatedMetrics: AnalyticsAggregateMetrics;
  performance: PerformanceMetrics;
  persistence: PersistenceState;
  filter: AnalyticsFilter;
  alertHistory: AlertRecord[];
  exportProgress: {
    isExporting: boolean;
    progress: number;
    totalRecords: number;
    error: string | null;
  };
  lastSyncTimestamp: number;
  error: string | null;
}

export type AnalyticsPipelineEvent =
  | { type: 'ANALYTICS_EVENT_INGESTED'; event: AnalyticsEvent }
  | { type: 'ANALYTICS_BATCH_PROCESSED'; batchSize: number; durationMs: number }
  | { type: 'ANALYTICS_METRICS_UPDATED'; metrics: AnalyticsAggregateMetrics }
  | { type: 'ANALYTICS_RETENTION_PRUNED'; prunedCount: number }
  | { type: 'ANALYTICS_EXPORT_READY'; payload: ExportPayload }
  | { type: 'ANALYTICS_PERSISTENCE_WRITTEN'; key: string; size: number }
  | { type: 'ANALYTICS_ERROR'; error: string; context: unknown }
  | { type: 'ANALYTICS_SYNC_FLUSHED'; metricsCount: number }
  | { type: 'ANALYTICS_SESSION_STARTED'; sessionId: string }
  | { type: 'ANALYTICS_SESSION_ENDED'; sessionId: string; summary: SessionSummary };

export interface EngineMetrics {
  engineName: string;
  eventCount: number;
  lastProcessedAt: number;
  memoryEstimateBytes: number;
  processingTimeMs: number;
}
