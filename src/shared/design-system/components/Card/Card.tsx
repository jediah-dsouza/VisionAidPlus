import React, { forwardRef } from 'react';
import { View, StyleSheet, ViewProps, Pressable, ViewStyle } from 'react-native';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { semanticTokens } from '../../theme/semantic';
import { tokens } from '../../theme/tokens';

type CardVariant = 'default' | 'elevated' | 'outline' | 'ghost';
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  onPress?: () => void;
}

const variantStyles: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: semanticTokens.colors.surface.default,
  },
  elevated: {
    backgroundColor: semanticTokens.colors.surface.elevated,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: semanticTokens.colors.border.default,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
};

const paddingStyles: Record<CardPadding, number> = {
  none: 0,
  sm: tokens.spacing[3],
  md: tokens.spacing[4],
  lg: tokens.spacing[6],
  xl: tokens.spacing[8],
};

export const Card = forwardRef<React.ElementRef<typeof View>, CardProps>(
  (
    { variant = 'default', padding = 'md', interactive = false, style, children, ...props },
    ref,
  ) => {
    const reducedMotion = useReducedMotion();
    const hasPressHandler = interactive && props.onPress;

    if (hasPressHandler) {
      return (
        <Pressable
          ref={ref as any}
          style={({ pressed }) => [
            styles.container,
            variantStyles[variant],
            { padding: paddingStyles[padding] },
            !reducedMotion && pressed && styles.pressed,
            style,
          ]}
          onPress={props.onPress}
          accessibilityRole={interactive ? 'button' : 'none'}
          {...props}>
          {children}
        </Pressable>
      );
    }

    return (
      <View
        ref={ref}
        style={[
          styles.container,
          variantStyles[variant],
          { padding: paddingStyles[padding] },
          style,
        ]}
        {...props}
      />
    );
  },
);

Card.displayName = 'Card';

const styles = StyleSheet.create({
  container: {
    borderRadius: semanticTokens.radius.card,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
