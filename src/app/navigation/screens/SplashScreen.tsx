import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@app/providers/ThemeProvider';
import { tokens, semanticTokens } from '@shared/design-system/theme';

export const SplashScreen: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.logo}>👁️</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>VisionAid+</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Navigate with confidence
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacing[4],
  },
  logo: {
    fontSize: 80,
  },
  title: {
    fontSize: semanticTokens.fontSize['4xl'],
    fontWeight: tokens.fontWeight.bold,
  },
  subtitle: {
    fontSize: semanticTokens.fontSize.lg,
  },
});
