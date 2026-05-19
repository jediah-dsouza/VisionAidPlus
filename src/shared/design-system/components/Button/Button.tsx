import React, { forwardRef } from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  PressableProps,
} from 'react-native';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { semanticTokens } from '../../theme/semantic';
import { tokens } from '../../theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: semanticTokens.colors.primary.default },
    text: { color: '#FFFFFF' },
  },
  secondary: {
    container: { backgroundColor: semanticTokens.colors.secondary.default },
    text: { color: '#FFFFFF' },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: semanticTokens.colors.primary.default,
    },
    text: { color: semanticTokens.colors.primary.default },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: semanticTokens.colors.primary.default },
  },
  danger: {
    container: { backgroundColor: semanticTokens.colors.danger.default },
    text: { color: '#FFFFFF' },
  },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { paddingVertical: 10, paddingHorizontal: 16 },
    text: { fontSize: 14 },
  },
  md: {
    container: { paddingVertical: 14, paddingHorizontal: 20 },
    text: { fontSize: 16 },
  },
  lg: {
    container: { paddingVertical: 18, paddingHorizontal: 24 },
    text: { fontSize: 18 },
  },
  xl: {
    container: { paddingVertical: 22, paddingHorizontal: 28 },
    text: { fontSize: 20 },
  },
};

export const Button = forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      onPress,
      ...props
    },
    ref,
  ) => {
    const reducedMotion = useReducedMotion();
    const isDisabled = disabled || isLoading;

    const containerStyle: ViewStyle = {
      ...variantStyles[variant].container,
      ...sizeStyles[size].container,
      ...(fullWidth && { width: '100%' }),
      opacity: isDisabled ? 0.5 : 1,
    };

    const textStyle: TextStyle = {
      ...variantStyles[variant].text,
      ...sizeStyles[size].text,
      fontWeight: tokens.fontWeight.semibold,
    };

    const animationStyle = reducedMotion ? { transform: [{ scale: 1 }] } : {};

    return (
      <Pressable
        ref={ref}
        style={[styles.container, containerStyle, animationStyle]}
        disabled={isDisabled}
        onPress={isLoading ? undefined : onPress}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: isLoading }}
        accessibilityLabel={typeof children === 'string' ? children : undefined}
        {...props}>
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={
              variant === 'outline' || variant === 'ghost'
                ? semanticTokens.colors.primary.default
                : '#FFFFFF'
            }
          />
        ) : (
          <>
            {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
            <Text style={[styles.text, textStyle]}>{children}</Text>
            {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
          </>
        )}
      </Pressable>
    );
  },
);

Button.displayName = 'Button';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: semanticTokens.radius.button,
    minHeight: semanticTokens.touchTarget.minimum,
  },
  text: {
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
