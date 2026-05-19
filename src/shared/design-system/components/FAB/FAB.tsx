import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { semanticTokens } from '../../theme/semantic';
import { tokens } from '../../theme/tokens';

type FABSize = 'sm' | 'md' | 'lg';
type FABVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

interface FABProps {
  icon: React.ReactNode;
  onPress: () => void;
  label?: string;
  size?: FABSize;
  variant?: FABVariant;
  position?: 'bottomLeft' | 'bottomRight' | 'bottomCenter';
  disabled?: boolean;
}

const sizeMap: Record<FABSize, number> = {
  sm: 40,
  md: 56,
  lg: 72,
};

const iconSizeMap: Record<FABSize, number> = {
  sm: 20,
  md: 24,
  lg: 28,
};

const positionStyles: Record<string, ViewStyle> = {
  bottomLeft: {
    left: tokens.spacing[6],
    bottom: tokens.spacing[6],
  },
  bottomRight: {
    right: tokens.spacing[6],
    bottom: tokens.spacing[6],
  },
  bottomCenter: {
    alignSelf: 'center',
    bottom: tokens.spacing[6],
  },
};

const variantStyles: Record<FABVariant, ViewStyle> = {
  primary: {
    backgroundColor: semanticTokens.colors.primary.default,
  },
  secondary: {
    backgroundColor: semanticTokens.colors.secondary.default,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: semanticTokens.colors.primary.default,
  },
  ghost: {
    backgroundColor: semanticTokens.colors.surface.elevated,
  },
};

export const FAB: React.FC<FABProps> = ({
  icon,
  onPress,
  label,
  size = 'md',
  variant = 'primary',
  position = 'bottomRight',
  disabled = false,
}) => {
  const reducedMotion = useReducedMotion();

  const accessibilityLabel = label || 'Floating action button';

  return (
    <Pressable
      style={[
        styles.container,
        { width: sizeMap[size], height: sizeMap[size] },
        variantStyles[variant],
        positionStyles[position],
        reducedMotion && styles.noAnimation,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}>
      {icon}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: semanticTokens.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: semanticTokens.touchTarget.minimum,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  noAnimation: {
    transform: [],
  },
  disabled: {
    opacity: 0.5,
  },
});
