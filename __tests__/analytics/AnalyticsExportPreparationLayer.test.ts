import { AnalyticsExportPreparationLayer } from '../../src/core/analytics/AnalyticsExportPreparationLayer';
import type { AnalyticsEvent } from '../../src/core/analytics/types';

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

describe('AnalyticsExportPreparationLayer', () => {
  let exp: AnalyticsExportPreparationLayer;

  beforeEach(() => {
    exp = new AnalyticsExportPreparationLayer();
  });

  afterEach(() => {
    exp.destroy();
  });

  it('prepareExport returns valid ExportPayload', () => {
    const events = [makeEvent()];
    const payload = exp.prepareExport(events, { safety: null }, 'json');
    expect(payload.data).toHaveLength(1);
    expect(payload.format).toBe('json');
    expect(payload.recordCount).toBe(1);
    expect(payload.checksum).toBeTruthy();
    expect(payload.metadata.deviceId).toBe('unknown');
  });

  it('caps events at MAX_EXPORT_RECORDS', () => {
    const events = Array.from({ length: 6000 }, (_, i) => makeEvent({ sequence: i }));
    const payload = exp.prepareExport(events, {}, 'json');
    expect(payload.data).toHaveLength(5000);
  });

  it('toJson returns formatted JSON string', () => {
    const events = [makeEvent({ eventType: 'test' })];
    const payload = exp.prepareExport(events, {}, 'json');
    const json = exp.toJson(payload);
    const parsed = JSON.parse(json);
    expect(parsed.data).toHaveLength(1);
    expect(parsed.data[0].eventType).toBe('test');
  });

  it('toCsv returns CSV string with headers', () => {
    const event = makeEvent({ eventType: 'obstacle', category: 'obstacle', duration: 100 });
    const payload = exp.prepareExport([event], {}, 'csv');
    const csv = exp.toCsv(payload);
    expect(csv).toContain('id,timestamp,category,severity,source');
    expect(csv).toContain('obstacle');
  });

  it('toCsv escapes special characters', () => {
    const event = makeEvent({ eventType: 'test,1', payload: { description: 'hello "world"' } });
    const payload = exp.prepareExport([event], {}, 'csv');
    const csv = exp.toCsv(payload);
    expect(csv).toContain('"');
  });

  it('throws on prepareExport when destroyed', () => {
    exp.destroy();
    expect(() => exp.prepareExport([], {}, 'json')).toThrow('Cannot prepare export on destroyed layer');
  });

  it('toJson returns empty when destroyed', () => {
    exp.destroy();
    expect(exp.toJson({} as any)).toBe('');
  });

  it('toCsv returns empty when destroyed', () => {
    exp.destroy();
    expect(exp.toCsv({} as any)).toBe('');
  });
});
