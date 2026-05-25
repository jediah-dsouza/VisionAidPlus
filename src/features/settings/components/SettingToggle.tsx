import React, { useCallback, useRef } from 'react';
import { View, Text, Switch, StyleSheet, Pressable } from 'react-native';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';
import { accessibilityEngine } from '@core/accessibility/AccessibilityEngine';

interface SettingToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const SettingToggle: React.FC<SettingToggleProps> = ({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const lastAnnounce = useRef(0);

  const handleChange = useCallback(
    (newValue: boolean) => {
      onValueChange(newValue);
      const now = Date.now();
      if (now - lastAnnounce.current > 1000) {
        lastAnnounce.current = now;
        accessibilityEngine.announce(
          `${label} ${newValue ? 'enabled' : 'disabled'}`,
          'low',
        );
      }
    },
    [label, onValueChange],
  );

  return (
    <Pressable
      onPress={() => !disabled && handleChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint || description}
      style={({ pressed }) => [
        styles.container,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <View style={styles.info}>
        <Text style={[styles.label, disabled && styles.labelDisabled]}>
          {label}
        </Text>
        {description ? (
          <Text style={[styles.description, disabled && styles.descriptionDisabled]}>
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={handleChange}
        disabled={disabled}
        trackColor={{
          false: semanticTokens.colors.surface.elevated,
          true: semanticTokens.colors.primary.default,
        }}
        thumbColor="#FFFFFF"
        accessibilityElementsHidden
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[4],
    backgroundColor: semanticTokens.colors.surface.default,
    borderRadius: semanticTokens.radius.md,
    minHeight: semanticTokens.touchTarget.minimum,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  info: {
    flex: 1,
    marginRight: tokens.spacing[3],
  },
  label: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
  },
  labelDisabled: {
    color: semanticTokens.colors.foreground.subtle,
  },
  description: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    marginTop: 2,
  },
  descriptionDisabled: {
    color: semanticTokens.colors.foreground.subtle,
  },
});
