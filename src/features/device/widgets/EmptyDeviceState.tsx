import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@shared/design-system';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';

interface EmptyDeviceStateProps {
  isScanning: boolean;
  hasError: boolean;
  errorMessage?: string | null;
  onScan: () => void;
  onRetry: () => void;
}

export const EmptyDeviceState: React.FC<EmptyDeviceStateProps> = ({
  isScanning,
  hasError,
  errorMessage,
  onScan,
  onRetry,
}) => {
  if (isScanning) return null;

  return (
    <View
      style={styles.container}
      accessibilityRole="text"
      accessibilityLabel={hasError ? (errorMessage ?? 'Error state') : 'No devices found'}>
      <Text style={styles.icon}>{hasError ? '⚠️' : '📱'}</Text>
      <Text style={styles.title} accessibilityRole="header">
        {hasError ? 'Connection Error' : 'No Devices Found'}
      </Text>
      <Text style={styles.description}>
        {hasError
          ? (errorMessage ?? 'An error occurred while scanning.')
          : 'Make sure your VisionAid device is powered on and in pairing mode.'}
      </Text>
      <Button
        variant={hasError ? 'primary' : 'outline'}
        size="md"
        onPress={hasError ? onRetry : onScan}
        accessibilityLabel={hasError ? 'Retry scan' : 'Scan again'}>
        {hasError ? 'Retry' : 'Scan Again'}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: semanticTokens.spacing.container,
    gap: tokens.spacing[4],
  },
  icon: {
    fontSize: 48,
    marginBottom: tokens.spacing[2],
  },
  title: {
    fontSize: semanticTokens.fontSize.xl,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
    textAlign: 'center',
  },
  description: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.subtle,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: tokens.spacing[2],
  },
});
