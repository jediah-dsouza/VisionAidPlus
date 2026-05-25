import settingsReducer, { settingsActions } from '../../src/app/store/slices/settingsSlice';
import type { SettingsState } from '../../src/app/store/slices/settingsSlice';
import { DEFAULT_PREFERENCES } from '../../src/features/settings/types/categories';

describe('settingsSlice', () => {
  const initialState = settingsReducer(undefined, { type: 'init' });

  it('has correct initial state', () => {
    expect(initialState._loaded).toBe(false);
    expect(initialState.hasCompletedOnboarding).toBe(false);
    expect(initialState.preferences.accessibility.highContrastMode).toBe(true);
    expect(initialState.preferences.audio.ttsEnabled).toBe(true);
    expect(initialState.preferences.haptic.hapticEnabled).toBe(true);
    expect(initialState.preferences.navigation.navigationSensitivity).toBe(3);
    expect(initialState.preferences.theme.themeMode).toBe('system');
    expect(initialState.preferences.language.appLanguage).toBe('en');
    expect(initialState.preferences.biometric.biometricAuthEnabled).toBe(false);
    expect(initialState.preferences.privacy.analyticsEnabled).toBe(false);
  });

  it('setPreferences replaces preferences', () => {
    const modified = {
      ...DEFAULT_PREFERENCES,
      accessibility: { ...DEFAULT_PREFERENCES.accessibility, highContrastMode: false },
    };
    const state = settingsReducer(initialState, settingsActions.setPreferences(modified));
    expect(state.preferences.accessibility.highContrastMode).toBe(false);
    expect(state._loaded).toBe(true);
  });

  it('setCategoryPreference updates single preference', () => {
    const state = settingsReducer(
      initialState,
      settingsActions.setCategoryPreference({ category: 'audio', key: 'ttsSpeechRate', value: 0.8 }),
    );
    expect(state.preferences.audio.ttsSpeechRate).toBe(0.8);
    expect(state.preferences.audio.ttsEnabled).toBe(true);
  });

  it('setHasCompletedOnboarding updates flag', () => {
    const state = settingsReducer(initialState, settingsActions.setHasCompletedOnboarding(true));
    expect(state.hasCompletedOnboarding).toBe(true);
  });

  it('resetPreferences resets to defaults', () => {
    const modified = settingsReducer(
      initialState,
      settingsActions.setCategoryPreference({ category: 'theme', key: 'themeMode', value: 'light' }),
    );
    expect(modified.preferences.theme.themeMode).toBe('light');

    const reset = settingsReducer(modified, settingsActions.resetPreferences());
    expect(reset.preferences.theme.themeMode).toBe('system');
    expect(reset.preferences.accessibility.highContrastMode).toBe(true);
  });

  it('setLoaded updates _loaded flag', () => {
    const state = settingsReducer(initialState, settingsActions.setLoaded(true));
    expect(state._loaded).toBe(true);
  });

  it('updating one category does not affect others', () => {
    const state = settingsReducer(
      initialState,
      settingsActions.setCategoryPreference({ category: 'haptic', key: 'hapticIntensity', value: 'heavy' }),
    );
    expect(state.preferences.haptic.hapticIntensity).toBe('heavy');
    expect(state.preferences.audio.ttsEnabled).toBe(true);
    expect(state.preferences.accessibility.highContrastMode).toBe(true);
  });
});
