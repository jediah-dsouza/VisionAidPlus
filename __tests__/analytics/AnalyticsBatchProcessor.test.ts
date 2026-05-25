import { AnalyticsBatchProcessor } from '../../src/core/analytics/AnalyticsBatchProcessor';
import type { AnalyticsEvent } from '../../src/core/analytics/types';

function makeEvent(seq: number): AnalyticsEvent {
  return {
    id: `evt_${seq}`,
    timestamp: Date.now(),
    category: 'safety',
    severity: 'info',
    source: 'system',
    eventType: 'test',
    sessionId: 's1',
    sequence: seq,
    payload: {},
  };
}

describe('AnalyticsBatchProcessor', () => {
  let processor: AnalyticsBatchProcessor;

  afterEach(() => {
    jest.useRealTimers();
    processor.destroy();
  });

  it('starts with empty queue', () => {
    processor = new AnalyticsBatchProcessor({ batchSize: 50, batchIntervalMs: 1000 });
    expect(processor.getQueueDepth()).toBe(0);
    expect(processor.totalFlushes).toBe(0);
  });

  it('enqueues events up to batch size', () => {
    processor = new AnalyticsBatchProcessor({ batchSize: 10, batchIntervalMs: 10000 });
    for (let i = 1; i <= 5; i++) {
      processor.enqueue(makeEvent(i));
    }
    expect(processor.getQueueDepth()).toBe(5);
  });

  it('flushes immediately when batch size reached', () => {
    const onBatchReady = jest.fn();
    processor = new AnalyticsBatchProcessor({ batchSize: 3, batchIntervalMs: 10000 });
    processor.onBatchReady = onBatchReady;
    processor.enqueue(makeEvent(1));
    processor.enqueue(makeEvent(2));
    expect(onBatchReady).not.toHaveBeenCalled();
    processor.enqueue(makeEvent(3));
    expect(onBatchReady).toHaveBeenCalledTimes(1);
    expect(onBatchReady.mock.calls[0][0]).toHaveLength(3);
  });

  it('flushes on interval when batch is not full', () => {
    jest.useFakeTimers();
    const onBatchReady = jest.fn();
    processor = new AnalyticsBatchProcessor({ batchSize: 10, batchIntervalMs: 50 });
    processor.onBatchReady = onBatchReady;
    processor.enqueue(makeEvent(1));
    processor.enqueue(makeEvent(2));
    expect(onBatchReady).not.toHaveBeenCalled();
    jest.advanceTimersByTime(60);
    expect(onBatchReady).toHaveBeenCalledTimes(1);
    expect(onBatchReady.mock.calls[0][0]).toHaveLength(2);
  });

  it('drops events when queue is full and flushes the first batch', () => {
    processor = new AnalyticsBatchProcessor({ batchSize: 2, batchIntervalMs: 10000 });
    processor.onBatchReady = () => {};
    processor.enqueue(makeEvent(1));
    processor.enqueue(makeEvent(2));
    processor.enqueue(makeEvent(3));
    expect(processor.totalFlushes).toBe(1);
  });

  it('flush() returns batch and resets timer', () => {
    jest.useFakeTimers();
    processor = new AnalyticsBatchProcessor({ batchSize: 10, batchIntervalMs: 100 });
    processor.enqueue(makeEvent(1));
    const batch = processor.flush();
    expect(batch).toHaveLength(1);
    expect(processor.getQueueDepth()).toBe(0);
    jest.advanceTimersByTime(200);
    expect(processor.totalFlushes).toBe(1);
  });

  it('does not enqueue after destroy', () => {
    processor = new AnalyticsBatchProcessor();
    processor.destroy();
    processor.enqueue(makeEvent(1));
    expect(processor.getQueueDepth()).toBe(0);
  });

  it('does not call onBatchReady if null', () => {
    jest.useFakeTimers();
    processor = new AnalyticsBatchProcessor({ batchSize: 2, batchIntervalMs: 50 });
    processor.enqueue(makeEvent(1));
    processor.enqueue(makeEvent(2));
    jest.advanceTimersByTime(60);
  });

  it('tracks flush count', () => {
    processor = new AnalyticsBatchProcessor({ batchSize: 2, batchIntervalMs: 10000 });
    processor.onBatchReady = () => {};
    processor.enqueue(makeEvent(1));
    processor.enqueue(makeEvent(2));
    expect(processor.totalFlushes).toBe(1);
    processor.enqueue(makeEvent(3));
    processor.enqueue(makeEvent(4));
    expect(processor.totalFlushes).toBe(2);
  });
});
