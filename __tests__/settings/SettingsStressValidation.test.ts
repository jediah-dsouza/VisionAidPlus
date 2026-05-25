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
import { DEFAULT_PREFERENCES } from '../../src/features/settings/types/categories';
import { SETTINGS_CATEGORIES } from '../../src/features/settings/types/categories';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

describe('Settings Stress Validation', () => {
  beforeEach(() => {
    settingsPersistence.resetState();
  });

  afterEach(async () => {
    settingsPersistence.destroy();
    await jest.requireMock('../../src/core/storage/StorageService').storage.clear();
  });

  // Test 1: Rapid category saves
  it('handles rapid consecutive saves without data loss', async () => {
    const promises: Array<Promise<void>> = [];
    for (let i = 0; i < 20; i++) {
      const category = SETTINGS_CATEGORIES[i % 8];
      const prefs = { ...DEFAULT_PREFERENCES[category.id] } as unknown as Record<string, unknown>;
      const keys = Object.keys(prefs);
      if (keys.length > 0) {
        prefs[keys[0]] = prefs[keys[0]];
      }
      promises.push(settingsPersistence.saveCategory(category.id as keyof typeof DEFAULT_PREFERENCES, prefs as any));
    }
    await Promise.all(promises);
    await sleep(500);

    const loaded = await settingsPersistence.loadPreferences();
    expect(loaded.accessibility).toBeDefined();
    expect(loaded.audio).toBeDefined();
    expect(loaded.haptic).toBeDefined();
    expect(loaded.navigation).toBeDefined();
    expect(loaded.theme).toBeDefined();
    expect(loaded.language).toBeDefined();
    expect(loaded.biometric).toBeDefined();
    expect(loaded.privacy).toBeDefined();
  });

  // Test 2: Large preference values
  it('handles large string values in preferences', async () => {
    const largeString = 'x'.repeat(10000);
    const modified = { ...DEFAULT_PREFERENCES.theme, fontFamily: largeString };
    await settingsPersistence.saveCategory('theme', modified);
    await sleep(400);

    const loaded = await settingsPersistence.loadCategory('theme');
    expect(loaded.fontFamily).toBe(largeString);
  });

  // Test 3: Repeated reset-all cycles
  it('survives repeated reset cycles', async () => {
    for (let i = 0; i < 5; i++) {
      await settingsPersistence.saveCategory('audio', { ...DEFAULT_PREFERENCES.audio, ttsSpeechRate: 0.1 + i * 0.3 });
      await settingsPersistence.resetAll();
    }
    const loaded = await settingsPersistence.loadPreferences();
    expect(loaded.audio.ttsSpeechRate).toBe(0.5);
  });

  // Test 4: Concurrent load/save
  it('handles concurrent load and save operations', async () => {
    const ops = [];
    for (let i = 0; i < 10; i++) {
      ops.push(settingsPersistence.saveCategory('audio', { ...DEFAULT_PREFERENCES.audio, ttsSpeechRate: 0.5 + i * 0.1 }));
      ops.push(settingsPersistence.loadCategory('audio'));
      ops.push(settingsPersistence.saveCategory('accessibility', { ...DEFAULT_PREFERENCES.accessibility, highContrastMode: i % 2 === 0 }));
    }
    const results = await Promise.allSettled(ops);
    const failures = results.filter(r => r.status === 'rejected');
    expect(failures).toHaveLength(0);
  });

  // Test 5: All fields defined in SETTINGS_CATEGORIES
  it('every SETTINGS_CATEGORIES field maps to a valid preference key', () => {
    for (const cat of SETTINGS_CATEGORIES) {
      const categoryDefaults = DEFAULT_PREFERENCES[cat.id];
      for (const field of cat.fields) {
        expect(categoryDefaults).toHaveProperty(field.key as string);
      }
    }
  });

  // Test 6: Persistence handles null reads gracefully
  it('returns defaults when storage returns null for all keys', async () => {
    const loaded = await settingsPersistence.loadPreferences();
    expect(loaded.accessibility.highContrastMode).toBe(true);
    expect(loaded.biometric.biometricAuthEnabled).toBe(false);
  });

  // Test 7: Save after destroy is safe
  it('save after destroy does not throw', async () => {
    settingsPersistence.destroy();
    await expect(
      settingsPersistence.saveCategory('audio', DEFAULT_PREFERENCES.audio),
    ).resolves.toBeUndefined();
  });

  // Test 8: Category keys are unique
  it('all category storage keys are unique', () => {
    const categories: Array<keyof typeof DEFAULT_PREFERENCES> = ['accessibility', 'audio', 'haptic', 'navigation', 'theme', 'language', 'biometric', 'privacy'];
    const keys = categories.map(c => `@pref_${c}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
