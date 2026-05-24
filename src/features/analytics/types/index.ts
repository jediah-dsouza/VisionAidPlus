import type { AlertRecord } from '@core/analytics/types';

export type {
  AnalyticsCategory,
  AnalyticsSeverity,
  AnalyticsSource,
  AnalyticsEvent,
  AlertStatus,
  AlertRecord,
  ObstacleMetrics,
  SafetyMetrics,
  UsageMetrics,
  SessionSummary,
  SessionSegment,
  AnalyticsAggregateMetrics,
  AnalyticsFilter,
  ExportFormat,
  ExportPayload,
  PerformanceMetrics,
  PersistenceState,
  AnalyticsRuntimeState,
  AnalyticsPipelineEvent,
  EngineMetrics,
} from '@core/analytics/types';

export type WidgetSize = 'compact' | 'full';

export type WidgetId = 'safety' | 'obstacles' | 'usage' | 'alerts' | 'session';

export interface AnalyticsWidgetConfig {
  id: WidgetId;
  size: WidgetSize;
  order: number;
}

export interface AlertGroup {
  date: string;
  alerts: AlertRecord[];
}

export interface ChartDataset {
  labels: string[];
  values: number[];
  color?: string;
}
