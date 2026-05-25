import type { AnalyticsEvent } from '../../src/core/analytics/types';
import analyticsReducer, { analyticsActions } from '../../src/app/store/slices/analyticsSlice';

describe('analyticsSlice', () => {
  const initialState = analyticsReducer(undefined, { type: 'init' });

  it('has correct initial state', () => {
    expect(initialState.isActive).toBe(false);
    expect(initialState.sessionId).toBeNull();
    expect(initialState.metrics.safety).toBeNull();
    expect(initialState.metrics.obstacles).toBeNull();
    expect(initialState.metrics.usage).toBeNull();
    expect(initialState.metrics.session).toBeNull();
    expect(initialState.alertHistory).toEqual([]);
    expect(initialState.filter.timeRange).toEqual({ start: 0 });
    expect(initialState.exportProgress.isExporting).toBe(false);
    expect(initialState.lastSyncTimestamp).toBe(0);
    expect(initialState.error).toBeNull();
  });

  it('handles setActive', () => {
    const state = analyticsReducer(initialState, analyticsActions.setActive(true));
    expect(state.isActive).toBe(true);
  });

  it('handles setSessionId', () => {
    const state = analyticsReducer(initialState, analyticsActions.setSessionId('session-1'));
    expect(state.sessionId).toBe('session-1');
  });

  it('handles setSessionId null', () => {
    const withSession = analyticsReducer(initialState, analyticsActions.setSessionId('s1'));
    const cleared = analyticsReducer(withSession, analyticsActions.setSessionId(null));
    expect(cleared.sessionId).toBeNull();
  });

  it('handles updateMetrics with safety', () => {
    const safetyMetrics = { hazardCount: 5, criticalAlerts: 2, warnings: 3, infoEvents: 1, responseTimeAverageMs: 100, responseTimeP95Ms: 200, severityRatio: { critical: 0.5, warning: 0.3, info: 0.2 }, timeSeries: [], lastUpdated: Date.now() };
    const state = analyticsReducer(initialState, analyticsActions.updateMetrics({ safety: safetyMetrics }));
    expect(state.metrics.safety).toEqual(safetyMetrics);
    expect(state.metrics.obstacles).toBeNull();
  });

  it('handles updateMetrics with all fields', () => {
    const payload = {
      safety: { hazardCount: 1 } as any,
      obstacles: { totalDetections: 10 } as any,
      usage: { totalSessionDuration: 1000 } as any,
      session: { sessionId: 's1' } as any,
    };
    const state = analyticsReducer(initialState, analyticsActions.updateMetrics(payload));
    expect(state.metrics.safety).toEqual(payload.safety);
    expect(state.metrics.obstacles).toEqual(payload.obstacles);
    expect(state.metrics.usage).toEqual(payload.usage);
    expect(state.metrics.session).toEqual(payload.session);
  });

  const makeAlert = (overrides = {}) => ({
    id: 'a1', title: '', status: 'active' as const, timestamp: Date.now(),
    category: 'safety' as AnalyticsEvent['category'], severity: 'warning' as AnalyticsEvent['severity'],
    priority: 'normal' as const, source: 'system' as AnalyticsEvent['source'],
    detectionType: null, description: '', acknowledgedAt: null, resolvedAt: null,
    duration: null, dedupGroup: 'g1', sequence: 1, metadata: {},
    ...overrides,
  });

  it('handles addAlert (new)', () => {
    const alert = makeAlert({ title: 'Test' });
    const state = analyticsReducer(initialState, analyticsActions.addAlert(alert));
    expect(state.alertHistory).toHaveLength(1);
    expect(state.alertHistory[0].id).toBe('a1');
  });

  it('handles addAlert (update existing)', () => {
    const alert = makeAlert({ title: 'Test' });
    const state1 = analyticsReducer(initialState, analyticsActions.addAlert(alert));
    const updated = { ...alert, status: 'resolved' as const, resolvedAt: Date.now() };
    const state2 = analyticsReducer(state1, analyticsActions.addAlert(updated));
    expect(state2.alertHistory).toHaveLength(1);
    expect(state2.alertHistory[0].status).toBe('resolved');
    expect(state2.alertHistory[0].resolvedAt).toBeGreaterThan(0);
  });

  it('handles acknowledgeAlert', () => {
    const alert = makeAlert();
    const withAlert = analyticsReducer(initialState, analyticsActions.addAlert(alert));
    const state = analyticsReducer(withAlert, analyticsActions.acknowledgeAlert('a1'));
    expect(state.alertHistory[0].status).toBe('acknowledged');
  });

  it('acknowledgeAlert ignores dismissed alerts', () => {
    const alert = makeAlert({ status: 'dismissed' });
    const withAlert = analyticsReducer(initialState, analyticsActions.addAlert(alert));
    const state = analyticsReducer(withAlert, analyticsActions.acknowledgeAlert('a1'));
    expect(state.alertHistory[0].status).toBe('dismissed');
  });

  it('handles resolveAlert', () => {
    const alert = makeAlert();
    const withAlert = analyticsReducer(initialState, analyticsActions.addAlert(alert));
    const state = analyticsReducer(withAlert, analyticsActions.resolveAlert('a1'));
    expect(state.alertHistory[0].status).toBe('resolved');
  });

  it('handles dismissAlert', () => {
    const alert = makeAlert();
    const withAlert = analyticsReducer(initialState, analyticsActions.addAlert(alert));
    const state = analyticsReducer(withAlert, analyticsActions.dismissAlert('a1'));
    expect(state.alertHistory[0].status).toBe('dismissed');
  });

  it('handles setFilter', () => {
    const state = analyticsReducer(initialState, analyticsActions.setFilter({ categories: ['safety'] }));
    expect(state.filter.categories).toEqual(['safety']);
  });

  it('handles resetFilter', () => {
    const withFilter = analyticsReducer(initialState, analyticsActions.setFilter({ categories: ['safety'] }));
    const state = analyticsReducer(withFilter, analyticsActions.resetFilter());
    expect(state.filter.categories).toEqual([]);
    expect(state.filter.timeRange).toEqual({ start: 0 });
  });

  it('handles setExportProgress', () => {
    const state = analyticsReducer(initialState, analyticsActions.setExportProgress({ isExporting: true, progress: 50, totalRecords: 100, error: null }));
    expect(state.exportProgress.isExporting).toBe(true);
    expect(state.exportProgress.progress).toBe(50);
  });

  it('handles setError', () => {
    const state = analyticsReducer(initialState, analyticsActions.setError('Something went wrong'));
    expect(state.error).toBe('Something went wrong');
  });

  it('handles setError null', () => {
    const withError = analyticsReducer(initialState, analyticsActions.setError('err'));
    const cleared = analyticsReducer(withError, analyticsActions.setError(null));
    expect(cleared.error).toBeNull();
  });

  it('handles syncTimestamp', () => {
    const before = Date.now();
    const state = analyticsReducer(initialState, analyticsActions.syncTimestamp());
    expect(state.lastSyncTimestamp).toBeGreaterThanOrEqual(before);
  });

  it('handles resetState', () => {
    const modified = analyticsReducer(initialState, analyticsActions.setActive(true));
    modified.metrics.safety = { hazardCount: 5 } as any;
    const reset = analyticsReducer(modified, analyticsActions.resetState());
    expect(reset).toEqual(initialState);
  });
});
