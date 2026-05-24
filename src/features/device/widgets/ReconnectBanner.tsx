import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';

interface ReconnectBannerProps {
  currentAttempt: number;
  maxAttempts: number;
  timeUntilNextAttempt: number | null;
  onDismiss: () => void;
}

export const ReconnectBanner: React.FC<ReconnectBannerProps> = ({
  currentAttempt,
  maxAttempts,
  timeUntilNextAttempt,
  onDismiss,
}) => (
  <View
    style={styles.container}
    accessibilityRole="alert"
    accessibilityLabel={`Reconnecting. Attempt ${currentAttempt} of ${maxAttempts}.`}
    accessibilityLiveRegion="assertive">
    <View style={styles.content}>
      <Text style={styles.icon}>🔄</Text>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Reconnecting...</Text>
        <Text style={styles.subtitle}>
          Attempt {currentAttempt} of {maxAttempts}
          {timeUntilNextAttempt !== null &&
            ` · retry in ${(timeUntilNextAttempt / 1000).toFixed(0)}s`}
        </Text>
      </View>
      <Pressable
        onPress={onDismiss}
        style={styles.dismissButton}
        accessibilityRole="button"
        accessibilityLabel="Dismiss reconnection"
        hitSlop={8}>
        <Text style={styles.dismissText}>✕</Text>
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: semanticTokens.colors.warning.muted,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: semanticTokens.colors.warning.subtle,
    padding: tokens.spacing[3],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.warning.default,
  },
  subtitle: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    marginTop: 2,
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: semanticTokens.colors.surface.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 14,
    color: semanticTokens.colors.foreground.muted,
  },
});
