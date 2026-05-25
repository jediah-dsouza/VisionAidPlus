jest.mock('../../src/core/storage/StorageService', () => {
  const store = new Map<string, string>();
  return {
    storage: {
      get: jest.fn(async <T>(key: string) => {
        const raw = store.get(key);
        if (raw === undefined) return null;
        try { return JSON.parse(raw) as T; } catch { return raw as T; }
      }),
      set: jest.fn(async <T>(key: string, value: T) => {
        store.set(key, typeof value === 'string' ? value : JSON.stringify(value));
      }),
      remove: jest.fn(async (key: string) => { store.delete(key); }),
      clear: jest.fn(async () => { store.clear(); }),
      getAllKeys: jest.fn(async () => Array.from(store.keys())),
    },
    STORAGE_KEYS: { SETTINGS: '@app_settings' },
  };
});

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
  accessibilityEngine: { updateConfig: jest.fn(), announce: jest.fn() },
}));

jest.mock('../../src/core/accessibility/HapticCoordinator', () => ({
  hapticCoordinator: { updateConfig: jest.fn() },
}));

jest.mock('../../src/core/debug', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { settingsPersistence } from '../../src/features/settings/services/SettingsPersistenceService';
import { settingsSync } from '../../src/features/settings/services/SettingsSyncMiddleware';
import { DEFAULT_PREFERENCES } from '../../src/features/settings/types/categories';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

describe('Settings Runtime Validation', () => {
  beforeEach(() => {
    settingsSync.resetState();
    settingsPersistence.resetState();
    jest.requireMock('../../src/core/accessibility/AccessibilityEngine').accessibilityEngine.updateConfig.mockClear();
    jest.requireMock('../../src/core/accessibility/HapticCoordinator').hapticCoordinator.updateConfig.mockClear();
    jest.requireMock('../../src/core/events/EventBus').eventBus.publish.mockClear();
  });

  afterEach(async () => {
    settingsSync.destroy();
    settingsPersistence.destroy();
    await jest.requireMock('../../src/core/storage/StorageService').storage.clear();
  });

  // Test 1: Persistence round-trip
  it('persists and reloads preferences correctly', async () => {
    const modified = {
      ...DEFAULT_PREFERENCES,
      accessibility: { ...DEFAULT_PREFERENCES.accessibility, highContrastMode: false, largeText: false },
      audio: { ...DEFAULT_PREFERENCES.audio, ttsSpeechRate: 1.2, ttsLanguage: 'fr-FR' },
      haptic: { ...DEFAULT_PREFERENCES.haptic, hapticIntensity: 'light' as const },
    };

    for (const [category, data] of Object.entries(modified)) {
      await settingsPersistence.saveCategory(category as keyof typeof modified, data as any);
    }

    await sleep(400);

    const loaded = await settingsPersistence.loadPreferences();
    expect(loaded.accessibility.highContrastMode).toBe(false);
    expect(loaded.accessibility.largeText).toBe(false);
    expect(loaded.audio.ttsSpeechRate).toBe(1.2);
    expect(loaded.audio.ttsLanguage).toBe('fr-FR');
    expect(loaded.haptic.hapticIntensity).toBe('light');
  });

  // Test 2: Sync middleware propagates changes
  it('sync middleware dispatches event on preference change', () => {
    settingsSync.initialize();
    const eventBus = jest.requireMock('../../src/core/events/EventBus').eventBus;

    settingsSync.dispatchChange('accessibility', 'highContrastMode', false, DEFAULT_PREFERENCES);

    expect(eventBus.publish).toHaveBeenCalledWith(
      'SETTINGS_CHANGED',
      expect.objectContaining({
        category: 'accessibility',
        key: 'highContrastMode',
        value: false,
      }),
      expect.any(String),
    );
  });

  // Test 3: Accessibility engine update on preference change
  it('sync middleware updates accessibility engine', () => {
    settingsSync.initialize();
    const a11y = jest.requireMock('../../src/core/accessibility/AccessibilityEngine').accessibilityEngine;

    settingsSync.dispatchChange('accessibility', 'voiceAnnouncements', false, DEFAULT_PREFERENCES);

    expect(a11y.updateConfig).toHaveBeenCalledWith(
      expect.objectContaining({ voiceAnnouncements: false }),
    );
  });

  // Test 4: Haptic coordinator update
  it('sync middleware updates haptic coordinator', () => {
    settingsSync.initialize();
    const haptic = jest.requireMock('../../src/core/accessibility/HapticCoordinator').hapticCoordinator;

    settingsSync.dispatchChange('haptic', 'hapticEnabled', false, DEFAULT_PREFERENCES);

    expect(haptic.updateConfig).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  // Test 5: Multiple category saves don't interfere
  it('saving one category does not corrupt others', async () => {
    const audioPrefs = { ...DEFAULT_PREFERENCES.audio, ttsSpeechRate: 1.8 };
    const navPrefs = { ...DEFAULT_PREFERENCES.navigation, navigationSensitivity: 5 };

    await settingsPersistence.saveCategory('audio', audioPrefs);
    await settingsPersistence.saveCategory('navigation', navPrefs);
    await sleep(400);

    const loaded = await settingsPersistence.loadPreferences();
    expect(loaded.audio.ttsSpeechRate).toBe(1.8);
    expect(loaded.navigation.navigationSensitivity).toBe(5);
    expect(loaded.accessibility.highContrastMode).toBe(true);
  });

  // Test 6: Reset clears everything
  it('resetAll restores defaults', async () => {
    await settingsPersistence.saveCategory('audio', { ...DEFAULT_PREFERENCES.audio, ttsEnabled: false });
    await settingsPersistence.resetAll();

    const loaded = await settingsPersistence.loadPreferences();
    expect(loaded.audio.ttsEnabled).toBe(true);
    expect(loaded.accessibility.highContrastMode).toBe(true);
    expect(loaded.theme.themeMode).toBe('system');
  });

  // Test 7: Sync middleware initializes only once
  it('sync middleware initialize is idempotent', () => {
    settingsSync.initialize();
    const firstInit = settingsSync.isInitialized();
    settingsSync.initialize();
    expect(settingsSync.isInitialized()).toBe(firstInit);
  });

  // Test 8: Destroy prevents further propagation
  it('sync middleware destroy prevents dispatch', () => {
    const eventBus = jest.requireMock('../../src/core/events/EventBus').eventBus;
    settingsSync.initialize();
    settingsSync.destroy();
    eventBus.publish.mockClear();

    settingsSync.dispatchChange('audio', 'ttsEnabled', false, DEFAULT_PREFERENCES);
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  // Test 9: Persistence destroys gracefully
  it('persistence service handles double destroy', () => {
    settingsPersistence.destroy();
    expect(() => settingsPersistence.destroy()).not.toThrow();
  });

  // Test 10: Category defaults independent
  it('each category has independent defaults', () => {
    expect(DEFAULT_PREFERENCES.accessibility.highContrastMode).toBe(true);
    expect(DEFAULT_PREFERENCES.audio.ttsEnabled).toBe(true);
    expect(DEFAULT_PREFERENCES.haptic.hapticEnabled).toBe(true);
    expect(DEFAULT_PREFERENCES.navigation.navigationSensitivity).toBe(3);
    expect(DEFAULT_PREFERENCES.theme.themeMode).toBe('system');
    expect(DEFAULT_PREFERENCES.language.appLanguage).toBe('en');
    expect(DEFAULT_PREFERENCES.biometric.biometricAuthEnabled).toBe(false);
    expect(DEFAULT_PREFERENCES.privacy.analyticsEnabled).toBe(false);
  });
});
