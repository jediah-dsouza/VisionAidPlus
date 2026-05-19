import React, { forwardRef, useCallback } from 'react';
import { Pressable, PressableProps, ViewStyle, StyleSheet, View } from 'react-native';
import { useHaptic, useAnnounce } from '../../hooks';
import { accessibilityEventEmitter } from '@core/accessibility/AccessibilityEventEmitter';

export interface AccessibilityButtonProps extends Omit<PressableProps, 'onPress'> {
  label: string;
  description?: string;
  onPress: () => void | Promise<void>;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  announceOnPress?: string;
  disabled?: boolean;
}

export const AccessibilityButton = forwardRef<View, AccessibilityButtonProps>(
  (
    {
      label,
      description,
      onPress,
      hapticFeedback,
      announceOnPress,
      disabled = false,
      style,
      ...props
    },
    ref,
  ) => {
    const { trigger } = useHaptic();
    const announce = useAnnounce();

    const handlePress = useCallback(async () => {
      if (disabled) return;

      if (hapticFeedback) {
        trigger(hapticFeedback);
      }

      if (announceOnPress) {
        await announce(announceOnPress, 'low');
      }

      accessibilityEventEmitter.emitHapticTriggered(hapticFeedback || 'light', label);
      await onPress();
    }, [disabled, hapticFeedback, trigger, announce, announceOnPress, onPress, label]);

    const handleAccessibilityTap = useCallback(() => {
      handlePress();
    }, [handlePress]);

    return (
      <Pressable
        ref={ref}
        onPress={handlePress}
        onAccessibilityTap={handleAccessibilityTap}
        accessible={true}
        accessibilityLabel={label}
        accessibilityHint={description}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        style={style as ViewStyle}
        {...props}
      />
    );
  },
);

AccessibilityButton.displayName = 'AccessibilityButton';
