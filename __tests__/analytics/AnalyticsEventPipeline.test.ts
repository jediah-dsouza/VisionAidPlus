import { AnalyticsEventPipeline } from '../../src/core/analytics/AnalyticsEventPipeline';
import type { AnalyticsEvent } from '../../src/core/analytics/types';

function makeEvent(overrides?: Partial<AnalyticsEvent>): Omit<AnalyticsEvent, 'id' | 'sequence'> {
  return {
    timestamp: Date.now(),
    category: 'safety',
    severity: 'info',
    source: 'system',
    eventType: 'test_event',
    sessionId: 'session-1',
    payload: {},
    metadata: {},
    ...overrides,
  };
}

describe('AnalyticsEventPipeline', () => {
  let pipeline: AnalyticsEventPipeline;

  beforeEach(() => {
    pipeline = new AnalyticsEventPipeline();
  });

  afterEach(() => {
    pipeline.destroy();
  });

  it('starts with sequence 0', () => {
    expect(pipeline.currentSequence).toBe(0);
  });

  it('ingests an event and assigns id and sequence', () => {
    const handler = jest.fn();
    pipeline.subscribe(handler);
    pipeline.ingest(makeEvent({ eventType: 'test' }));
    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as AnalyticsEvent;
    expect(event.id).toBeTruthy();
    expect(event.sequence).toBe(1);
  });

  it('increments sequence on each ingest', () => {
    const handler = jest.fn();
    pipeline.subscribe(handler);
    pipeline.ingest(makeEvent({ eventType: 'a' }));
    pipeline.ingest(makeEvent({ eventType: 'b' }));
    expect(handler.mock.calls[0][0].sequence).toBe(1);
    expect(handler.mock.calls[1][0].sequence).toBe(2);
  });

  it('delivers event to all subscribers', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    pipeline.subscribe(handler1);
    pipeline.subscribe(handler2);
    pipeline.ingest(makeEvent({ eventType: 'test' }));
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('supports unsubscribe', () => {
    const handler = jest.fn();
    const unsub = pipeline.subscribe(handler);
    unsub();
    pipeline.ingest(makeEvent({ eventType: 'test' }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not ingest after destroy', () => {
    const handler = jest.fn();
    pipeline.subscribe(handler);
    pipeline.destroy();
    pipeline.ingest(makeEvent({ eventType: 'test' }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('handles subscriber errors without crashing', () => {
    const bad = jest.fn().mockImplementation(() => { throw new Error('fail'); });
    const good = jest.fn();
    pipeline.subscribe(bad);
    pipeline.subscribe(good);
    pipeline.ingest(makeEvent({ eventType: 'test' }));
    expect(good).toHaveBeenCalledTimes(1);
  });

  it('destroy clears handlers and resets sequence', () => {
    pipeline.subscribe(jest.fn());
    pipeline.ingest(makeEvent({}));
    expect(pipeline.currentSequence).toBe(1);
    pipeline.destroy();
    expect((pipeline as any).handlers.size).toBe(0);
    expect((pipeline as any).sequence).toBe(0);
  });
});
