export interface AccessibilityPreferences {
  screenReaderEnabled: boolean;
  highContrastMode: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  voiceAnnouncements: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  focusIndicator: boolean;
}

export interface AudioPreferences {
  ttsEnabled: boolean;
  ttsSpeechRate: number;
  ttsVolume: number;
  ttsLanguage: string;
  audioOutput: 'speaker' | 'bluetooth' | 'wired';
  soundEffects: boolean;
}

export interface HapticPreferences {
  hapticEnabled: boolean;
  hapticIntensity: 'light' | 'medium' | 'heavy';
  hapticOnTouch: boolean;
  hapticOnNotification: boolean;
  hapticOnAlert: boolean;
}

export interface NavigationPreferences {
  navigationSensitivity: number;
  obstacleAlertDistance: 'near' | 'medium' | 'far';
  voiceGuidanceFrequency: 'frequent' | 'normal' | 'minimal';
  autoReroute: boolean;
  landmarkAnnouncements: boolean;
}

export interface ThemePreferences {
  highContrastMode: boolean;
  themeMode: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  fontFamily: string;
  reducedTransparency: boolean;
}

export interface LanguagePreferences {
  appLanguage: string;
  ttsLanguage: string;
  secondaryLanguage: string;
}

export interface BiometricPreferences {
  biometricAuthEnabled: boolean;
  biometricTimeout: number;
  biometricForAuth: boolean;
}

export interface PrivacyPreferences {
  analyticsEnabled: boolean;
  crashReporting: boolean;
  dataCollection: boolean;
  anonymizeData: boolean;
}

export interface UserPreferences {
  accessibility: AccessibilityPreferences;
  audio: AudioPreferences;
  haptic: HapticPreferences;
  navigation: NavigationPreferences;
  theme: ThemePreferences;
  language: LanguagePreferences;
  biometric: BiometricPreferences;
  privacy: PrivacyPreferences;
}
