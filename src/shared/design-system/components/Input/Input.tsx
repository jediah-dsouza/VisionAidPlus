import React, { forwardRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { semanticTokens } from '../../theme/semantic';
import { tokens } from '../../theme/tokens';

type InputSize = 'sm' | 'md' | 'lg';
type InputVariant = 'default' | 'outline' | 'filled' | 'ghost';

export type InputProps = React.ComponentPropsWithRef<typeof TextInput> & {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  size?: InputSize;
  variant?: InputVariant;
  fullWidth?: boolean;
  disabled?: boolean;
};

const sizeStyles: Record<InputSize, { container: ViewStyle; input: TextStyle }> = {
  sm: {
    container: { paddingVertical: 10, paddingHorizontal: 14 },
    input: { fontSize: 14 },
  },
  md: {
    container: { paddingVertical: 14, paddingHorizontal: 16 },
    input: { fontSize: 16 },
  },
  lg: {
    container: { paddingVertical: 18, paddingHorizontal: 20 },
    input: { fontSize: 18 },
  },
};

const variantStyles: Record<InputVariant, { container: ViewStyle; input: TextStyle }> = {
  default: {
    container: {
      backgroundColor: semanticTokens.colors.surface.default,
      borderWidth: 1,
      borderColor: semanticTokens.colors.border.default,
    },
    input: { color: semanticTokens.colors.foreground.default },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: semanticTokens.colors.border.default,
    },
    input: { color: semanticTokens.colors.foreground.default },
  },
  filled: {
    container: {
      backgroundColor: semanticTokens.colors.surface.elevated,
      borderWidth: 0,
    },
    input: { color: semanticTokens.colors.foreground.default },
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
    input: { color: semanticTokens.colors.foreground.default },
  },
};

export const Input = forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftElement,
      rightElement,
      size = 'md',
      variant = 'default',
      fullWidth = false,
      disabled,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const reducedMotion = useReducedMotion();

    const hasError = !!error;
    const isDisabled = disabled;

    const handleFocus = (e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const containerStyle: ViewStyle = {
      ...variantStyles[variant].container,
      ...sizeStyles[size].container,
      ...(fullWidth && { width: '100%' }),
      borderColor: hasError
        ? semanticTokens.colors.danger.default
        : isFocused
          ? semanticTokens.colors.primary.default
          : variantStyles[variant].container.borderColor,
      opacity: isDisabled ? 0.5 : 1,
    };

    return (
      <View style={[styles.wrapper, fullWidth && styles.fullWidth]}>
        {label && (
          <Text style={styles.label} accessibilityRole="text">
            {label}
          </Text>
        )}
        <View style={[styles.container, containerStyle]}>
          {leftElement && <View style={styles.leftElement}>{leftElement}</View>}
          <TextInput
            ref={ref}
            style={[styles.input, variantStyles[variant].input, sizeStyles[size].input]}
            placeholderTextColor={semanticTokens.colors.foreground.subtle}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!isDisabled}
            accessibilityLabel={label}
            accessibilityHint={hint}
            accessibilityState={{ disabled: isDisabled }}
            {...props}
          />
          {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
        </View>
        {error && (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        )}
        {hint && !error && <Text style={styles.hint}>{hint}</Text>}
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: {
    gap: tokens.spacing[2],
  },
  fullWidth: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: semanticTokens.radius.input,
    minHeight: semanticTokens.touchTarget.minimum,
  },
  input: {
    flex: 1,
    padding: 0,
  },
  leftElement: {
    marginRight: tokens.spacing[3],
  },
  rightElement: {
    marginLeft: tokens.spacing[3],
  },
  label: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
  },
  error: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.danger.default,
  },
  hint: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.subtle,
  },
});
