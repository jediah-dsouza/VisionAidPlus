import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@app/store';
import { analyticsSlice } from '@app/store/slices/analyticsSlice';
import type { AlertRecord, AnalyticsFilter } from '@core/analytics/types';

export function useAnalyticsMetrics() {
  return useAppSelector(state => state.analytics?.metrics ?? {
    safety: null,
    obstacles: null,
    usage: null,
    session: null,
  });
}

export function useAlertHistory(limit?: number): AlertRecord[] {
  const alertHistory = useAppSelector(state => state.analytics?.alertHistory ?? []);
  return useMemo(() => {
    if (limit && limit > 0) {
      return alertHistory.slice(-limit);
    }
    return alertHistory;
  }, [alertHistory, limit]);
}

export function useAnalyticsFilter() {
  const filter = useAppSelector(state => {
    if (!state.analytics?.filter) {
      return { timeRange: { start: 0 }, categories: [], severities: [], priorities: [], sources: [] };
    }
    return state.analytics.filter;
  });
  const dispatch = useAppDispatch();
  const setFilter = useCallback(
    (patch: Partial<AnalyticsFilter>) => {
      dispatch(analyticsSlice.actions.setFilter(patch));
    },
    [dispatch],
  );
  const resetFilter = useCallback(() => {
    dispatch(analyticsSlice.actions.resetFilter());
  }, [dispatch]);
  return { filter, setFilter, resetFilter };
}

export function useExportAnalytics() {
  const exportProgress = useAppSelector(state => state.analytics?.exportProgress ?? {
    isExporting: false,
    progress: 0,
    totalRecords: 0,
    error: null,
  });
  const dispatch = useAppDispatch();
  const startExport = useCallback(
    (totalRecords: number) => {
      dispatch(
        analyticsSlice.actions.setExportProgress({
          isExporting: true,
          progress: 0,
          totalRecords,
          error: null,
        }),
      );
    },
    [dispatch],
  );
  const cancelExport = useCallback(() => {
    dispatch(
      analyticsSlice.actions.setExportProgress({
        isExporting: false,
        progress: 0,
        totalRecords: 0,
        error: 'Cancelled',
      }),
    );
  }, [dispatch]);
  return { ...exportProgress, startExport, cancelExport };
}

export function useAnalyticsSession() {
  const isActive = useAppSelector(state => state.analytics?.isActive ?? false);
  const sessionId = useAppSelector(state => state.analytics?.sessionId ?? null);
  const session = useAppSelector(state => state.analytics?.metrics.session ?? null);
  const duration = session?.duration ?? 0;
  return { sessionId, isActive, duration };
}

export function useAnalyticsFilteredEvents(filter: AnalyticsFilter): AlertRecord[] {
  const alertHistory = useAppSelector(state => state.analytics?.alertHistory ?? []);
  return useMemo(() => {
    return alertHistory.filter(alert => {
      if (filter.timeRange.start > 0 && alert.timestamp < filter.timeRange.start) {
        return false;
      }
      if (filter.timeRange.end && alert.timestamp > filter.timeRange.end) {
        return false;
      }
      if (filter.categories.length > 0 && !filter.categories.includes(alert.category)) {
        return false;
      }
      if (filter.severities.length > 0 && !filter.severities.includes(alert.severity)) {
        return false;
      }
      if (filter.priorities.length > 0 && !filter.priorities.includes(alert.priority)) {
        return false;
      }
      if (filter.sources.length > 0 && !filter.sources.includes(alert.source)) {
        return false;
      }
      if (filter.textSearch) {
        const q = filter.textSearch.toLowerCase();
        if (
          !alert.title.toLowerCase().includes(q) &&
          !alert.description.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [alertHistory, filter]);
}
