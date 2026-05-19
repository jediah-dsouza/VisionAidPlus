import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { semanticTokens } from '../../theme/semantic';
import { tokens } from '../../theme/tokens';

type LoaderSize = 'sm' | 'md' | 'lg' | 'xl';
type LoaderVariant = 'primary' | 'secondary' | 'white' | 'muted';

interface LoaderProps {
  size?: LoaderSize;
  variant?: LoaderVariant;
  label?: string;
  fullScreen?: boolean;
}

const sizeMap: Record<LoaderSize, number> = {
  sm: 20,
  md: 32,
  lg: 48,
  xl: 64,
};

const variantColors: Record<LoaderVariant, string> = {
  primary: semanticTokens.colors.primary.default,
  secondary: semanticTokens.colors.secondary.default,
  white: '#FFFFFF',
  muted: semanticTokens.colors.foreground.muted,
};

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  variant = 'primary',
  label,
  fullScreen = false,
}) => {
  const reducedMotion = useReducedMotion();
  const color = variantColors[variant];

  const content = (
    <View style={styles.container}>
      <ActivityIndicator
        size={reducedMotion ? 'large' : 'small'}
        color={color}
        style={[styles.indicator, { width: sizeMap[size], height: sizeMap[size] }]}
      />
      {label && (
        <Text style={[styles.label, { color }]} accessibilityRole="progressbar">
          {label}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return <View style={styles.fullScreen}>{content}</View>;
  }

  return content;
};

interface LoadingOverlayProps {
  visible: boolean;
  label?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, label }) => {
  if (!visible) return null;

  return (
    <View
      style={styles.overlay}
      accessibilityRole="progressbar"
      accessibilityLabel={label || 'Loading'}>
      <Loader size="lg" variant="white" label={label} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[3],
  },
  indicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
    textAlign: 'center',
  },
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});
