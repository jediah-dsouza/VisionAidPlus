import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { semanticTokens, tokens } from '@shared/design-system/theme';
import { accessibilityEngine } from '@core/accessibility';
import type { QuickAction } from '../types';

interface QuickActionsProps {
  actions: QuickAction[];
  layout?: 'grid' | 'row' | 'stack';
  size?: 'sm' | 'md' | 'lg';
}

interface QuickActionButtonProps {
  action: QuickAction;
  size: 'sm' | 'md' | 'lg';
  onPress: (action: QuickAction) => void;
}

const getVariantStyles = (variant: QuickAction['variant'] | undefined) => {
  switch (variant) {
    case 'danger':
      return {
        bg: semanticTokens.colors.danger.default,
        text: '#FFFFFF',
        border: 'transparent',
      };
    case 'secondary':
      return {
        bg: semanticTokens.colors.secondary.default,
        text: '#FFFFFF',
        border: 'transparent',
      };
    case 'primary':
    default:
      return {
        bg: semanticTokens.colors.primary.default,
        text: '#FFFFFF',
        border: 'transparent',
      };
  }
};

const getSizeStyles = (size: 'sm' | 'md' | 'lg', variant?: QuickAction['variant']) => {
  const baseStyles = {
    sm: {
      paddingVertical: tokens.spacing[2],
      paddingHorizontal: tokens.spacing[3],
      fontSize: semanticTokens.fontSize.sm,
      iconSize: 16,
    },
    md: {
      paddingVertical: tokens.spacing[3],
      paddingHorizontal: tokens.spacing[4],
      fontSize: semanticTokens.fontSize.base,
      iconSize: 20,
    },
    lg: {
      paddingVertical: tokens.spacing[4],
      paddingHorizontal: tokens.spacing[6],
      fontSize: semanticTokens.fontSize.lg,
      iconSize: 24,
    },
  };

  return baseStyles[size];
};

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ action, size, onPress }) => {
  const variantStyles = getVariantStyles(action.variant);
  const sizeStyles = getSizeStyles(size, action.variant);

  const handlePress = useCallback(() => {
    accessibilityEngine.announce(`Starting ${action.label}`, 'normal');
    action.onPress();
  }, [action]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: variantStyles.bg,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          opacity: action.disabled ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}
      onPress={handlePress}
      disabled={action.disabled}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      accessibilityState={{ disabled: action.disabled }}>
      <Text style={[styles.actionIcon, { fontSize: sizeStyles.iconSize }]}>{action.icon}</Text>
      <Text
        style={[styles.actionLabel, { fontSize: sizeStyles.fontSize, color: variantStyles.text }]}>
        {action.label}
      </Text>
    </Pressable>
  );
};

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  layout = 'grid',
  size = 'md',
}) => {
  const validActions = useMemo(
    () => actions.filter(action => action && typeof action === 'object'),
    [actions],
  );

  const containerStyle = useMemo(() => {
    switch (layout) {
      case 'row':
        return styles.rowContainer;
      case 'stack':
        return styles.stackContainer;
      case 'grid':
      default:
        return styles.gridContainer;
    }
  }, [layout]);

  return (
    <View
      style={containerStyle}
      accessibilityLabel={`Quick actions: ${validActions.length} available`}>
      {validActions.map((action, index) => (
        <QuickActionButton
          key={action.id || index}
          action={action}
          size={size}
          onPress={() => {}}
        />
      ))}
    </View>
  );
};

interface QuickActionsPresetProps {
  onStartNavigation: () => void;
  onConnectDevice: () => void;
  onViewAlerts: () => void;
  onEmergencySettings: () => void;
  layout?: 'grid' | 'row' | 'stack';
  disabled?: boolean;
}

export const QuickActionsPreset: React.FC<QuickActionsPresetProps> = ({
  onStartNavigation,
  onConnectDevice,
  onViewAlerts,
  onEmergencySettings,
  layout = 'grid',
  disabled = false,
}) => {
  const presetActions: QuickAction[] = useMemo(
    () => [
      {
        id: 'navigation',
        label: 'Start Navigation',
        icon: '🧭',
        onPress: onStartNavigation,
        disabled,
        variant: 'primary',
      },
      {
        id: 'device',
        label: 'Connect Device',
        icon: '📱',
        onPress: onConnectDevice,
        disabled,
        variant: 'secondary',
      },
      {
        id: 'alerts',
        label: 'View Alerts',
        icon: '🔔',
        onPress: onViewAlerts,
        disabled,
      },
      {
        id: 'emergency-settings',
        label: 'Emergency Settings',
        icon: '🚨',
        onPress: onEmergencySettings,
        disabled,
        variant: 'danger',
      },
    ],
    [onStartNavigation, onConnectDevice, onViewAlerts, onEmergencySettings, disabled],
  );

  return <QuickActions actions={presetActions} layout={layout} size="md" />;
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[3],
  },
  rowContainer: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
  },
  stackContainer: {
    flexDirection: 'column',
    gap: tokens.spacing[3],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: semanticTokens.radius.md,
    gap: tokens.spacing[2],
    minHeight: semanticTokens.touchTarget.minimum,
  },
  actionIcon: {
    color: '#FFFFFF',
  },
  actionLabel: {
    fontWeight: tokens.fontWeight.semibold,
  },
});
