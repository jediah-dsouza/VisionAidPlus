import { AnalyticsFilterEngine } from '../../src/core/analytics/AnalyticsFilterEngine';
import type { AnalyticsEvent, AnalyticsFilter } from '../../src/core/analytics/types';

const ALL_CATEGORIES: AnalyticsEvent['category'][] = ['safety', 'obstacle', 'usage', 'alert', 'session', 'performance'];
const ALL_SEVERITIES: AnalyticsEvent['severity'][] = ['info', 'warning', 'critical'];
const ALL_SOURCES: AnalyticsEvent['source'][] = ['voice', 'ble', 'emergency', 'navigation', 'ai', 'safety', 'system'];

const matchAll: AnalyticsFilter = {
  timeRange: { start: 0 },
  categories: ALL_CATEGORIES,
  severities: ALL_SEVERITIES,
  priorities: ['critical', 'high', 'normal', 'low', 'background'],
  sources: ALL_SOURCES,
};

function makeEvent(overrides?: Partial<AnalyticsEvent>): AnalyticsEvent {
  return {
    id: `evt_${Math.random()}`,
    timestamp: Date.now(),
    category: 'safety',
    severity: 'info',
    source: 'system',
    eventType: 'test',
    sessionId: 's1',
    sequence: 1,
    payload: {},
    ...overrides,
  };
}

describe('AnalyticsFilterEngine', () => {
  let engine: AnalyticsFilterEngine;

  beforeEach(() => {
    engine = new AnalyticsFilterEngine();
  });

  afterEach(() => {
    engine.destroy();
  });

  it('returns all events when filter matches everything', () => {
    const events = [makeEvent({ eventType: 'a' }), makeEvent({ eventType: 'b' })];
    const results = engine.execute(events, matchAll);
    expect(results).toHaveLength(2);
  });

  it('filters by timeRange start', () => {
    const now = Date.now();
    const events = [makeEvent({ timestamp: now - 10000 }), makeEvent({ timestamp: now })];
    const filter = { ...matchAll, timeRange: { start: now - 5000 } };
    expect(engine.execute(events, filter)).toHaveLength(1);
  });

  it('filters by timeRange end', () => {
    const now = Date.now();
    const events = [makeEvent({ timestamp: now - 1000 }), makeEvent({ timestamp: now + 10000 })];
    const filter = { ...matchAll, timeRange: { start: 0, end: now + 5000 } };
    expect(engine.execute(events, filter)).toHaveLength(1);
  });

  it('filters by categories', () => {
    const events = [makeEvent({ category: 'safety' }), makeEvent({ category: 'obstacle' })];
    const filter = { ...matchAll, categories: ['obstacle' as AnalyticsEvent['category']] };
    expect(engine.execute(events, filter)).toHaveLength(1);
  });

  it('filters by severities', () => {
    const events = [makeEvent({ severity: 'critical' }), makeEvent({ severity: 'info' })];
    const filter = { ...matchAll, severities: ['critical' as AnalyticsEvent['severity']] };
    expect(engine.execute(events, filter)).toHaveLength(1);
  });

  it('filters by sources', () => {
    const events = [makeEvent({ source: 'ai' }), makeEvent({ source: 'system' })];
    const filter = { ...matchAll, sources: ['ai' as AnalyticsEvent['source']] };
    expect(engine.execute(events, filter)).toHaveLength(1);
  });

  it('filters by textSearch (matches eventType)', () => {
    const events = [makeEvent({ eventType: 'obstacle_detected' }), makeEvent({ eventType: 'heartbeat' })];
    const filter = { ...matchAll, textSearch: 'obstacle' };
    expect(engine.execute(events, filter)).toHaveLength(1);
  });

  it('filters by textSearch (matches payload)', () => {
    const events = [makeEvent({ payload: { danger: true } }), makeEvent({ payload: { normal: true } })];
    const filter = { ...matchAll, textSearch: 'danger' };
    expect(engine.execute(events, filter)).toHaveLength(1);
  });

  it('caps results at MAX_RESULTS', () => {
    const events = Array.from({ length: 600 }, (_, i) => makeEvent({ eventType: `e${i}`, timestamp: Date.now() + i }));
    expect(engine.execute(events, matchAll)).toHaveLength(500);
  });

  it('match returns false for destroyed engine', () => {
    engine.destroy();
    expect(engine.match(makeEvent(), matchAll)).toBe(false);
  });

  it('execute returns empty when destroyed', () => {
    engine.destroy();
    expect(engine.execute([makeEvent()], matchAll)).toEqual([]);
  });
});
