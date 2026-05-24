import { NavigationManager } from '../../../src/core/live-navigation/NavigationManager';
import { ObstacleRegistry } from '../../../src/core/live-navigation/ObstacleRegistry';
import { ObstacleLifecycleManager } from '../../../src/core/live-navigation/ObstacleLifecycleManager';
import type { ObstacleEvent } from '../../../src/core/live-navigation/types';

jest.mock('../../../src/core/events/EventBus', () => ({
  eventBus: {
    subscribe: jest.fn(() => jest.fn()),
    publish: jest.fn(),
    removeAllListeners: jest.fn(),
    clearThrottleCache: jest.fn(),
  },
  EVENTS: {},
}));

jest.mock('../../../src/core/debug', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../../../src/core/accessibility', () => ({
  accessibilityEngine: {
    announce: jest.fn(),
    triggerHaptic: jest.fn(),
    initialize: jest.fn(),
    announceNavigationChange: jest.fn(),
  },
}));

function makeEvent(overrides: Partial<ObstacleEvent> = {}): ObstacleEvent {
  return {
    id: `obs_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'person',
    distanceCm: 150,
    direction: 'front',
    severity: 'caution',
    detectedAt: Date.now(),
    source: { type: 'ai', id: 'test' },
    confidence: 0.9,
    size: 'medium',
    ...overrides,
  };
}

describe('Performance Runtime Instrumentation', () => {
  let manager: NavigationManager;
  let testRegistry: ObstacleRegistry;
  let testLifecycle: ObstacleLifecycleManager;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    jest.clearAllMocks();

    testRegistry = new ObstacleRegistry({ staleObstacleTtlMs: 3000, obstacleMaxCapacity: 200 });
    testLifecycle = new ObstacleLifecycleManager({ staleObstacleTtlMs: 3000, staleCleanupIntervalMs: 1000 }, testRegistry);
    manager = new NavigationManager({ guidanceUpdateIntervalMs: 150, renderThrottleMs: 50 });
    manager.initialize();
  });

  afterEach(() => {
    manager.destroy();
    testLifecycle.destroy();
    testRegistry.destroy();
    jest.useRealTimers();
  });

  describe('Obstacle Render Counts', () => {
    it('tracks total obstacles detected', () => {
      manager.startNavigation();
      manager.handleObstacleEvent(makeEvent({ id: 'obs_1' }));
      manager.handleObstacleEvent(makeEvent({ id: 'obs_2' }));
      manager.handleObstacleEvent(makeEvent({ id: 'obs_3' }));

      const metrics = manager.getMetrics();
      expect(metrics.totalObstaclesDetected).toBe(3);
    });

    it('increments render count on guidance loop ticks', () => {
      manager.startNavigation();
      jest.advanceTimersByTime(600);

      const metrics = manager.getMetrics();
      expect(metrics.renderCount).toBeGreaterThanOrEqual(3);
    });

    it('stops counting renders after navigation stops', () => {
      manager.startNavigation();
      jest.advanceTimersByTime(300);
      manager.stopNavigation();

      const renderCountBefore = manager.getMetrics().renderCount;
      jest.advanceTimersByTime(1000);
      const renderCountAfter = manager.getMetrics().renderCount;

      expect(renderCountAfter).toBe(renderCountBefore);
    });
  });

  describe('Radar Update Frequency', () => {
    it('radar ticks increase render count', () => {
      manager.startNavigation();
      jest.advanceTimersByTime(200);

      const metrics = manager.getMetrics();
      expect(metrics.renderCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Metrics Tracking', () => {
    it('reports non-negative metrics after navigation', () => {
      manager.startNavigation();
      manager.handleObstacleEvent(makeEvent({ id: 'obs_metrics', severity: 'critical' }));
      jest.advanceTimersByTime(300);

      const metrics = manager.getMetrics();
      expect(metrics.totalObstaclesDetected).toBeGreaterThanOrEqual(1);
      expect(metrics.averageLatencyMs).toBeGreaterThanOrEqual(0);
      expect(metrics.lastUpdatedAt).toBeGreaterThan(0);
    });

    it('getPerformanceReport returns valid report', () => {
      manager.startNavigation();
      manager.handleObstacleEvent(makeEvent({ id: 'obs_perf' }));
      jest.advanceTimersByTime(200);

      const report = manager.getPerformanceReport();
      expect(report.obstacleRegistrySize).toBeGreaterThanOrEqual(0);
      expect(report.memoryEstimateBytes).toBeGreaterThanOrEqual(0);
      expect(report.averageRenderTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Stale Obstacle Pruning Frequency', () => {
    it('prunes stale obstacles in lifecycle cycles', () => {
      testLifecycle.start();

      testRegistry.insertOrUpdate(makeEvent({ id: 'will_expire' }));
      jest.advanceTimersByTime(3500);

      expect(testRegistry.getById('will_expire')).toBeUndefined();
    });

    it('lifecycle cycles accumulate', () => {
      testLifecycle.start();
      jest.advanceTimersByTime(3000);

      expect(testLifecycle.getCycles()).toBeGreaterThanOrEqual(2);
      testLifecycle.stop();
    });
  });

  describe('Subscribe Calls During Initialize', () => {
    it('subscribe is called during initialize', () => {
      const eventBus = jest.requireMock('../../../src/core/events/EventBus').eventBus;
      expect(eventBus.subscribe).toHaveBeenCalled();
    });
  });

  describe('Guidance loop performance', () => {
    it('guidance processes obstacle through full pipeline', () => {
      manager.startNavigation();
      const obs = manager.handleObstacleEvent(makeEvent({ id: 'obs_pipeline', severity: 'danger', distanceCm: 60 }));
      jest.advanceTimersByTime(200);

      expect(obs).not.toBeNull();
      expect(manager.getSession()?.obstacleCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Maximum capacity enforcement', () => {
    it('evicts oldest when capacity reached', () => {
      for (let i = 0; i < 210; i++) {
        testRegistry.insertOrUpdate(makeEvent({ id: `stress_${i}` }));
      }
      expect(testRegistry.getCount()).toBeLessThanOrEqual(200);
    });
  });
});
