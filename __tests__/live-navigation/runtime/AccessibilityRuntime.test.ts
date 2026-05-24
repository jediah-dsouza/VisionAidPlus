import { NavigationManager } from '../../../src/core/live-navigation/NavigationManager';
import type { ObstacleEvent } from '../../../src/core/live-navigation/types';
import { NAVIGATION_EVENTS } from '../../../src/core/live-navigation/NavigationEventBus';

const mockSubscribeHandlers = new Map<string, Array<(...args: unknown[]) => void>>();

jest.mock('../../../src/core/events/EventBus', () => ({
  eventBus: {
    subscribe: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!mockSubscribeHandlers.has(event)) mockSubscribeHandlers.set(event, []);
      mockSubscribeHandlers.get(event)!.push(handler);
      return () => {
        const handlers = mockSubscribeHandlers.get(event);
        if (handlers) {
          const idx = handlers.indexOf(handler);
          if (idx >= 0) handlers.splice(idx, 1);
        }
      };
    }),
    publish: jest.fn(),
    removeAllListeners: jest.fn(),
    clearThrottleCache: jest.fn(),
  },
  EVENTS: {},
}));

function triggerEvent(event: string, payload: unknown): void {
  const handlers = mockSubscribeHandlers.get(event);
  if (handlers) handlers.forEach(h => h(payload));
}

jest.mock('../../../src/core/debug', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../../../src/core/accessibility', () => ({
  accessibilityEngine: {
    announce: jest.fn((...args: unknown[]) => {}),
    triggerHaptic: jest.fn((...args: unknown[]) => {}),
    initialize: jest.fn(),
    announceNavigationChange: jest.fn(),
    enterEmergencyMode: jest.fn(),
    exitEmergencyMode: jest.fn(),
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

const mockAnnounce = jest.fn();
const mockTriggerHaptic = jest.fn();

describe('Accessibility Runtime Validation', () => {
  let manager: NavigationManager;

  beforeEach(() => {
    jest.useFakeTimers({ now: 1000000 });
    jest.clearAllMocks();
    mockSubscribeHandlers.clear();

    const acc = jest.requireMock('../../../src/core/accessibility').accessibilityEngine;
    acc.announce = mockAnnounce;
    acc.triggerHaptic = mockTriggerHaptic;

    manager = new NavigationManager({ guidanceUpdateIntervalMs: 150, renderThrottleMs: 50 });
    manager.initialize();
  });

  afterEach(() => {
    manager.destroy();
    jest.useRealTimers();
  });

  describe('Obstacle Announcements During Active Navigation', () => {
    it('issues guidance instructions for detected obstacles', () => {
      manager.startNavigation();
      manager.handleObstacleEvent(makeEvent({ id: 'obs_1', distanceCm: 50, severity: 'critical', direction: 'front' }));
      jest.advanceTimersByTime(200);

      const eb = jest.requireMock('../../../src/core/events/EventBus').eventBus;
      expect(eb.publish).toHaveBeenCalledWith(
        NAVIGATION_EVENTS.GUIDANCE_ISSUED,
        expect.objectContaining({
          instruction: expect.objectContaining({
            type: 'danger_alert',
          }),
        }),
        expect.anything(),
      );
    });

    it('announces danger_alert for critical obstacles near', () => {
      manager.startNavigation();
      manager.handleObstacleEvent(makeEvent({ id: 'obs_close', distanceCm: 20, severity: 'critical', direction: 'front' }));
      jest.advanceTimersByTime(200);

      triggerEvent(NAVIGATION_EVENTS.GUIDANCE_ISSUED, {
        instruction: {
          text: 'Stop. Person ahead.',
          priority: 'critical',
          hapticPattern: 'emergency',
          spoken: false,
        },
      });

      expect(mockAnnounce).toHaveBeenCalledWith(
        expect.stringContaining('Stop'),
        'critical',
        true,
      );
    });

    it('issues warnings for danger severity obstacles', () => {
      manager.startNavigation();
      manager.handleObstacleEvent(makeEvent({ id: 'obs_warn', distanceCm: 80, severity: 'danger', direction: 'front' }));
      jest.advanceTimersByTime(200);

      const eb = jest.requireMock('../../../src/core/events/EventBus').eventBus;
      expect(eb.publish).toHaveBeenCalledWith(
        NAVIGATION_EVENTS.GUIDANCE_ISSUED,
        expect.objectContaining({
          instruction: expect.objectContaining({
            type: expect.stringMatching(/warning|danger_alert/),
          }),
        }),
        expect.anything(),
      );
    });

    it('publishes navigation lifecycle events', () => {
      manager.startNavigation();

      const eb = jest.requireMock('../../../src/core/events/EventBus').eventBus;
      expect(eb.publish).toHaveBeenCalledWith(
        NAVIGATION_EVENTS.NAVIGATION_STARTED,
        expect.any(Object),
        'high',
      );

      manager.stopNavigation();
      expect(eb.publish).toHaveBeenCalledWith(
        NAVIGATION_EVENTS.NAVIGATION_STOPPED,
        expect.any(Object),
        'high',
      );
    });
  });

  describe('Danger Alert Interruption Hierarchy', () => {
    it('triggers emergency haptic for critical danger', () => {
      triggerEvent(NAVIGATION_EVENTS.DANGER_ESCALATED, { from: 'high', to: 'critical' });

      expect(mockTriggerHaptic).toHaveBeenCalledWith('emergency');
      expect(mockAnnounce).toHaveBeenCalledWith(
        'Navigation danger: critical level',
        'critical',
        true,
      );
    });

    it('handles high danger escalation', () => {
      triggerEvent(NAVIGATION_EVENTS.DANGER_ESCALATED, { from: 'moderate', to: 'high' });

      expect(mockAnnounce).toHaveBeenCalledWith(
        'Navigation danger: high level',
        'critical',
        true,
      );
    });

    it('ignores moderate and lower escalations', () => {
      mockAnnounce.mockClear();
      triggerEvent(NAVIGATION_EVENTS.DANGER_ESCALATED, { from: 'none', to: 'moderate' });

      expect(mockAnnounce).not.toHaveBeenCalledWith(
        expect.stringContaining('Navigation danger:'),
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe('Emergency Override Coexistence', () => {
    it('destroy cleans accessibility subscriptions', () => {
      manager.startNavigation();
      manager.destroy();

      const announceCallsBefore = mockAnnounce.mock.calls.length;
      triggerEvent(NAVIGATION_EVENTS.DANGER_ESCALATED, { from: 'none', to: 'critical' });

      expect(mockAnnounce.mock.calls.length).toBe(announceCallsBefore);
    });
  });

  describe('Repeated Obstacle Throttling', () => {
    it('skips haptic for already-spoken instructions', () => {
      mockTriggerHaptic.mockClear();

      triggerEvent(NAVIGATION_EVENTS.GUIDANCE_ISSUED, {
        instruction: {
          text: 'Stop. Person ahead.',
          priority: 'critical',
          hapticPattern: 'emergency',
          spoken: false,
        },
      });
      triggerEvent(NAVIGATION_EVENTS.GUIDANCE_ISSUED, {
        instruction: {
          text: 'Stop. Person ahead.',
          priority: 'critical',
          hapticPattern: 'emergency',
          spoken: true,
        },
      });

      expect(mockTriggerHaptic).toHaveBeenCalledTimes(1);
    });

    it('announces each unique obstacle instruction', () => {
      mockAnnounce.mockClear();

      triggerEvent(NAVIGATION_EVENTS.GUIDANCE_ISSUED, {
        instruction: { text: 'Obstacle left', priority: 'normal', hapticPattern: 'light', spoken: false },
      });
      triggerEvent(NAVIGATION_EVENTS.GUIDANCE_ISSUED, {
        instruction: { text: 'Obstacle right', priority: 'normal', hapticPattern: 'light', spoken: false },
      });

      expect(mockAnnounce).toHaveBeenCalledTimes(2);
    });
  });

  describe('Haptic Deduplication Behavior', () => {
    it('only triggers haptic for first announcement', () => {
      mockTriggerHaptic.mockClear();

      triggerEvent(NAVIGATION_EVENTS.GUIDANCE_ISSUED, {
        instruction: { text: 'Turn left', priority: 'normal', hapticPattern: 'medium', spoken: false },
      });
      triggerEvent(NAVIGATION_EVENTS.GUIDANCE_ISSUED, {
        instruction: { text: 'Turn left', priority: 'normal', hapticPattern: 'medium', spoken: true },
      });
      triggerEvent(NAVIGATION_EVENTS.GUIDANCE_ISSUED, {
        instruction: { text: 'Turn left', priority: 'normal', hapticPattern: 'medium', spoken: true },
      });

      expect(mockTriggerHaptic).toHaveBeenCalledTimes(1);
    });

    it('navigating stopped announces via accessibility', () => {
      manager.startNavigation();
      jest.advanceTimersByTime(200);
      manager.stopNavigation();

      expect(mockAnnounce).toHaveBeenCalledWith('Navigation stopped', 'high', true);
    });
  });

  describe('Navigation lifecycle accessibility integration', () => {
    it('publishes navigation started event', () => {
      manager.startNavigation();
      jest.advanceTimersByTime(200);

      const eb = jest.requireMock('../../../src/core/events/EventBus').eventBus;
      expect(eb.publish).toHaveBeenCalledWith(
        NAVIGATION_EVENTS.NAVIGATION_STARTED,
        expect.objectContaining({ session: expect.any(Object) }),
        'high',
      );
    });

    it('publishes navigation paused event', () => {
      manager.startNavigation();
      manager.pauseNavigation();

      const eb = jest.requireMock('../../../src/core/events/EventBus').eventBus;
      expect(eb.publish).toHaveBeenCalledWith(
        NAVIGATION_EVENTS.NAVIGATION_PAUSED,
        expect.any(Object),
        'normal',
      );
    });

    it('publishes navigation resumed event', () => {
      manager.startNavigation();
      manager.pauseNavigation();
      manager.resumeNavigation();

      const eb = jest.requireMock('../../../src/core/events/EventBus').eventBus;
      expect(eb.publish).toHaveBeenCalledWith(
        NAVIGATION_EVENTS.NAVIGATION_RESUMED,
        expect.any(Object),
        'normal',
      );
    });
  });
});
