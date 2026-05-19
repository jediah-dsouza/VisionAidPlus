import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { semanticTokens } from '../../theme/semantic';
import { tokens } from '../../theme/tokens';

type BannerType = 'info' | 'success' | 'warning' | 'danger';

interface VoiceFeedbackBannerProps {
  message: string;
  type?: BannerType;
  duration?: number;
  onDismiss?: () => void;
  speakMessage?: boolean;
}

const bannerTypeStyles: Record<
  BannerType,
  { background: string; border: string; iconColor: string }
> = {
  info: {
    background: semanticTokens.colors.info.subtle,
    border: semanticTokens.colors.info.default,
    iconColor: semanticTokens.colors.info.default,
  },
  success: {
    background: semanticTokens.colors.success.subtle,
    border: semanticTokens.colors.success.default,
    iconColor: semanticTokens.colors.success.default,
  },
  warning: {
    background: semanticTokens.colors.warning.subtle,
    border: semanticTokens.colors.warning.default,
    iconColor: semanticTokens.colors.warning.default,
  },
  danger: {
    background: semanticTokens.colors.danger.subtle,
    border: semanticTokens.colors.danger.default,
    iconColor: semanticTokens.colors.danger.default,
  },
};

const iconMap: Record<BannerType, string> = {
  info: 'ℹ️',
  success: '✓',
  warning: '⚠',
  danger: '✕',
};

export const VoiceFeedbackBanner: React.FC<VoiceFeedbackBannerProps> = ({
  message,
  type = 'info',
  duration,
  onDismiss,
  speakMessage = true,
}) => {
  const reducedMotion = useReducedMotion();
  const typeStyle = bannerTypeStyles[type];

  useEffect(() => {
    if (speakMessage) {
      const announce = async () => {
        await AccessibilityInfo.announceForAccessibility(message);
      };
      announce();
    }
  }, [message, speakMessage]);

  useEffect(() => {
    if (duration && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: typeStyle.background, borderColor: typeStyle.border },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite">
      <Text style={[styles.icon, { color: typeStyle.iconColor }]}>{iconMap[type]}</Text>
      <Text style={styles.message}>{message}</Text>
      {onDismiss && (
        <Pressable
          style={styles.dismissButton}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss message">
          <Text style={styles.dismissText}>✕</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing[4],
    borderRadius: semanticTokens.radius.md,
    borderWidth: 1,
    marginHorizontal: tokens.spacing[4],
    marginVertical: tokens.spacing[2],
    minHeight: semanticTokens.touchTarget.minimum,
  },
  icon: {
    fontSize: 20,
    marginRight: tokens.spacing[3],
  },
  message: {
    flex: 1,
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
  },
  dismissButton: {
    width: semanticTokens.touchTarget.minimum,
    height: semanticTokens.touchTarget.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: tokens.spacing[2],
  },
  dismissText: {
    fontSize: 16,
    color: semanticTokens.colors.foreground.muted,
  },
});
