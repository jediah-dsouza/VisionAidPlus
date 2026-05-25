import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserPreferences } from '@features/settings/types/preferences';
import type { PreferenceCategory } from '@features/settings/types/categories';
import { DEFAULT_PREFERENCES } from '@features/settings/types/categories';

export interface SettingsState {
  preferences: UserPreferences;
  hasCompletedOnboarding: boolean;
  _loaded: boolean;
}

const initialState: SettingsState = {
  preferences: { ...DEFAULT_PREFERENCES },
  hasCompletedOnboarding: false,
  _loaded: false,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setPreferences: (state, action: PayloadAction<UserPreferences>) => {
      state.preferences = action.payload;
      state._loaded = true;
    },
    setCategoryPreference: (
      state: SettingsState,
      action: PayloadAction<{ category: PreferenceCategory; key: string; value: unknown }>,
    ) => {
      const { category, key, value } = action.payload;
      (state.preferences[category] as unknown as Record<string, unknown>)[key] = value;
    },
    setHasCompletedOnboarding: (state, action: PayloadAction<boolean>) => {
      state.hasCompletedOnboarding = action.payload;
    },
    resetPreferences: (state) => {
      state.preferences = { ...DEFAULT_PREFERENCES };
    },
    setLoaded: (state, action: PayloadAction<boolean>) => {
      state._loaded = action.payload;
    },
  },
});

export const settingsActions = settingsSlice.actions;
export default settingsSlice.reducer;
