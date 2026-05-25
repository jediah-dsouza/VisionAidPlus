import { AlertHistoryManager } from '../../src/core/analytics/AlertHistoryManager';
import type { AnalyticsEvent } from '../../src/core/analytics/types';

function makeAlertEvent(overrides?: Partial<AnalyticsEvent>): AnalyticsEvent {
  return {
    id: `alert_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    category: 'safety',
    severity: 'warning',
    source: 'system',
    eventType: 'test_alert',
    sessionId: 's1',
    sequence: 1,
    payload: {},
    ...overrides,
  };
}

describe('AlertHistoryManager', () => {
  let manager: AlertHistoryManager;

  beforeEach(() => {
    manager = new AlertHistoryManager();
  });

  afterEach(() => {
    manager.destroy();
  });

  it('starts empty', () => {
    const snap = manager.snapshot();
    expect(snap.alerts).toHaveLength(0);
    expect(snap.count).toBe(0);
  });

  it('processes event and creates alert record', () => {
    manager.processEvent(makeAlertEvent({ eventType: 'danger', severity: 'critical' }));
    const snap = manager.snapshot();
    expect(snap.alerts).toHaveLength(1);
    expect(snap.alerts[0].status).toBe('active');
    expect(snap.alerts[0].severity).toBe('critical');
  });

  it('deduplicates identical dedupGroup within window', () => {
    const ts = Date.now();
    const group = 'hazard-001';
    const base = makeAlertEvent({ timestamp: ts, payload: { dedupGroup: group } });
    const dup = makeAlertEvent({ timestamp: ts + 100, id: 'dup1', payload: { dedupGroup: group } });
    manager.processEvent(base);
    manager.processEvent(dup);
    expect(manager.snapshot().alerts).toHaveLength(1);
    expect(manager.snapshot().count).toBe(2);
  });

  it('allows separate dedupGroup as separate records', () => {
    manager.processEvent(makeAlertEvent({ timestamp: Date.now(), payload: { dedupGroup: 'a' } }));
    manager.processEvent(makeAlertEvent({ timestamp: Date.now(), payload: { dedupGroup: 'b' } }));
    expect(manager.snapshot().alerts).toHaveLength(2);
  });

  it('acknowledgeAlert changes status', () => {
    const event = makeAlertEvent();
    manager.processEvent(event);
    const id = manager.snapshot().alerts[0].id;
    manager.acknowledgeAlert(id);
    const alert = manager.snapshot().alerts.find(a => a.id === id);
    expect(alert?.status).toBe('acknowledged');
    expect(alert?.acknowledgedAt).toBeGreaterThan(0);
  });

  it('resolveAlert changes status', () => {
    manager.processEvent(makeAlertEvent());
    const id = manager.snapshot().alerts[0].id;
    manager.resolveAlert(id);
    expect(manager.snapshot().alerts.find(a => a.id === id)?.status).toBe('resolved');
  });

  it('dismissAlert changes status', () => {
    manager.processEvent(makeAlertEvent());
    const id = manager.snapshot().alerts[0].id;
    manager.dismissAlert(id);
    expect(manager.snapshot().alerts.find(a => a.id === id)?.status).toBe('dismissed');
  });

  it('getActiveAlerts returns active and acknowledged', () => {
    manager.processEvent(makeAlertEvent({ id: 'a1', payload: { title: 'active' } }));
    const activeId = manager.snapshot().alerts[0].id;
    manager.processEvent(makeAlertEvent({ id: 'a2', payload: { title: 'resolved' } }));
    const resolveId = manager.snapshot().alerts[1].id;
    manager.resolveAlert(resolveId);
    expect(manager.getActiveAlerts()).toHaveLength(1);
    expect(manager.getActiveAlerts()[0].id).toBe(activeId);
  });

  it('getCriticalAlerts returns critical severity only', () => {
    manager.processEvent(makeAlertEvent({ id: 'c1', severity: 'critical' }));
    manager.processEvent(makeAlertEvent({ id: 'w1', severity: 'warning' }));
    expect(manager.getCriticalAlerts()).toHaveLength(1);
  });

  it('getRecentAlerts returns most recent first', () => {
    for (let i = 0; i < 5; i++) {
      manager.processEvent(makeAlertEvent({ sequence: i, timestamp: Date.now() + i }));
    }
    const recent = manager.getRecentAlerts(2);
    expect(recent).toHaveLength(2);
  });

  it('caps buffer at MAX_ALERTS and evicts oldest', () => {
    for (let i = 0; i < 1001; i++) {
      manager.processEvent(makeAlertEvent({ sequence: i, timestamp: Date.now() + i }));
    }
    expect(manager.snapshot().alerts.length).toBeLessThanOrEqual(1000);
  });

  it('reset clears everything', () => {
    manager.processEvent(makeAlertEvent());
    manager.reset();
    expect(manager.snapshot().alerts).toHaveLength(0);
    expect(manager.snapshot().count).toBe(0);
  });
});
