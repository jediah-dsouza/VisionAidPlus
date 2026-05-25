import { eventBus, EVENTS } from '../../../src/core/events/EventBus';
import { flushPromises } from '../helpers/asyncLifecycle';

const RUN_BENCHMARKS = typeof globalThis !== 'undefined' && !!(globalThis as any).__PERF__;

function measureLatency(fn: () => void, iterations: number = 100): { avg: number; min: number; max: number } {
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }
  return {
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
  };
}

function measureThroughput(publish: () => void, durationMs: number = 100): number {
  const start = performance.now();
  let count = 0;
  while (performance.now() - start < durationMs) {
    publish();
    count++;
  }
  return count / (durationMs / 1000);
}

describe('EventBus Throughput Benchmarks', () => {
  beforeEach(() => {
    eventBus.removeAllListeners();
  });

  afterEach(() => {
    eventBus.removeAllListeners();
  });

  (RUN_BENCHMARKS ? it : it.skip)('publish latency (single handler)', () => {
    const handler = jest.fn();
    eventBus.subscribe(EVENTS.BLE_DEVICE_CONNECTED, handler);

    const result = measureLatency(() => {
      eventBus.publish(EVENTS.BLE_DEVICE_CONNECTED, { deviceId: 'bench' });
    }, 100);

    expect(result.avg).toBeLessThan(1);
    expect(handler).toHaveBeenCalledTimes(100);
  });

  (RUN_BENCHMARKS ? it : it.skip)('max throughput (publishes per second)', () => {
    const handler = jest.fn();
    eventBus.subscribe(EVENTS.BLE_DEVICE_CONNECTED, handler);

    const pub = () => eventBus.publish(EVENTS.BLE_DEVICE_CONNECTED, {});
    const throughput = measureThroughput(pub, 100);

    expect(throughput).toBeGreaterThan(1000);
    expect(handler).toHaveBeenCalled();
  });

  (RUN_BENCHMARKS ? it : it.skip)('high priority handler latency', () => {
    const handler = jest.fn();
    eventBus.subscribe(EVENTS.EMERGENCY_TRIGGERED, handler, 'critical');

    const result = measureLatency(() => {
      eventBus.publish(EVENTS.EMERGENCY_TRIGGERED, {}, 'critical');
    }, 50);

    expect(result.avg).toBeLessThan(1);
    expect(handler).toHaveBeenCalled();
  });
});
