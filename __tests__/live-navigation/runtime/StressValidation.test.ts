import { NavigationManager } from '../../../src/core/live-navigation/NavigationManager';
import { ObstacleRegistry } from '../../../src/core/live-navigation/ObstacleRegistry';
import type { ObstacleEvent, Obstacle } from '../../../src/core/live-navigation/types';

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

describe('Realtime Stress Validation', () => {
  let manager: NavigationManager;
  let registry: ObstacleRegistry;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    jest.clearAllMocks();

    registry = new ObstacleRegistry({ staleObstacleTtlMs: 3000, obstacleMaxCapacity: 200 });
    manager = new NavigationManager({ guidanceUpdateIntervalMs: 150, renderThrottleMs: 50 });
    manager.initialize();
  });

  afterEach(() => {
    manager.destroy();
    registry.destroy();
    jest.useRealTimers();
  });

  describe('Rapid Obstacle Floods', () => {
    it('handles 100 obstacle insertions without errors', () => {
      for (let i = 0; i < 100; i++) {
        registry.insertOrUpdate(makeEvent({ id: `flood_${i}` }));
      }
      expect(registry.getCount()).toBe(100);
    });

    it('handles 500 obstacle insertions without crash', () => {
      for (let i = 0; i < 500; i++) {
        registry.insertOrUpdate(makeEvent({ id: `flood_${i}` }));
      }
      expect(registry.getCount()).toBeLessThanOrEqual(200);
      expect(registry.getMetrics().totalInserted).toBe(500);
    });

    it('processes obstacles through manager without errors', () => {
      manager.startNavigation();
      for (let i = 0; i < 50; i++) {
        manager.handleObstacleEvent(makeEvent({ id: `manager_flood_${i}` }));
      }
      jest.advanceTimersByTime(300);
      expect(manager.getSession()?.obstacleCount).toBeGreaterThan(0);
    });
  });

  describe('Repeated Obstacle Updates', () => {
    it('handles 200 updates on same obstacle', () => {
      manager.startNavigation();
      const obs = registry.insertOrUpdate(makeEvent({ id: 'repeated_obs', direction: 'front', distanceCm: 150 }));

      for (let i = 0; i < 200; i++) {
        registry.insertOrUpdate(makeEvent({
          id: 'repeated_obs',
          direction: i % 2 === 0 ? 'front' : 'left',
          distanceCm: 100 + (i % 100),
        }));
      }

      expect(obs).not.toBeNull();
      expect(obs!.updateCount).toBe(201);
    });
  });

  describe('Pause/Resume Spam', () => {
    it('handles rapid pause/resume cycles', () => {
      manager.startNavigation();

      for (let i = 0; i < 10; i++) {
        manager.pauseNavigation();
        manager.resumeNavigation();
      }

      expect(manager.isNavigating()).toBe(true);
    });

    it('pause/resume after session end does not throw', () => {
      manager.startNavigation();
      manager.stopNavigation();

      for (let i = 0; i < 5; i++) {
        expect(() => manager.pauseNavigation()).not.toThrow();
        expect(() => manager.resumeNavigation()).not.toThrow();
      }
    });
  });

  describe('Environment Mode Switching', () => {
    it('handles rapid environment switching during navigation', () => {
      manager.startNavigation();

      const modes = ['indoor', 'outdoor', 'night', 'tunnel'] as const;
      for (let i = 0; i < 20; i++) {
        manager.setEnvironment(modes[i % 4]);
      }
      expect(manager.getEnvironment()).toBe('tunnel');
    });
  });

  describe('Sensitivity Control Spam', () => {
    it('handles rapid sensitivity changes', () => {
      for (let i = 0; i < 50; i++) {
        manager.setSensitivity(i);
      }
      expect(manager.getSensitivity()).toBe(10);
    });
  });

  describe('Background Transition During Obstacle Updates', () => {
    it('handles background while obstacles are being processed', () => {
      manager.startNavigation();

      for (let i = 0; i < 20; i++) {
        manager.handleObstacleEvent(makeEvent({ id: `bg_obs_${i}` }));
        if (i === 10) manager.handleBackground();
        if (i === 15) manager.handleForeground();
      }

      jest.advanceTimersByTime(500);
      expect(manager.isPaused()).toBe(true);
    });
  });

  describe('Orphaned Subscription Prevention', () => {
    it('destroy cleans all timers', () => {
      const subSpy = jest.spyOn(manager as any, 'stopGuidanceLoop');
      const radarSpy = jest.spyOn(manager as any, 'stopRadarLoop');

      manager.startNavigation();
      manager.destroy();

      expect(subSpy).toHaveBeenCalled();
      expect(radarSpy).toHaveBeenCalled();
    });
  });

  describe('Guidance Instruction Validity', () => {
    it('empty registry returns zero obstacles', () => {
      expect(registry.getCount()).toBe(0);
    });

    it('obstacle at far distance gets stored', () => {
      registry.insertOrUpdate(makeEvent({
        id: 'far_obs',
        type: 'car',
        distanceCm: 480,
        direction: 'front',
        severity: 'caution',
        size: 'large',
      } as ObstacleEvent));

      const all = registry.getAll();
      expect(all.length).toBe(1);
      expect(all[0].distanceCm).toBe(480);
    });
  });
});
