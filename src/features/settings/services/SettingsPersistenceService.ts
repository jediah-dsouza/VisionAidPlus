import { storage, STORAGE_KEYS } from '../../../core/storage/StorageService';
import { DEFAULT_PREFERENCES } from '../types/categories';
import type { UserPreferences } from '../types/preferences';
import type { PreferenceCategory } from '../types/categories';

const PREFS_VERSION_KEY = '@settings_prefs_version';
const CURRENT_VERSION = 1;

const CATEGORY_KEYS: Record<PreferenceCategory, string> = {
  accessibility: '@pref_accessibility',
  audio: '@pref_audio',
  haptic: '@pref_haptic',
  navigation: '@pref_navigation',
  theme: '@pref_theme',
  language: '@pref_language',
  biometric: '@pref_biometric',
  privacy: '@pref_privacy',
};

const SNAPSHOT_KEY = '@preferences_snapshot';

interface PersistenceQueueItem {
  key: string;
  data: unknown;
  timestamp: number;
}

class SettingsPersistenceService {
  private writeQueue: PersistenceQueueItem[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly DEBOUNCE_MS = 300;
  private destroyed = false;

  async loadPreferences(): Promise<UserPreferences> {
    try {
      const version = await storage.get<number>(PREFS_VERSION_KEY);
      if (!version || version < CURRENT_VERSION) {
        await this.migrate(version ?? 0);
      }
      const snapshot = await storage.get<Partial<UserPreferences>>(SNAPSHOT_KEY);
      if (snapshot) {
        return this.mergeDefaults(snapshot);
      }
      const merged = await this.loadFromCategoryKeys();
      await this.saveSnapshot(merged);
      return merged;
    } catch {
      return { ...DEFAULT_PREFERENCES };
    }
  }

  async loadCategory<K extends PreferenceCategory>(category: K): Promise<UserPreferences[K]> {
    try {
      const key = CATEGORY_KEYS[category];
      const stored = await storage.get<Partial<UserPreferences[K]>>(key);
      if (stored) {
        return { ...DEFAULT_PREFERENCES[category], ...stored };
      }
      return { ...DEFAULT_PREFERENCES[category] };
    } catch {
      return { ...DEFAULT_PREFERENCES[category] };
    }
  }

  async saveCategory<K extends PreferenceCategory>(
    category: K,
    data: UserPreferences[K],
  ): Promise<void> {
    if (this.destroyed) return;
    await storage.set(CATEGORY_KEYS[category], data);
    this.enqueueSnapshot();
  }

  async resetAll(): Promise<void> {
    if (this.destroyed) return;
    for (const key of Object.values(CATEGORY_KEYS)) {
      await storage.remove(key);
    }
    await storage.remove(SNAPSHOT_KEY);
    await storage.remove(PREFS_VERSION_KEY);
  }

  destroy(): void {
    this.destroyed = true;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.writeQueue = [];
  }

  resetState(): void {
    this.destroyed = false;
    this.writeQueue = [];
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private enqueueWrite(key: string, data: unknown): void {
    this.writeQueue = this.writeQueue.filter(item => item.key !== key);
    this.writeQueue.push({ key, data, timestamp: Date.now() });
    this.scheduleFlush();
  }

  private enqueueSnapshot(): void {
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (this.destroyed) return;
    this.debounceTimer = setTimeout(() => {
      this.flush();
    }, this.DEBOUNCE_MS);
  }

  private async flush(): Promise<void> {
    if (this.destroyed || this.writeQueue.length === 0) return;
    const batch = [...this.writeQueue];
    this.writeQueue = [];
    const promises = batch.map(item => storage.set(item.key, item.data));
    await Promise.allSettled(promises);
  }

  private async saveSnapshot(prefs: UserPreferences): Promise<void> {
    this.enqueueWrite(SNAPSHOT_KEY, prefs);
    this.enqueueWrite(PREFS_VERSION_KEY, CURRENT_VERSION);
  }

  private async loadFromCategoryKeys(): Promise<UserPreferences> {
    const result: Partial<UserPreferences> = {};
    for (const [category, key] of Object.entries(CATEGORY_KEYS)) {
      const stored = await storage.get<Record<string, unknown>>(key);
      if (stored) {
        (result as Record<string, unknown>)[category] = stored;
      }
    }
    return this.mergeDefaults(result);
  }

  private mergeDefaults(partial: Partial<UserPreferences>): UserPreferences {
    return {
      accessibility: { ...DEFAULT_PREFERENCES.accessibility, ...partial.accessibility },
      audio: { ...DEFAULT_PREFERENCES.audio, ...partial.audio },
      haptic: { ...DEFAULT_PREFERENCES.haptic, ...partial.haptic },
      navigation: { ...DEFAULT_PREFERENCES.navigation, ...partial.navigation },
      theme: { ...DEFAULT_PREFERENCES.theme, ...partial.theme },
      language: { ...DEFAULT_PREFERENCES.language, ...partial.language },
      biometric: { ...DEFAULT_PREFERENCES.biometric, ...partial.biometric },
      privacy: { ...DEFAULT_PREFERENCES.privacy, ...partial.privacy },
    };
  }

  private async migrate(fromVersion: number): Promise<void> {
    if (fromVersion < 1) {
      try {
        const legacy = await storage.get<Record<string, unknown>>(STORAGE_KEYS.SETTINGS);
        if (legacy) {
          const migrated = this.legacyToPreferences(legacy);
          for (const [category, data] of Object.entries(migrated)) {
            const key = CATEGORY_KEYS[category as PreferenceCategory];
            await storage.set(key, data);
          }
          await storage.remove(STORAGE_KEYS.SETTINGS);
        }
      } catch {
        /* migration best-effort */
      }
    }
    await storage.set(PREFS_VERSION_KEY, CURRENT_VERSION);
  }

  private legacyToPreferences(legacy: Record<string, unknown>): Partial<UserPreferences> {
    return {
      accessibility: {
        screenReaderEnabled: true,
        highContrastMode: legacy.highContrastMode === true,
        largeText: legacy.largeText === true,
        reducedMotion: legacy.reducedMotion === true,
        voiceAnnouncements: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        focusIndicator: true,
      },
      audio: {
        ttsEnabled: legacy.ttsEnabled !== false,
        ttsSpeechRate: typeof legacy.ttsSpeechRate === 'number' ? legacy.ttsSpeechRate : 0.5,
        ttsVolume: 1.0,
        ttsLanguage: typeof legacy.ttsLanguage === 'string' ? legacy.ttsLanguage : 'en-US',
        audioOutput: 'speaker',
        soundEffects: true,
      },
      haptic: {
        hapticEnabled: legacy.hapticFeedback !== false,
        hapticIntensity: 'medium',
        hapticOnTouch: false,
        hapticOnNotification: true,
        hapticOnAlert: true,
      },
      navigation: DEFAULT_PREFERENCES.navigation,
      theme: {
        highContrastMode: legacy.highContrastMode === true,
        themeMode: 'system',
        fontSize: 'medium',
        fontFamily: 'System',
        reducedTransparency: false,
      },
      language: {
        appLanguage: 'en',
        ttsLanguage: typeof legacy.ttsLanguage === 'string' ? legacy.ttsLanguage : 'en-US',
        secondaryLanguage: '',
      },
      biometric: DEFAULT_PREFERENCES.biometric,
      privacy: {
        analyticsEnabled: legacy.analyticsEnabled === true,
        crashReporting: true,
        dataCollection: false,
        anonymizeData: true,
      },
    };
  }
}

export const settingsPersistence = new SettingsPersistenceService();
