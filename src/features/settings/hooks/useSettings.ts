import { useAppDispatch, useAppSelector } from '@app/store';
import { settingsActions } from '@app/store/slices/settingsSlice';
import { accessibilityEngine, ttsService, storage, STORAGE_KEYS } from '../../../core';
import type { Settings } from '@shared/types';
import { useCallback, useEffect } from 'react';

export const useSettings = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(state => state.settings);

  const updateSetting = useCallback(
    async <K extends keyof Settings>(key: K, value: Settings[K]) => {
      dispatch(settingsActions.setSettings({ [key]: value }));

      if (key === 'ttsEnabled') {
        await ttsService.setLanguage(settings.ttsLanguage);
      }

      if (key === 'ttsLanguage' || key === 'ttsSpeechRate') {
        await ttsService.setSpeechRate(settings.ttsSpeechRate);
      }

      await storage.set(STORAGE_KEYS.SETTINGS, { ...settings, [key]: value });
    },
    [dispatch, settings],
  );

  const resetToDefaults = useCallback(async () => {
    dispatch(settingsActions.resetSettings());
    await storage.remove(STORAGE_KEYS.SETTINGS);
  }, [dispatch]);

  useEffect(() => {
    const loadSettings = async () => {
      const stored = await storage.get<Settings>(STORAGE_KEYS.SETTINGS);
      if (stored) {
        dispatch(settingsActions.setSettings(stored));
      }
    };
    loadSettings();

    accessibilityEngine.updateConfig({
      highContrastMode: settings.highContrastMode,
      largeText: settings.largeText,
      reducedMotion: settings.reducedMotion,
      hapticFeedback: settings.hapticFeedback,
    });
  }, []);

  return {
    settings,
    updateSetting,
    resetToDefaults,
  };
};
