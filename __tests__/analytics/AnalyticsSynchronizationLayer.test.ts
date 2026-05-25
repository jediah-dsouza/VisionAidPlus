import { AnalyticsSynchronizationLayer } from '../../src/core/analytics/AnalyticsSynchronizationLayer';

describe('AnalyticsSynchronizationLayer', () => {
  let sync: AnalyticsSynchronizationLayer;

  afterEach(() => {
    jest.useRealTimers();
    sync.destroy();
  });

  it('starts with empty buffer', () => {
    sync = new AnalyticsSynchronizationLayer(10000);
    expect(sync.getBufferSize()).toBe(0);
  });

  it('enqueues metrics', () => {
    sync = new AnalyticsSynchronizationLayer(10000);
    sync.enqueueMetrics({ safety: { hazardCount: 1 } as any });
    expect(sync.getBufferSize()).toBe(1);
  });

  it('flush merges metrics into single payload', () => {
    sync = new AnalyticsSynchronizationLayer(10000);
    const onSyncReady = jest.fn();
    sync.onSyncReady = onSyncReady;

    sync.enqueueMetrics({ safety: { hazardCount: 1 } as any });
    sync.enqueueMetrics({ obstacles: { totalDetections: 5 } as any });
    sync.flush();

    expect(onSyncReady).toHaveBeenCalledTimes(1);
    const payload = onSyncReady.mock.calls[0][0];
    expect(payload.safety).toEqual({ hazardCount: 1 });
    expect(payload.obstacles).toEqual({ totalDetections: 5 });
    expect(payload.lastUpdated).toBeGreaterThan(0);
  });

  it('flush on interval', () => {
    jest.useFakeTimers();
    const onSyncReady = jest.fn();
    sync = new AnalyticsSynchronizationLayer(50);
    sync.onSyncReady = onSyncReady;

    sync.enqueueMetrics({ safety: { hazardCount: 1 } as any });
    jest.advanceTimersByTime(60);

    expect(onSyncReady).toHaveBeenCalledTimes(1);
  });

  it('flush is no-op when buffer empty', () => {
    sync = new AnalyticsSynchronizationLayer(10000);
    expect(() => sync.flush()).not.toThrow();
  });

  it('caps flush to MAX_METRICS_PER_FLUSH', () => {
    sync = new AnalyticsSynchronizationLayer(10000);
    const onSyncReady = jest.fn();
    sync.onSyncReady = onSyncReady;

    for (let i = 0; i < 100; i++) {
      sync.enqueueMetrics({ safety: { hazardCount: i } as any });
    }
    sync.flush();

    expect(sync.getBufferSize()).toBeLessThan(100);
    expect(onSyncReady).toHaveBeenCalledTimes(1);
  });

  it('does not enqueue after destroy', () => {
    sync = new AnalyticsSynchronizationLayer(10000);
    sync.destroy();
    sync.enqueueMetrics({ safety: {} as any });
    expect(sync.getBufferSize()).toBe(0);
  });

  it('flushes on destroy', () => {
    const onSyncReady = jest.fn();
    sync = new AnalyticsSynchronizationLayer(10000);
    sync.onSyncReady = onSyncReady;
    sync.enqueueMetrics({ safety: { hazardCount: 5 } as any });
    sync.destroy();
    expect(onSyncReady).toHaveBeenCalledTimes(1);
  });
});
