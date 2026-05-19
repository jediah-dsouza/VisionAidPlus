import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Settings } from '@shared/types';

const initialState: Settings = {
  ttsEnabled: true,
  ttsLanguage: 'en-US',
  ttsSpeechRate: 0.5,
  highContrastMode: true,
  largeText: true,
  reducedMotion: false,
  hapticFeedback: true,
  emergencyCountdown: 5,
  autoReconnect: true,
  analyticsEnabled: false,
  hasCompletedOnboarding: false,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettings: (state, action: PayloadAction<Partial<Settings>>) => {
      return { ...state, ...action.payload };
    },
    resetSettings: () => initialState,
  },
});

export const settingsActions = settingsSlice.actions;
export default settingsSlice.reducer;
