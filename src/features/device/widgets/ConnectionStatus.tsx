import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';

const STATE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  connected: {
    label: 'Connected',
    color: semanticTokens.colors.success.default,
    bg: semanticTokens.colors.success.muted,
  },
  connecting: {
    label: 'Connecting...',
    color: semanticTokens.colors.warning.default,
    bg: semanticTokens.colors.warning.muted,
  },
  disconnecting: {
    label: 'Disconnecting...',
    color: semanticTokens.colors.warning.default,
    bg: semanticTokens.colors.warning.muted,
  },
  reconnecting: {
    label: 'Reconnecting...',
    color: semanticTokens.colors.warning.default,
    bg: semanticTokens.colors.warning.muted,
  },
  scanning: {
    label: 'Scanning',
    color: semanticTokens.colors.info.default,
    bg: semanticTokens.colors.info.muted,
  },
  idle: {
    label: 'Disconnected',
    color: semanticTokens.colors.foreground.subtle,
    bg: semanticTokens.colors.surface.elevated,
  },
  disconnected: {
    label: 'Disconnected',
    color: semanticTokens.colors.foreground.subtle,
    bg: semanticTokens.colors.surface.elevated,
  },
  error: {
    label: 'Error',
    color: semanticTokens.colors.danger.default,
    bg: semanticTokens.colors.danger.muted,
  },
};

interface ConnectionStatusProps {
  connectionState: string;
  size?: 'sm' | 'md';
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connectionState,
  size = 'md',
}) => {
  const config = STATE_CONFIG[connectionState] ?? STATE_CONFIG.idle;
  const isLarge = size === 'md';

  return (
    <View
      style={[styles.container, { backgroundColor: config.bg }]}
      accessibilityRole="text"
      accessibilityLabel={`Device status: ${config.label}`}
      accessibilityLiveRegion="polite">
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }, !isLarge && styles.labelSmall]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.full,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
  },
  labelSmall: {
    fontSize: semanticTokens.fontSize.xs,
  },
});
