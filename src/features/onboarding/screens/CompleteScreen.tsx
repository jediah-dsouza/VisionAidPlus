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
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>🎉</Text>
        </View>
        <Text style={styles.title}>You're All Set!</Text>
        <Text style={styles.subtitle}>
          VisionAid+ is ready to help you navigate the world with confidence
        </Text>

        <View style={styles.checklist}>
          <View style={styles.checklistItem}>
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
            <Text style={styles.checklistText}>Permissions configured</Text>
          </View>
          <View style={styles.checklistItem}>
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
            <Text style={styles.checklistText}>Device connected</Text>
          </View>
          <View style={styles.checklistItem}>
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
            <Text style={styles.checklistText}>Accessibility settings optimized</Text>
          </View>
        </View>

        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>Quick Tip</Text>
          <Text style={styles.tipText}>
            You can access emergency features by tapping the emergency button on the home screen or
            using the voice command "Emergency"
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button variant="primary" size="lg" fullWidth onPress={handleComplete}>
          Start Using VisionAid+
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
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: tokens.spacing[6],
  },
  iconText: {
    fontSize: 64,
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
    marginBottom: tokens.spacing[8],
  },
  checklist: {
    gap: tokens.spacing[3],
    marginBottom: tokens.spacing[8],
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: semanticTokens.colors.success.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing[3],
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontWeight: tokens.fontWeight.bold,
    fontSize: 14,
  },
  checklistText: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.default,
  },
  tipBox: {
    padding: tokens.spacing[4],
    backgroundColor: semanticTokens.colors.info.subtle,
    borderRadius: semanticTokens.radius.lg,
    borderWidth: 1,
    borderColor: semanticTokens.colors.info.default,
  },
  tipTitle: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.info.default,
    marginBottom: tokens.spacing[2],
  },
  tipText: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.default,
    lineHeight: 22,
  },
  footer: {
    padding: tokens.spacing[6],
    borderTopWidth: 1,
    borderTopColor: semanticTokens.colors.border.default,
  },
});

export default CompleteScreen;
