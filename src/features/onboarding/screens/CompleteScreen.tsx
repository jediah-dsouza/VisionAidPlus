import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@shared/design-system/components';
import { tokens, semanticTokens } from '@shared/design-system/theme';
import { useOnboarding } from '../hooks/useOnboarding';
import { navigationGuard } from '../../../app/navigation/utils/navigationGuards';

export const CompleteScreen: React.FC = () => {
  const { complete } = useOnboarding();

  const handleComplete = useCallback(() => {
    complete();
    navigationGuard.navigate('Main');
  }, [complete]);

  return (
    <View style={styles.root}>
      <View style={styles.gradientOverlay}>
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
      </View>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconOuter}>
            <View style={styles.iconGlow} />
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>🎉</Text>
            </View>
          </View>
          <Text style={styles.title}>You're All Set!</Text>
          <Text style={styles.subtitle}>
            VisionAid+ is ready to help you navigate the world with confidence
          </Text>

          <View style={styles.checklistCard}>
            <View style={styles.checklist}>
              <View style={styles.checklistItem}>
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
                <Text style={styles.checklistText}>Permissions configured</Text>
              </View>
              <View style={styles.checklistDivider} />
              <View style={styles.checklistItem}>
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
                <Text style={styles.checklistText}>Device connected</Text>
              </View>
              <View style={styles.checklistDivider} />
              <View style={styles.checklistItem}>
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
                <Text style={styles.checklistText}>Accessibility settings optimized</Text>
              </View>
            </View>
          </View>

          <View style={styles.tipBox}>
            <View style={styles.tipHeader}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipTitle}>Quick Tip</Text>
            </View>
            <Text style={styles.tipText}>
              You can access emergency features by tapping the emergency button on the home screen
              or using the voice command "Emergency"
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Button variant="primary" size="lg" fullWidth onPress={handleComplete}>
            Start Using VisionAid+
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
    paddingVertical: tokens.spacing[8],
    justifyContent: 'center',
  },
  iconOuter: {
    position: 'relative',
    marginBottom: tokens.spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3B82F6',
    opacity: 0.15,
    transform: [{ scale: 1.3 }],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A2332',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  iconText: {
    fontSize: 40,
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
  checklistCard: {
    backgroundColor: '#1A2332',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: tokens.spacing[6],
  },
  checklist: {
    gap: 0,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing[4],
  },
  checklistDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: tokens.spacing[4],
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing[3],
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontWeight: tokens.fontWeight.bold,
    fontSize: 13,
  },
  checklistText: {
    fontSize: semanticTokens.fontSize.base,
    color: '#FFFFFF',
    fontWeight: tokens.fontWeight.medium,
  },
  tipBox: {
    padding: tokens.spacing[5],
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing[2],
    gap: tokens.spacing[2],
  },
  tipIcon: {
    fontSize: 16,
  },
  tipTitle: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: '#60A5FA',
  },
  tipText: {
    fontSize: semanticTokens.fontSize.sm,
    color: '#CBD5E1',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  footer: {
    padding: tokens.spacing[6],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
});

export default CompleteScreen;
