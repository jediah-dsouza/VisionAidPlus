import { RenderingPerformanceMonitor } from '../../src/core/camera/RenderingPerformanceMonitor';

jest.mock('../../src/core/debug', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe('RenderingPerformanceMonitor', () => {
  let monitor: RenderingPerformanceMonitor;

  beforeEach(() => {
    jest.useFakeTimers();
    monitor = new RenderingPerformanceMonitor({ targetFps: 30 });
  });

  afterEach(() => {
    monitor.destroy();
    jest.useRealTimers();
  });

  it('starts with zero metrics', () => {
    const snap = monitor.getSnapshot();
    expect(snap.renderCount).toBe(0);
    expect(snap.averageRenderFps).toBe(0);
    expect(snap.averageRenderTimeMs).toBe(0);
    expect(snap.maxRenderTimeMs).toBe(0);
  });

  it('records render metrics', () => {
    monitor.recordRender(5, 16);
    expect(monitor.getSnapshot().renderCount).toBe(1);
    expect(monitor.getAverageRenderTime()).toBe(16);
    expect(monitor.getMaxRenderTime()).toBe(16);
  });

  it('tracks max render time', () => {
    monitor.recordRender(3, 10);
    monitor.recordRender(3, 50);
    expect(monitor.getMaxRenderTime()).toBe(50);
  });

  it('calculates average overlay count', () => {
    monitor.recordRender(3, 10);
    monitor.recordRender(7, 20);
    expect(monitor.getAverageOverlayCount()).toBe(5);
  });

  it('calculates render FPS from timestamps', () => {
    monitor.recordRender(0, 10);
    jest.advanceTimersByTime(200);
    monitor.recordRender(0, 10);
    jest.advanceTimersByTime(200);
    monitor.recordRender(0, 10);
    const fps = monitor.getAverageRenderFps();
    expect(fps).toBeGreaterThan(0);
  });

  it('reset clears all metrics', () => {
    monitor.recordRender(5, 20);
    monitor.reset();
    const snap = monitor.getSnapshot();
    expect(snap.renderCount).toBe(0);
    expect(snap.maxRenderTimeMs).toBe(0);
  });

  it('destroy prevents recording', () => {
    monitor.destroy();
    monitor.recordRender(5, 20);
    expect(monitor.getSnapshot().renderCount).toBe(0);
  });
});
