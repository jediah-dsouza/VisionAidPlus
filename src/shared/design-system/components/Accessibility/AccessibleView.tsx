import React, { forwardRef, useImperativeHandle } from 'react';
import { View, ViewProps, AccessibilityRole, ViewStyle } from 'react-native';

export interface AccessibleViewProps extends ViewProps {
  label?: string;
  description?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityHint?: string;
  accessible?: boolean;
  focusable?: boolean;
  onAccessibilityTap?: () => void;
}

export interface AccessibleViewRef {
  focus: () => void;
  announce: (message: string) => void;
}

export const AccessibleView = forwardRef<AccessibleViewRef, AccessibleViewProps>(
  (
    {
      label,
      description,
      accessibilityRole,
      accessibilityHint,
      accessible = true,
      focusable = true,
      onAccessibilityTap,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    useImperativeHandle(
      ref,
      () => ({
        focus: () => {},
        announce: () => {},
      }),
      [],
    );

    const accessibilityProps: Record<string, unknown> = {
      accessible,
      accessibilityLabel: label,
      accessibilityHint,
      accessibilityRole,
    };

    if (description) {
      accessibilityProps.accessibilityValue = { text: description };
    }

    if (onAccessibilityTap) {
      accessibilityProps.onAccessibilityTap = onAccessibilityTap;
    }

    return (
      <View
        {...accessibilityProps}
        focusable={focusable && !(props as { disabled?: boolean }).disabled}
        style={style as ViewStyle}
        {...props}>
        {children}
      </View>
    );
  },
);

AccessibleView.displayName = 'AccessibleView';
