import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  SafetyMetrics,
  ObstacleMetrics,
  UsageMetrics,
  SessionSummary,
  AlertRecord,
  AnalyticsFilter,
  AlertStatus,
} from '@core/analytics/types';

interface AnalyticsState {
  isActive: boolean;
  sessionId: string | null;
  metrics: {
    safety: SafetyMetrics | null;
    obstacles: ObstacleMetrics | null;
    usage: UsageMetrics | null;
    session: SessionSummary | null;
  };
  alertHistory: AlertRecord[];
  filter: AnalyticsFilter;
  exportProgress: {
    isExporting: boolean;
    progress: number;
    totalRecords: number;
    error: string | null;
  };
  lastSyncTimestamp: number;
  error: string | null;
}

const defaultFilter: AnalyticsFilter = {
  timeRange: { start: 0 },
  categories: [],
  severities: [],
  priorities: [],
  sources: [],
};

const initialState: AnalyticsState = {
  isActive: false,
  sessionId: null,
  metrics: {
    safety: null,
    obstacles: null,
    usage: null,
    session: null,
  },
  alertHistory: [],
  filter: { ...defaultFilter },
  exportProgress: {
    isExporting: false,
    progress: 0,
    totalRecords: 0,
    error: null,
  },
  lastSyncTimestamp: 0,
  error: null,
};

export const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setActive: (state, action: PayloadAction<boolean>) => {
      state.isActive = action.payload;
    },
    setSessionId: (state, action: PayloadAction<string | null>) => {
      state.sessionId = action.payload;
    },
    updateMetrics: (
      state,
      action: PayloadAction<{
        safety?: SafetyMetrics;
        obstacles?: ObstacleMetrics;
        usage?: UsageMetrics;
        session?: SessionSummary;
      }>,
    ) => {
      const m = action.payload;
      if (m.safety) state.metrics.safety = m.safety;
      if (m.obstacles) state.metrics.obstacles = m.obstacles;
      if (m.usage) state.metrics.usage = m.usage;
      if (m.session) state.metrics.session = m.session;
    },
    addAlert: (state, action: PayloadAction<AlertRecord>) => {
      const existingIndex = state.alertHistory.findIndex(
        a => a.id === action.payload.id,
      );
      if (existingIndex >= 0) {
        state.alertHistory[existingIndex] = action.payload;
      } else {
        state.alertHistory.push(action.payload);
      }
    },
    acknowledgeAlert: (state, action: PayloadAction<string>) => {
      const alert = state.alertHistory.find(a => a.id === action.payload);
      if (alert && alert.status === 'active') {
        alert.status = 'acknowledged';
        alert.acknowledgedAt = Date.now();
      }
    },
    resolveAlert: (state, action: PayloadAction<string>) => {
      const alert = state.alertHistory.find(a => a.id === action.payload);
      if (alert && alert.status !== 'dismissed') {
        alert.status = 'resolved';
        alert.resolvedAt = Date.now();
      }
    },
    dismissAlert: (state, action: PayloadAction<string>) => {
      const alert = state.alertHistory.find(a => a.id === action.payload);
      if (alert) {
        alert.status = 'dismissed';
      }
    },
    setFilter: (state, action: PayloadAction<Partial<AnalyticsFilter>>) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    resetFilter: state => {
      state.filter = { ...defaultFilter };
    },
    setExportProgress: (
      state,
      action: PayloadAction<{
        isExporting: boolean;
        progress: number;
        totalRecords: number;
        error: string | null;
      }>,
    ) => {
      state.exportProgress = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    syncTimestamp: state => {
      state.lastSyncTimestamp = Date.now();
    },
    resetState: () => initialState,
  },
});

export const analyticsActions = analyticsSlice.actions;
export default analyticsSlice.reducer;
