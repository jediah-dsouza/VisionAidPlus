import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { semanticTokens } from '../../theme/semantic';
import { tokens } from '../../theme/tokens';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  title: string;
  message?: string;
  variant?: AlertVariant;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
  persistent?: boolean;
}

const variantStyles: Record<
  AlertVariant,
  { bg: string; border: string; icon: string; iconColor: string }
> = {
  info: {
    bg: semanticTokens.colors.info.subtle,
    border: semanticTokens.colors.info.default,
    icon: 'ℹ',
    iconColor: semanticTokens.colors.info.default,
  },
  success: {
    bg: semanticTokens.colors.success.subtle,
    border: semanticTokens.colors.success.default,
    icon: '✓',
    iconColor: semanticTokens.colors.success.default,
  },
  warning: {
    bg: semanticTokens.colors.warning.subtle,
    border: semanticTokens.colors.warning.default,
    icon: '⚠',
    iconColor: semanticTokens.colors.warning.default,
  },
  error: {
    bg: semanticTokens.colors.danger.subtle,
    border: semanticTokens.colors.danger.default,
    icon: '✕',
    iconColor: semanticTokens.colors.danger.default,
  },
};

export const Alert: React.FC<AlertProps> = ({
  title,
  message,
  variant = 'info',
  action,
  onDismiss,
  persistent = false,
}) => {
  const variantStyle = variantStyles[variant];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: variantStyle.bg, borderColor: variantStyle.border },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={`${variant} alert: ${title}${message ? `. ${message}` : ''}`}>
      <View style={styles.header}>
        <Text style={[styles.icon, { color: variantStyle.iconColor }]}>{variantStyle.icon}</Text>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
        {onDismiss && (
          <Pressable
            style={styles.dismissButton}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss alert">
            <Text style={styles.dismissText}>✕</Text>
          </Pressable>
        )}
      </View>
      {action && (
        <Pressable style={styles.actionButton} onPress={action.onPress}>
          <Text style={[styles.actionText, { color: variantStyle.iconColor }]}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: semanticTokens.radius.md,
    borderWidth: 1,
    padding: tokens.spacing[4],
    gap: tokens.spacing[3],
    minHeight: semanticTokens.touchTarget.minimum,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 18,
    fontWeight: tokens.fontWeight.bold,
    marginRight: tokens.spacing[3],
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
  },
  message: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    marginTop: tokens.spacing[1],
  },
  dismissButton: {
    width: semanticTokens.touchTarget.minimum,
    height: semanticTokens.touchTarget.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 14,
    color: semanticTokens.colors.foreground.subtle,
  },
  actionButton: {
    paddingVertical: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[3],
    alignSelf: 'flex-start',
    marginLeft: tokens.spacing[6],
    minHeight: semanticTokens.touchTarget.minimum,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
  },
});
