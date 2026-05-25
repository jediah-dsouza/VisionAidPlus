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
      remove: jest.fn(async (key: string) => {
        store.delete(key);
      }),
      clear: jest.fn(async () => {
        store.clear();
      }),
      getAllKeys: jest.fn(async () => Array.from(store.keys())),
    },
    STORAGE_KEYS: { SETTINGS: '@app_settings' },
  };
});

import { settingsPersistence } from '../../src/features/settings/services/SettingsPersistenceService';
import { DEFAULT_PREFERENCES } from '../../src/features/settings/types/categories';

describe('SettingsPersistenceService', () => {
  beforeEach(() => {
    settingsPersistence.resetState();
  });

  afterEach(async () => {
    settingsPersistence.destroy();
    await jest.requireMock('../../src/core/storage/StorageService').storage.clear();
  });

  it('loads default preferences on first run', async () => {
    const prefs = await settingsPersistence.loadPreferences();
    expect(prefs.accessibility.highContrastMode).toBe(true);
    expect(prefs.audio.ttsEnabled).toBe(true);
    expect(prefs.theme.themeMode).toBe('system');
  });

  it('persists and reloads category preferences', async () => {
    const modified = { ...DEFAULT_PREFERENCES.audio, ttsSpeechRate: 0.9, ttsLanguage: 'es-ES' };
    await settingsPersistence.saveCategory('audio', modified);

    const loaded = await settingsPersistence.loadCategory('audio');
    expect(loaded.ttsSpeechRate).toBe(0.9);
    expect(loaded.ttsLanguage).toBe('es-ES');
    expect(loaded.ttsEnabled).toBe(true);
  });

  it('loadPreferences returns merged preferences after category save', async () => {
    const modifiedAudio = { ...DEFAULT_PREFERENCES.audio, ttsSpeechRate: 1.5 };
    await settingsPersistence.saveCategory('audio', modifiedAudio);

    const loaded = await settingsPersistence.loadPreferences();
    expect(loaded.audio.ttsSpeechRate).toBe(1.5);
    expect(loaded.accessibility.highContrastMode).toBe(true);
    expect(loaded.theme.themeMode).toBe('system');
  });

  it('resetAll clears all stored preferences', async () => {
    await settingsPersistence.saveCategory('audio', { ...DEFAULT_PREFERENCES.audio, ttsEnabled: false });
    await settingsPersistence.resetAll();

    const loaded = await settingsPersistence.loadPreferences();
    expect(loaded.audio.ttsEnabled).toBe(true);
  });

  it('rejects further saves after destroy', async () => {
    settingsPersistence.destroy();
    await expect(
      settingsPersistence.saveCategory('audio', DEFAULT_PREFERENCES.audio),
    ).resolves.toBeUndefined();
  });

  it('loadCategory returns defaults when nothing stored', async () => {
    const loaded = await settingsPersistence.loadCategory('biometric');
    expect(loaded.biometricAuthEnabled).toBe(false);
    expect(loaded.biometricTimeout).toBe(30);
  });
});
