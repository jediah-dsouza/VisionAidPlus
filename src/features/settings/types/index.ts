export type {
  AccessibilityPreferences,
  AudioPreferences,
  HapticPreferences,
  NavigationPreferences,
  ThemePreferences,
  LanguagePreferences,
  BiometricPreferences,
  PrivacyPreferences,
  UserPreferences,
} from './preferences';

export type {
  PreferenceCategory,
  PreferenceValue,
  SettingFieldDefinition,
  SettingCategoryDefinition,
} from './categories';

export {
  DEFAULT_PREFERENCES,
  DEFAULT_ACCESSIBILITY,
  DEFAULT_AUDIO,
  DEFAULT_HAPTIC,
  DEFAULT_NAVIGATION,
  DEFAULT_THEME,
  DEFAULT_LANGUAGE,
  DEFAULT_BIOMETRIC,
  DEFAULT_PRIVACY,
  SETTINGS_CATEGORIES,
  getCategoryPreference,
  setCategoryPreference,
} from './categories';
