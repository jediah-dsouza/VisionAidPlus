import { useState, useEffect, useCallback, useMemo } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import {
  accessibilityEventEmitter,
  AccessibilityEventType,
} from '@core/accessibility/AccessibilityEventEmitter';
import { accessibilityEngine } from '@core/accessibility/AccessibilityEngine';

export interface AccessibilitySettings {
  reducedMotion: boolean;
  screenReaderEnabled: boolean;
  boldTextEnabled: boolean;
  grayscaleEnabled: boolean;
  invertColorsEnabled: boolean;
  highContrastEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  voiceAnnouncementsEnabled: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  reducedMotion: false,
  screenReaderEnabled: false,
  boldTextEnabled: false,
  grayscaleEnabled: false,
  invertColorsEnabled: false,
  highContrastEnabled: false,
  hapticFeedbackEnabled: true,
  voiceAnnouncementsEnabled: true,
};

export const useReducedMotion = (): boolean => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => {
        if (mounted) setReducedMotion(enabled);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', enabled => {
      if (mounted) {
        setReducedMotion(enabled);
        accessibilityEventEmitter.emitReduceMotionChanged(enabled);
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
};

export const useScreenReaderEnabled = (): boolean => {
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isScreenReaderEnabled()
      .then(enabled => {
        if (mounted) setScreenReaderEnabled(enabled);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', enabled => {
      if (mounted) {
        setScreenReaderEnabled(enabled);
        accessibilityEventEmitter.emitScreenReaderChanged(enabled);
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return screenReaderEnabled;
};

export const useBoldTextEnabled = (): boolean => {
  const [boldTextEnabled, setBoldTextEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isBoldTextEnabled()
      .then(enabled => {
        if (mounted) setBoldTextEnabled(enabled);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener('boldTextChanged', enabled => {
      if (mounted) {
        setBoldTextEnabled(enabled);
        accessibilityEventEmitter.emitBoldTextChanged(enabled);
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return boldTextEnabled;
};

export const useGrayscaleEnabled = (): boolean => {
  const [grayscaleEnabled, setGrayscaleEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isGrayscaleEnabled?.()
      .then(enabled => {
        if (mounted) setGrayscaleEnabled(enabled ?? false);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener?.('grayscaleChanged', enabled => {
      if (mounted) setGrayscaleEnabled(enabled);
    });

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return grayscaleEnabled;
};

export const useInvertColorsEnabled = (): boolean => {
  const [invertColorsEnabled, setInvertColorsEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isInvertColorsEnabled?.()
      .then(enabled => {
        if (mounted) setInvertColorsEnabled(enabled ?? false);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener?.('invertColorsChanged', enabled => {
      if (mounted) setInvertColorsEnabled(enabled);
    });

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return invertColorsEnabled;
};

export const useHighContrastEnabled = (): boolean => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark';
};

export const useAccessibilitySettings = (): AccessibilitySettings => {
  const reducedMotion = useReducedMotion();
  const screenReaderEnabled = useScreenReaderEnabled();
  const boldTextEnabled = useBoldTextEnabled();
  const grayscaleEnabled = useGrayscaleEnabled();
  const invertColorsEnabled = useInvertColorsEnabled();
  const highContrastEnabled = useHighContrastEnabled();

  const engineConfig = useMemo(() => {
    try {
      return accessibilityEngine.getConfig();
    } catch {
      return null;
    }
  }, []);

  return useMemo(
    () => ({
      reducedMotion,
      screenReaderEnabled,
      boldTextEnabled,
      grayscaleEnabled,
      invertColorsEnabled,
      highContrastEnabled,
      hapticFeedbackEnabled: engineConfig?.hapticFeedback ?? true,
      voiceAnnouncementsEnabled: engineConfig?.voiceAnnouncements ?? true,
    }),
    [
      reducedMotion,
      screenReaderEnabled,
      boldTextEnabled,
      grayscaleEnabled,
      invertColorsEnabled,
      highContrastEnabled,
      engineConfig?.hapticFeedback,
      engineConfig?.voiceAnnouncements,
    ],
  );
};

export const useAccessibilityEventSubscription = (
  eventType: AccessibilityEventType,
  handler: (event: { type: AccessibilityEventType; payload?: Record<string, unknown> }) => void,
): void => {
  useEffect(() => {
    const unsubscribe = accessibilityEventEmitter.subscribe(eventType, handler);
    return unsubscribe;
  }, [eventType, handler]);
};

export const useAnnounce = () => {
  const screenReaderEnabled = useScreenReaderEnabled();

  const announce = useCallback(
    async (message: string, priority: 'critical' | 'high' | 'normal' | 'low' = 'normal') => {
      if (!screenReaderEnabled) return;
      try {
        await accessibilityEngine.announce(message, priority);
      } catch (error) {
        console.warn('useAnnounce: Failed to announce', error);
      }
    },
    [screenReaderEnabled],
  );

  return announce;
};

export const useHaptic = () => {
  const trigger = useCallback(
    (
      pattern:
        | 'light'
        | 'medium'
        | 'heavy'
        | 'success'
        | 'warning'
        | 'error'
        | 'emergency' = 'light',
    ) => {
      try {
        accessibilityEngine.triggerHaptic(pattern);
      } catch (error) {
        console.warn('useHaptic: Failed to trigger haptic', error);
      }
    },
    [],
  );

  return { trigger };
};

export const useAccessibility = () => {
  const settings = useAccessibilitySettings();
  const announce = useAnnounce();
  const { trigger: haptic } = useHaptic();

  const isReady = useMemo(() => {
    try {
      return accessibilityEngine.isReady();
    } catch {
      return false;
    }
  }, []);

  return useMemo(
    () => ({
      ...settings,
      announce,
      haptic,
      isReady,
      emergencyMode: (() => {
        try {
          return accessibilityEngine.isEmergencyMode();
        } catch {
          return false;
        }
      })(),
    }),
    [settings, announce, haptic, isReady],
  );
};
