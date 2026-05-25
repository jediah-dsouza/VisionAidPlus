import type { UserPreferences } from './preferences';

export type PreferenceCategory = keyof UserPreferences;

export type PreferenceValue<K extends PreferenceCategory> = UserPreferences[K][keyof UserPreferences[K]];

export interface SettingFieldDefinition<K extends PreferenceCategory = PreferenceCategory> {
  key: string;
  category: K;
  label: string;
  description: string;
  type: 'toggle' | 'slider' | 'select' | 'input' | 'time';
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  dependsOn?: { category: PreferenceCategory; key: string; value: unknown };
}

export interface SettingCategoryDefinition {
  id: PreferenceCategory;
  title: string;
  icon: string;
  description: string;
  fields: SettingFieldDefinition[];
}

export const DEFAULT_ACCESSIBILITY: UserPreferences['accessibility'] = {
  screenReaderEnabled: true,
  highContrastMode: true,
  largeText: true,
  reducedMotion: false,
  voiceAnnouncements: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  focusIndicator: true,
};

export const DEFAULT_AUDIO: UserPreferences['audio'] = {
  ttsEnabled: true,
  ttsSpeechRate: 0.5,
  ttsVolume: 1.0,
  ttsLanguage: 'en-US',
  audioOutput: 'speaker',
  soundEffects: true,
};

export const DEFAULT_HAPTIC: UserPreferences['haptic'] = {
  hapticEnabled: true,
  hapticIntensity: 'medium',
  hapticOnTouch: false,
  hapticOnNotification: true,
  hapticOnAlert: true,
};

export const DEFAULT_NAVIGATION: UserPreferences['navigation'] = {
  navigationSensitivity: 3,
  obstacleAlertDistance: 'medium',
  voiceGuidanceFrequency: 'normal',
  autoReroute: true,
  landmarkAnnouncements: true,
};

export const DEFAULT_THEME: UserPreferences['theme'] = {
  highContrastMode: true,
  themeMode: 'system',
  fontSize: 'medium',
  fontFamily: 'System',
  reducedTransparency: false,
};

export const DEFAULT_LANGUAGE: UserPreferences['language'] = {
  appLanguage: 'en',
  ttsLanguage: 'en-US',
  secondaryLanguage: '',
};

export const DEFAULT_BIOMETRIC: UserPreferences['biometric'] = {
  biometricAuthEnabled: false,
  biometricTimeout: 30,
  biometricForAuth: true,
};

export const DEFAULT_PRIVACY: UserPreferences['privacy'] = {
  analyticsEnabled: false,
  crashReporting: true,
  dataCollection: false,
  anonymizeData: true,
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  accessibility: { ...DEFAULT_ACCESSIBILITY },
  audio: { ...DEFAULT_AUDIO },
  haptic: { ...DEFAULT_HAPTIC },
  navigation: { ...DEFAULT_NAVIGATION },
  theme: { ...DEFAULT_THEME },
  language: { ...DEFAULT_LANGUAGE },
  biometric: { ...DEFAULT_BIOMETRIC },
  privacy: { ...DEFAULT_PRIVACY },
};

export const SETTINGS_CATEGORIES: SettingCategoryDefinition[] = [
  {
    id: 'accessibility',
    title: 'Accessibility',
    icon: '♿',
    description: 'Screen reader, contrast, motion preferences',
    fields: [
      { key: 'screenReaderEnabled', category: 'accessibility', label: 'Screen Reader', description: 'Enable TalkBack / VoiceOver support', type: 'toggle' },
      { key: 'highContrastMode', category: 'accessibility', label: 'High Contrast', description: 'Increase visual contrast', type: 'toggle' },
      { key: 'largeText', category: 'accessibility', label: 'Large Text', description: 'Increase text size', type: 'toggle' },
      { key: 'reducedMotion', category: 'accessibility', label: 'Reduced Motion', description: 'Minimize animations', type: 'toggle' },
      { key: 'voiceAnnouncements', category: 'accessibility', label: 'Voice Announcements', description: 'Spoken feedback for events', type: 'toggle' },
      { key: 'focusIndicator', category: 'accessibility', label: 'Focus Indicator', description: 'Show focus highlight', type: 'toggle' },
      { key: 'quietHoursEnabled', category: 'accessibility', label: 'Quiet Hours', description: 'Silence announcements during set hours', type: 'toggle' },
      { key: 'quietHoursStart', category: 'accessibility', label: 'Quiet Hours Start', description: 'Start time for quiet hours', type: 'time', dependsOn: { category: 'accessibility', key: 'quietHoursEnabled', value: true } },
      { key: 'quietHoursEnd', category: 'accessibility', label: 'Quiet Hours End', description: 'End time for quiet hours', type: 'time', dependsOn: { category: 'accessibility', key: 'quietHoursEnabled', value: true } },
    ],
  },
  {
    id: 'audio',
    title: 'Audio',
    icon: '🔊',
    description: 'Text-to-speech, volume, sound preferences',
    fields: [
      { key: 'ttsEnabled', category: 'audio', label: 'Text-to-Speech', description: 'Enable voice announcements', type: 'toggle' },
      { key: 'ttsSpeechRate', category: 'audio', label: 'Speech Rate', description: 'Speed of voice output', type: 'slider', min: 0.2, max: 2.0, step: 0.1 },
      { key: 'ttsVolume', category: 'audio', label: 'Volume', description: 'Voice output volume', type: 'slider', min: 0, max: 1.0, step: 0.1 },
      { key: 'ttsLanguage', category: 'audio', label: 'TTS Language', description: 'Language for voice output', type: 'select', options: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'zh-CN', 'ar-SA'] },
      { key: 'audioOutput', category: 'audio', label: 'Audio Output', description: 'Preferred audio output device', type: 'select', options: ['speaker', 'bluetooth', 'wired'] },
      { key: 'soundEffects', category: 'audio', label: 'Sound Effects', description: 'UI sound effects', type: 'toggle' },
    ],
  },
  {
    id: 'haptic',
    title: 'Haptics',
    icon: '📳',
    description: 'Vibration feedback preferences',
    fields: [
      { key: 'hapticEnabled', category: 'haptic', label: 'Haptic Feedback', description: 'Enable vibration feedback', type: 'toggle' },
      { key: 'hapticIntensity', category: 'haptic', label: 'Intensity', description: 'Vibration strength', type: 'select', options: ['light', 'medium', 'heavy'] },
      { key: 'hapticOnTouch', category: 'haptic', label: 'Touch Feedback', description: 'Vibrate on screen touch', type: 'toggle' },
      { key: 'hapticOnNotification', category: 'haptic', label: 'Notification Feedback', description: 'Vibrate on notifications', type: 'toggle' },
      { key: 'hapticOnAlert', category: 'haptic', label: 'Alert Feedback', description: 'Vibrate on alerts', type: 'toggle' },
    ],
  },
  {
    id: 'navigation',
    title: 'Navigation',
    icon: '🧭',
    description: 'Obstacle detection and guidance settings',
    fields: [
      { key: 'navigationSensitivity', category: 'navigation', label: 'Sensitivity', description: 'Obstacle detection range (1-5)', type: 'slider', min: 1, max: 5, step: 1 },
      { key: 'obstacleAlertDistance', category: 'navigation', label: 'Alert Distance', description: 'Distance threshold for obstacle alerts', type: 'select', options: ['near', 'medium', 'far'] },
      { key: 'voiceGuidanceFrequency', category: 'navigation', label: 'Voice Guidance', description: 'How often voice guidance is given', type: 'select', options: ['frequent', 'normal', 'minimal'] },
      { key: 'autoReroute', category: 'navigation', label: 'Auto Reroute', description: 'Automatically recalculate route', type: 'toggle' },
      { key: 'landmarkAnnouncements', category: 'navigation', label: 'Landmarks', description: 'Announce nearby landmarks', type: 'toggle' },
    ],
  },
  {
    id: 'theme',
    title: 'Theme',
    icon: '🎨',
    description: 'Visual appearance customization',
    fields: [
      { key: 'highContrastMode', category: 'theme', label: 'High Contrast', description: 'Increase visual contrast', type: 'toggle' },
      { key: 'themeMode', category: 'theme', label: 'Theme Mode', description: 'Light or dark appearance', type: 'select', options: ['light', 'dark', 'system'] },
      { key: 'fontSize', category: 'theme', label: 'Font Size', description: 'App text size', type: 'select', options: ['small', 'medium', 'large', 'xlarge'] },
      { key: 'fontFamily', category: 'theme', label: 'Font', description: 'Text font family', type: 'input' },
      { key: 'reducedTransparency', category: 'theme', label: 'Reduced Transparency', description: 'Reduce transparent UI elements', type: 'toggle' },
    ],
  },
  {
    id: 'language',
    title: 'Language',
    icon: '🌐',
    description: 'Language and localization',
    fields: [
      { key: 'appLanguage', category: 'language', label: 'App Language', description: 'UI display language', type: 'select', options: ['en', 'es', 'fr', 'de', 'zh', 'ar'] },
      { key: 'ttsLanguage', category: 'language', label: 'TTS Language', description: 'Voice output language', type: 'select', options: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'zh-CN', 'ar-SA'] },
      { key: 'secondaryLanguage', category: 'language', label: 'Secondary Language', description: 'Second language for voice', type: 'select', options: ['', 'en-US', 'es-ES', 'fr-FR', 'de-DE', 'zh-CN', 'ar-SA'] },
    ],
  },
  {
    id: 'biometric',
    title: 'Biometrics',
    icon: '🔒',
    description: 'Fingerprint / face unlock settings',
    fields: [
      { key: 'biometricAuthEnabled', category: 'biometric', label: 'Biometric Auth', description: 'Enable fingerprint or face unlock', type: 'toggle' },
      { key: 'biometricTimeout', category: 'biometric', label: 'Auth Timeout', description: 'Auto-lock timeout in seconds', type: 'slider', min: 10, max: 300, step: 10 },
      { key: 'biometricForAuth', category: 'biometric', label: 'Use for Login', description: 'Use biometrics for app login', type: 'toggle' },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy',
    icon: '🛡️',
    description: 'Data collection and sharing preferences',
    fields: [
      { key: 'analyticsEnabled', category: 'privacy', label: 'Analytics', description: 'Share usage data to improve the app', type: 'toggle' },
      { key: 'crashReporting', category: 'privacy', label: 'Crash Reports', description: 'Automatically send crash reports', type: 'toggle' },
      { key: 'dataCollection', category: 'privacy', label: 'Data Collection', description: 'Allow collection of usage patterns', type: 'toggle' },
      { key: 'anonymizeData', category: 'privacy', label: 'Anonymize Data', description: 'Remove personal info from collected data', type: 'toggle' },
    ],
  },
];

export function getCategoryPreference<K extends PreferenceCategory>(
  preferences: UserPreferences,
  category: K,
  key: keyof UserPreferences[K],
): UserPreferences[K][typeof key] {
  return preferences[category][key];
}

export function setCategoryPreference<K extends PreferenceCategory>(
  preferences: UserPreferences,
  category: K,
  key: keyof UserPreferences[K],
  value: UserPreferences[K][typeof key],
): UserPreferences {
  return {
    ...preferences,
    [category]: {
      ...preferences[category],
      [key]: value,
    },
  };
}
