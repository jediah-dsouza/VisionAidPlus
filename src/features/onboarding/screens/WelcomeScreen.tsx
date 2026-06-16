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
    <View style={styles.featureIconWrapper}>
      <View style={styles.featureIconGlow} />
      <View style={styles.featureIcon}>
        <Text style={styles.featureIconText}>{icon}</Text>
      </View>
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
    <View style={styles.root}>
      <View style={styles.gradientOverlay}>
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
      </View>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoOuter}>
            <View style={styles.logoGlow} />
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>VA+</Text>
            </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B1121',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#0F172A',
    opacity: 0.6,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: '#1E293B',
    opacity: 0.15,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[10],
  },
  logoOuter: {
    position: 'relative',
    marginBottom: tokens.spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: semanticTokens.colors.primary.default,
    opacity: 0.2,
    transform: [{ scale: 1.3 }],
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: semanticTokens.colors.primary.default,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: semanticTokens.colors.primary.default,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  logoText: {
    fontSize: 34,
    fontWeight: tokens.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: tokens.fontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: tokens.spacing[3],
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: semanticTokens.fontSize.lg,
    color: semanticTokens.colors.foreground.muted,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: tokens.spacing[8],
    letterSpacing: 0.2,
  },
  features: {
    gap: tokens.spacing[4],
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: '#1A2332',
    borderRadius: 16,
    padding: tokens.spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  featureIconWrapper: {
    position: 'relative',
    marginRight: tokens.spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconGlow: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: semanticTokens.colors.primary.default,
    opacity: 0.1,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureIconText: {
    fontSize: 22,
  },
  featureContent: {
    flex: 1,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: '#FFFFFF',
    marginBottom: tokens.spacing[1],
  },
  featureDescription: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    lineHeight: 20,
  },
  footer: {
    padding: tokens.spacing[6],
    gap: tokens.spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
});

export default WelcomeScreen;
