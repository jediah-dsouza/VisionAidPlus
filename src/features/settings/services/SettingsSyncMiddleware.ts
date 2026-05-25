import { eventBus, EVENTS, type EventPriority } from '@core/events/EventBus';
import { accessibilityEngine } from '@core/accessibility/AccessibilityEngine';
import { hapticCoordinator } from '@core/accessibility/HapticCoordinator';
import { logger } from '@core/debug';
import type { UserPreferences } from '../types/preferences';
import type { PreferenceCategory } from '../types/categories';
import { DEFAULT_PREFERENCES } from '../types/categories';

export interface SettingsChangePayload {
  category: string;
  key: string;
  value: unknown;
  previousValue: unknown;
}

type ChangeHandler = (
  payload: SettingsChangePayload,
  preferences: UserPreferences,
) => void;

interface HandlerRegistration {
  category: PreferenceCategory;
  key: string;
  handler: ChangeHandler;
}

class SettingsSyncMiddleware {
  private handlers: HandlerRegistration[] = [];
  private initialized = false;
  private destroyed = false;

  initialize(): void {
    if (this.initialized || this.destroyed) return;

    this.registerAccessibilityHandlers();
    this.registerHapticHandlers();
    this.registerAudioHandlers();
    this.registerThemeHandlers();

    this.initialized = true;
    logger.info('[SettingsSync] Middleware initialized');
  }

  private registerAccessibilityHandlers(): void {
    const a11y = (key: string, handler: ChangeHandler) => {
      this.handlers.push({ category: 'accessibility', key, handler });
    };

    a11y('highContrastMode', (payload, _) => {
      accessibilityEngine.updateConfig({ highContrastMode: payload.value as boolean });
    });
    a11y('largeText', (payload, _) => {
      accessibilityEngine.updateConfig({ largeText: payload.value as boolean });
    });
    a11y('reducedMotion', (payload, _) => {
      accessibilityEngine.updateConfig({ reducedMotion: payload.value as boolean });
    });
    a11y('voiceAnnouncements', (payload, _) => {
      accessibilityEngine.updateConfig({ voiceAnnouncements: payload.value as boolean });
    });
    a11y('screenReaderEnabled', (payload, _) => {
      accessibilityEngine.updateConfig({ screenReaderEnabled: payload.value as boolean });
    });
    a11y('quietHoursEnabled', (payload, _) => {
      accessibilityEngine.updateConfig({ quietHoursEnabled: payload.value as boolean });
    });
    a11y('quietHoursStart', (payload, _) => {
      accessibilityEngine.updateConfig({ quietHoursStart: payload.value as string });
    });
    a11y('quietHoursEnd', (payload, _) => {
      accessibilityEngine.updateConfig({ quietHoursEnd: payload.value as string });
    });
  }

  private registerHapticHandlers(): void {
    this.handlers.push({
      category: 'haptic',
      key: 'hapticEnabled',
      handler: (payload) => {
        hapticCoordinator.updateConfig({ enabled: payload.value as boolean });
      },
    });
    this.handlers.push({
      category: 'haptic',
      key: 'hapticIntensity',
      handler: (_payload) => {
        logger.info('[SettingsSync] hapticIntensity change ignored — HapticCoordinator does not support per-pattern intensity');
      },
    });
  }

  private registerAudioHandlers(): void {
    this.handlers.push({
      category: 'audio',
      key: 'ttsEnabled',
      handler: (payload) => {
        accessibilityEngine.updateConfig({ voiceAnnouncements: payload.value as boolean });
      },
    });
  }

  private registerThemeHandlers(): void {
    this.handlers.push({
      category: 'theme',
      key: 'highContrastMode',
      handler: (payload) => {
        accessibilityEngine.updateConfig({ highContrastMode: payload.value as boolean });
      },
    });
  }

  dispatchChange(
    category: string,
    key: string,
    value: unknown,
    preferences: UserPreferences,
  ): void {
    if (this.destroyed) return;
    const cat = category as PreferenceCategory;
    const previousValue = (DEFAULT_PREFERENCES[cat] as unknown as Record<string, unknown>)[key] ?? null;

    const payload: SettingsChangePayload = {
      category,
      key,
      value,
      previousValue,
    };

    eventBus.publish(EVENTS.SETTINGS_CHANGED, payload, 'low' as EventPriority);

    const matched = this.handlers.filter(
      h => h.category === category && h.key === key,
    );
    for (const { handler } of matched) {
      try {
        handler(payload, preferences);
      } catch (error) {
        logger.error(`[SettingsSync] Handler error for ${category}.${key}:`, error);
      }
    }
  }

  reset(): void {
    if (this.destroyed) return;
    const defaults = DEFAULT_PREFERENCES;
    this.dispatchChange('accessibility', 'highContrastMode', defaults.accessibility.highContrastMode, defaults);
    this.dispatchChange('haptic', 'hapticEnabled', defaults.haptic.hapticEnabled, defaults);
    this.dispatchChange('audio', 'ttsEnabled', defaults.audio.ttsEnabled, defaults);
    this.dispatchChange('theme', 'highContrastMode', defaults.theme.highContrastMode, defaults);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  destroy(): void {
    this.destroyed = true;
    this.handlers = [];
    this.initialized = false;
  }

  resetState(): void {
    this.destroyed = false;
    this.initialized = false;
    this.handlers = [];
  }
}

export const settingsSync = new SettingsSyncMiddleware();
