import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@app/store';
import { settingsActions } from '@app/store/slices/settingsSlice';
import { accessibilityEngine } from '@core/accessibility/AccessibilityEngine';
import { logger } from '@core/debug';
import { settingsPersistence } from '../services/SettingsPersistenceService';
import { settingsSync } from '../services/SettingsSyncMiddleware';
import type { UserPreferences } from '../types/preferences';
import type { PreferenceCategory } from '../types/categories';

export const useSettings = () => {
  const dispatch = useAppDispatch();
  const preferences = useAppSelector(state => state.settings.preferences);
  const loaded = useAppSelector(state => state.settings._loaded);
  const initialized = useRef(false);

  const setPreference = useCallback(
    async (category: PreferenceCategory, key: string, value: unknown) => {
      dispatch(settingsActions.setCategoryPreference({ category, key, value }));

      const updated = {
        ...preferences,
        [category]: {
          ...preferences[category],
          [key]: value,
        },
      };

      settingsSync.dispatchChange(category, key, value, updated);

      await settingsPersistence.saveCategory(
        category,
        updated[category] as UserPreferences[typeof category],
      );
    },
    [dispatch, preferences],
  );

  const resetToDefaults = useCallback(async () => {
    dispatch(settingsActions.resetPreferences());
    await settingsPersistence.resetAll();
    settingsSync.reset();
  }, [dispatch]);

  useEffect(() => {
    if (initialized.current || loaded) return;
    initialized.current = true;

    const load = async () => {
      try {
        const stored = await settingsPersistence.loadPreferences();
        dispatch(settingsActions.setPreferences(stored));
        settingsSync.initialize();

        accessibilityEngine.updateConfig({
          highContrastMode: stored.accessibility.highContrastMode,
          largeText: stored.accessibility.largeText,
          reducedMotion: stored.accessibility.reducedMotion,
          hapticFeedback: stored.haptic.hapticEnabled,
          voiceAnnouncements: stored.accessibility.voiceAnnouncements,
          screenReaderEnabled: stored.accessibility.screenReaderEnabled,
          quietHoursEnabled: stored.accessibility.quietHoursEnabled,
          quietHoursStart: stored.accessibility.quietHoursStart,
          quietHoursEnd: stored.accessibility.quietHoursEnd,
        });

        logger.info('[Settings] Preferences loaded from persistence');
      } catch (error) {
        logger.error('[Settings] Failed to load preferences:', error);
        dispatch(settingsActions.setLoaded(true));
      }
    };

    load();
  }, [dispatch, loaded]);

  return {
    preferences,
    loaded,
    setPreference,
    resetToDefaults,
  };
};
