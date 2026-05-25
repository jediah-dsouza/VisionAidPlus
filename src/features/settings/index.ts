export { useSettings } from './hooks/useSettings';
export type {
  UserPreferences,
  AccessibilityPreferences,
  AudioPreferences,
  HapticPreferences,
  NavigationPreferences,
  ThemePreferences,
  LanguagePreferences,
  BiometricPreferences,
  PrivacyPreferences,
  PreferenceCategory,
  SettingFieldDefinition,
  SettingCategoryDefinition,
} from './types';
export {
  DEFAULT_PREFERENCES,
  SETTINGS_CATEGORIES,
} from './types/categories';
export { settingsPersistence } from './services/SettingsPersistenceService';
export { settingsSync } from './services/SettingsSyncMiddleware';
export { SettingsScreen } from './screens/SettingsScreen';
export { SettingToggle, SettingSlider, SettingSelect, SettingCategory } from './components';
