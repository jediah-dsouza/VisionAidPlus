import { FrameMetricsCollector } from '../../src/core/camera/FrameMetricsCollector';

jest.mock('../../src/core/debug', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe('FrameMetricsCollector', () => {
  let metrics: FrameMetricsCollector;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    metrics = new FrameMetricsCollector();
  });

  afterEach(() => {
    metrics.destroy();
    jest.useRealTimers();
  });

  it('starts with zero metrics', () => {
    const snap = metrics.getSnapshot();
    expect(snap.totalFrames).toBe(0);
    expect(snap.processedFrames).toBe(0);
    expect(snap.droppedFrames).toBe(0);
    expect(snap.dropRate).toBe(0);
  });

  it('records frames via recordFrame', () => {
    metrics.recordFrame({ timestamp: Date.now() });
    expect(metrics.getSnapshot().processedFrames).toBe(1);
    expect(metrics.getSnapshot().totalFrames).toBe(1);
  });

  it('records drops via recordDrop', () => {
    metrics.recordDrop('throttle');
    expect(metrics.getSnapshot().droppedFrames).toBe(1);
    expect(metrics.getSnapshot().totalFrames).toBe(1);
  });

  it('calculates drop rate', () => {
    metrics.recordFrame({ timestamp: 1 });
    metrics.recordDrop('test');
    metrics.recordDrop('test');
    const snap = metrics.getSnapshot();
    expect(snap.totalFrames).toBe(3);
    expect(snap.dropRate).toBeCloseTo(2 / 3, 2);
  });

  it('records processing latency', () => {
    metrics.recordProcessingLatency(15);
    metrics.recordProcessingLatency(25);
    expect(metrics.getSnapshot().averageProcessingLatencyMs).toBe(20);
    expect(metrics.getSnapshot().peakProcessingLatencyMs).toBe(25);
  });

  it('reset clears all metrics', () => {
    metrics.recordFrame({ timestamp: 1 });
    metrics.recordDrop('test');
    metrics.reset();
    const snap = metrics.getSnapshot();
    expect(snap.totalFrames).toBe(0);
    expect(snap.processedFrames).toBe(0);
  });

  it('destroy prevents recording', () => {
    metrics.destroy();
    metrics.recordFrame({ timestamp: 1 });
    expect(metrics.getSnapshot().totalFrames).toBe(0);
  });
});
