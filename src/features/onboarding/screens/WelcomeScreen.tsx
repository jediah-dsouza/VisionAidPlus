import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Button } from '@shared/design-system/components';
import { tokens, semanticTokens } from '@shared/design-system/theme';
import { navigationGuard } from '../../../app/navigation/utils/navigationGuards';

const FeatureItem: React.FC<{ icon: string; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Text style={styles.featureIconText}>{icon}</Text>
    </View>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

export const WelcomeScreen: React.FC = () => {
  const handleContinue = useCallback(() => {
    navigationGuard.navigate('Onboarding', { screen: 'Permissions' });
  }, []);

  const handleSkip = useCallback(() => {
    navigationGuard.navigate('Auth', { screen: 'Login' });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>VA+</Text>
        </View>
        <Text style={styles.title}>Welcome to VisionAid+</Text>
        <Text style={styles.subtitle}>
          Your AI-powered navigation companion designed specifically for visually impaired users
        </Text>

        <View style={styles.features}>
          <FeatureItem
            icon="👁️"
            title="Object Detection"
            description="Real-time obstacle detection and navigation assistance"
          />
          <FeatureItem
            icon="🔊"
            title="Voice Guidance"
            description="Clear audio feedback for navigation and alerts"
          />
          <FeatureItem
            icon="🆘"
            title="Emergency Response"
            description="Quick access to emergency contacts and alerts"
          />
          <FeatureItem
            icon="📍"
            title="Location Services"
            description="GPS navigation with accessible directions"
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Button variant="primary" size="lg" fullWidth onPress={handleContinue}>
          Get Started
        </Button>
        <Button variant="ghost" size="md" onPress={handleSkip}>
          Already have an account? Sign In
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticTokens.colors.background.default,
  },
  content: {
    flex: 1,
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[8],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: semanticTokens.colors.primary.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing[6],
    alignSelf: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: tokens.fontWeight.bold,
    color: '#FFFFFF',
  },
  title: {
    fontSize: semanticTokens.fontSize['3xl'],
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
    textAlign: 'center',
    marginBottom: tokens.spacing[3],
  },
  subtitle: {
    fontSize: semanticTokens.fontSize.lg,
    color: semanticTokens.colors.foreground.muted,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: tokens.spacing[6],
  },
  features: {
    gap: tokens.spacing[4],
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: semanticTokens.colors.background.subtle,
    borderRadius: semanticTokens.radius.lg,
    padding: tokens.spacing[4],
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: semanticTokens.colors.primary.subtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing[4],
  },
  featureIconText: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
    marginBottom: tokens.spacing[1],
  },
  featureDescription: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  footer: {
    padding: tokens.spacing[6],
    gap: tokens.spacing[3],
    borderTopWidth: 1,
    borderTopColor: semanticTokens.colors.border.default,
  },
});

export default WelcomeScreen;
