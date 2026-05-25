jest.mock('../../src/core/events/EventBus', () => {
  const handlers: Record<string, Array<(payload: unknown) => void>> = {};
  return {
    eventBus: {
      publish: jest.fn((event: string, payload: unknown) => {
        const subs = handlers[event];
        if (subs) subs.forEach(h => h(payload));
      }),
      subscribe: jest.fn((event: string, handler: (payload: unknown) => void) => {
        if (!handlers[event]) handlers[event] = [];
        handlers[event].push(handler);
        return () => {
          handlers[event] = handlers[event].filter(h => h !== handler);
        };
      }),
    },
    EVENTS: { SETTINGS_CHANGED: 'SETTINGS_CHANGED' },
  };
});

jest.mock('../../src/core/accessibility/AccessibilityEngine', () => ({
  accessibilityEngine: {
    updateConfig: jest.fn(),
    announce: jest.fn(),
  },
}));

jest.mock('../../src/core/accessibility/HapticCoordinator', () => ({
  hapticCoordinator: {
    updateConfig: jest.fn(),
  },
}));

jest.mock('../../src/core/debug', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { settingsSync } from '../../src/features/settings/services/SettingsSyncMiddleware';
import { DEFAULT_PREFERENCES } from '../../src/features/settings/types/categories';

describe('SettingsSyncMiddleware', () => {
  beforeEach(() => {
    settingsSync.resetState();
    jest.requireMock('../../src/core/events/EventBus').eventBus.publish.mockClear();
    jest.requireMock('../../src/core/accessibility/AccessibilityEngine').accessibilityEngine.updateConfig.mockClear();
  });

  afterEach(() => {
    settingsSync.destroy();
  });

  it('initializes without error', () => {
    expect(() => settingsSync.initialize()).not.toThrow();
    expect(settingsSync.isInitialized()).toBe(true);
  });

  it('is idempotent on multiple initialize calls', () => {
    settingsSync.initialize();
    settingsSync.initialize();
    expect(settingsSync.isInitialized()).toBe(true);
  });

  it('dispatchChange publishes SETTINGS_CHANGED event', () => {
    settingsSync.initialize();
    const eventBus = jest.requireMock('../../src/core/events/EventBus').eventBus;

    settingsSync.dispatchChange('audio', 'ttsEnabled', false, DEFAULT_PREFERENCES);

    expect(eventBus.publish).toHaveBeenCalledWith(
      'SETTINGS_CHANGED',
      expect.objectContaining({
        category: 'audio',
        key: 'ttsEnabled',
        value: false,
      }),
      'low',
    );
  });

  it('reset calls dispatchChange for defaults', () => {
    settingsSync.initialize();
    const eventBus = jest.requireMock('../../src/core/events/EventBus').eventBus;
    eventBus.publish.mockClear();

    settingsSync.reset();

    expect(eventBus.publish).toHaveBeenCalled();
  });

  it('destroy prevents further operations', () => {
    settingsSync.initialize();
    settingsSync.destroy();
    expect(settingsSync.isInitialized()).toBe(false);
    settingsSync.resetState();
    settingsSync.initialize();
    expect(settingsSync.isInitialized()).toBe(true);
  });
});
