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

describe('Navigation Lifecycle Runtime Validation', () => {
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

  describe('Mount/Unmount Lifecycle', () => {
    it('starts idle with no session', () => {
      expect(manager.getSession()).toBeNull();
      expect(manager.isNavigating()).toBe(false);
      expect(manager.isPaused()).toBe(false);
    });

    it('starts navigation and creates session', () => {
      const result = manager.startNavigation();
      expect(result).toBe(true);

      const session = manager.getSession();
      expect(session).not.toBeNull();
      expect(session!.status).toBe('navigating');
      expect(session!.id).toMatch(/^nav_/);
      expect(manager.isNavigating()).toBe(true);
    });

    it('stops navigation and clears session', () => {
      manager.startNavigation();
      manager.stopNavigation();

      expect(manager.getSession()).toBeNull();
      expect(manager.isNavigating()).toBe(false);
    });

    it('prevents double start', () => {
      expect(manager.startNavigation()).toBe(true);
      expect(manager.startNavigation()).toBe(false);
    });

    it('stopNavigation is idempotent when no session', () => {
      expect(() => manager.stopNavigation()).not.toThrow();
    });
  });

  describe('Background/Foreground Transitions', () => {
    it('auto-pauses on background when navigating', () => {
      manager.startNavigation();
      expect(manager.isNavigating()).toBe(true);

      manager.handleBackground();
      expect(manager.isPaused()).toBe(true);
      expect(manager.getSession()?.status).toBe('paused');
    });

    it('foreground restores but does not auto-resume', () => {
      manager.startNavigation();
      manager.handleBackground();
      expect(manager.isPaused()).toBe(true);

      manager.handleForeground();
      expect(manager.isPaused()).toBe(true);
    });

    it('background is no-op when not navigating', () => {
      expect(() => manager.handleBackground()).not.toThrow();
    });

    it('resume after foreground works correctly', () => {
      manager.startNavigation();
      manager.handleBackground();
      manager.handleForeground();

      const resumed = manager.resumeNavigation();
      expect(resumed).toBe(true);
      expect(manager.isNavigating()).toBe(true);
    });
  });

  describe('Pause/Resume Lifecycle', () => {
    it('pause suspends obstacle processing', () => {
      manager.startNavigation();
      const event = makeEvent({ id: 'test_obs' });

      manager.handleObstacleEvent(event);
      jest.advanceTimersByTime(200);

      manager.pauseNavigation();
      const event2 = makeEvent({ id: 'test_obs2' });
      const result = manager.handleObstacleEvent(event2);
      expect(result).toBeNull();
    });

    it('resume reactivates obstacle processing', () => {
      manager.startNavigation();
      manager.pauseNavigation();

      manager.resumeNavigation();
      const event = makeEvent({ id: 'test_obs3' });
      const result = manager.handleObstacleEvent(event);
      expect(result).not.toBeNull();
    });

    it('double pause returns false', () => {
      manager.startNavigation();
      expect(manager.pauseNavigation()).toBe(true);
      expect(manager.pauseNavigation()).toBe(false);
    });

    it('double resume returns false', () => {
      manager.startNavigation();
      expect(manager.resumeNavigation()).toBe(false);
    });

    it('resume without session returns false', () => {
      expect(manager.resumeNavigation()).toBe(false);
    });
  });

  describe('Stale Obstacle Cleanup on Screen Exit', () => {
    it('stopNavigation tracks accumulated obstacle metrics', () => {
      manager.startNavigation();
      manager.handleObstacleEvent(makeEvent({ id: 'obs_a' }));
      manager.handleObstacleEvent(makeEvent({ id: 'obs_b' }));

      manager.stopNavigation();

      const metrics = manager.getMetrics();
      expect(metrics.totalObstaclesDetected).toBe(2);
    });

    it('destroy clears timers and subscriptions', () => {
      const subSpy = jest.spyOn(manager as any, 'stopGuidanceLoop');
      const radarSpy = jest.spyOn(manager as any, 'stopRadarLoop');

      manager.startNavigation();
      manager.destroy();

      expect(subSpy).toHaveBeenCalled();
      expect(radarSpy).toHaveBeenCalled();
    });
  });

  describe('EventBus Subscription Cleanup', () => {
    it('obstacle subscriptions are cleaned on destroy', () => {
      manager.startNavigation();
      manager.destroy();

      expect(() => manager.initialize()).not.toThrow();
    });
  });

  describe('Radar Cleanup Lifecycle', () => {
    it('radar stops on navigation stop', () => {
      manager.startNavigation();
      jest.advanceTimersByTime(100);

      manager.stopNavigation();
      jest.advanceTimersByTime(200);

      expect(manager.getSession()).toBeNull();
    });
  });

  describe('Accessibility Cleanup Lifecycle', () => {
    it('destroy cleans accessibility subscriptions without errors', () => {
      manager.startNavigation();
      expect(() => manager.destroy()).not.toThrow();
    });
  });

  describe('Environment Mode Switching', () => {
    it('defaults to outdoor', () => {
      expect(manager.getEnvironment()).toBe('outdoor');
    });

    it('setEnvironment updates session mode', () => {
      manager.startNavigation();
      manager.setEnvironment('indoor');
      expect(manager.getEnvironment()).toBe('indoor');
    });

    it('setEnvironment announces via accessibility', () => {
      manager.setEnvironment('night');
      const acc = jest.requireMock('../../../src/core/accessibility').accessibilityEngine;
      expect(acc.announce).toHaveBeenCalledWith(
        'Night navigation mode',
        'high',
        false,
      );
    });

    it('switches between all modes during navigation', () => {
      manager.startNavigation();
      const modes = ['indoor', 'outdoor', 'night', 'tunnel'] as const;
      for (const mode of modes) {
        manager.setEnvironment(mode);
        expect(manager.getEnvironment()).toBe(mode);
      }
    });
  });

  describe('Sensitivity Control', () => {
    it('defaults to 5', () => {
      expect(manager.getSensitivity()).toBe(5);
    });

    it('clamps sensitivity to 1-10', () => {
      manager.setSensitivity(15);
      expect(manager.getSensitivity()).toBe(10);

      manager.setSensitivity(0);
      expect(manager.getSensitivity()).toBe(1);
    });

    it('stores exact integer values', () => {
      manager.setSensitivity(7);
      expect(manager.getSensitivity()).toBe(7);
    });
  });
});
