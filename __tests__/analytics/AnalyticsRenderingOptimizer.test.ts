import { AnalyticsRenderingOptimizer } from '../../src/core/analytics/AnalyticsRenderingOptimizer';

describe('AnalyticsRenderingOptimizer', () => {
  let opt: AnalyticsRenderingOptimizer;

  afterEach(() => {
    jest.useRealTimers();
    opt.destroy();
  });

  it('coalesce returns input metrics', () => {
    opt = new AnalyticsRenderingOptimizer(1000);
    const metrics = { safety: { hazardCount: 5 } as any };
    expect(opt.coalesce(metrics)).toBe(metrics);
  });

  it('emits metrics after throttle interval (via debounce)', () => {
    jest.useFakeTimers();
    const onMetricsReady = jest.fn();
    opt = new AnalyticsRenderingOptimizer(50);
    opt.onMetricsReady = onMetricsReady;

    opt.coalesce({ safety: { hazardCount: 1 } as any });
    jest.advanceTimersByTime(60);

    expect(onMetricsReady).toHaveBeenCalledTimes(1);
    expect(onMetricsReady.mock.calls[0][0]).toEqual({ safety: { hazardCount: 1 } });
  });

  it('debounces rapid updates', () => {
    jest.useFakeTimers();
    const onMetricsReady = jest.fn();
    opt = new AnalyticsRenderingOptimizer(100);
    opt.onMetricsReady = onMetricsReady;

    opt.coalesce({ safety: { hazardCount: 1 } as any });
    jest.advanceTimersByTime(30);
    opt.coalesce({ safety: { hazardCount: 2 } as any });
    jest.advanceTimersByTime(30);
    opt.coalesce({ safety: { hazardCount: 3 } as any });
    jest.advanceTimersByTime(110);

    expect(onMetricsReady).toHaveBeenCalledTimes(1);
    expect(onMetricsReady.mock.calls[0][0]).toEqual({ safety: { hazardCount: 3 } });
  });

  it('does not emit if metrics have not changed', () => {
    jest.useFakeTimers();
    const onMetricsReady = jest.fn();
    opt = new AnalyticsRenderingOptimizer(50);
    opt.onMetricsReady = onMetricsReady;

    opt.coalesce({ safety: { hazardCount: 1 } as any });
    jest.advanceTimersByTime(60);
    expect(onMetricsReady).toHaveBeenCalledTimes(1);

    opt.coalesce({ safety: { hazardCount: 1 } as any });
    jest.advanceTimersByTime(60);
    expect(onMetricsReady).toHaveBeenCalledTimes(1);
  });

  it('setThrottleInterval changes interval', () => {
    opt = new AnalyticsRenderingOptimizer(500);
    opt.setThrottleInterval(1000);
    expect((opt as any).throttleIntervalMs).toBe(1000);
  });

  it('does not emit if pendingMetrics is null', () => {
    jest.useFakeTimers();
    const onMetricsReady = jest.fn();
    opt = new AnalyticsRenderingOptimizer(50);
    opt.onMetricsReady = onMetricsReady;

    opt.coalesce({ safety: { hazardCount: 1 } as any });

    const ref = (opt as any);
    ref.pendingMetrics = null;
    ref.debounceTimer = setTimeout(() => {
      ref.emitMetrics();
    }, 50);

    jest.advanceTimersByTime(60);
    expect(onMetricsReady).not.toHaveBeenCalled();
  });
});
