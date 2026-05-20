import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAppSelector } from '@app/store';
import { semanticTokens, tokens } from '@shared/design-system/theme';
import { accessibilityEngine } from '@core/accessibility';
import type { ObstacleDetection } from '@shared/types';

interface AIInstructionBannerProps {
  obstacle?: ObstacleDetection | null;
  autoDismissDelay?: number;
  onDismiss?: () => void;
}

export const AIInstructionBanner: React.FC<AIInstructionBannerProps> = ({
  obstacle,
  autoDismissDelay = 5000,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState<string | null>(null);

  useEffect(() => {
    if (obstacle?.voiceInstruction) {
      setCurrentInstruction(obstacle.voiceInstruction);
      setIsVisible(true);

      accessibilityEngine.announce(obstacle.voiceInstruction, 'high');

      if (autoDismissDelay > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          onDismiss?.();
        }, autoDismissDelay);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
      setCurrentInstruction(null);
    }
  }, [obstacle, autoDismissDelay, onDismiss]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  const handleReplay = useCallback(() => {
    if (currentInstruction) {
      accessibilityEngine.announce(currentInstruction, 'high');
    }
  }, [currentInstruction]);

  if (!isVisible || !currentInstruction) {
    return null;
  }

  const severity = obstacle?.severity ?? 'safe';
  const bannerStyle = getBannerStyle(severity);

  return (
    <View
      style={[styles.container, { backgroundColor: bannerStyle.bgColor }]}
      accessibilityLabel={`AI instruction: ${currentInstruction}`}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite">
      <View style={styles.iconContainer}>
        <Text style={[styles.icon, { color: bannerStyle.iconColor }]}>
          {severity === 'danger' ? '⚠️' : severity === 'caution' ? '🔔' : '💡'}
        </Text>
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.label, { color: bannerStyle.iconColor }]}>{bannerStyle.label}</Text>
        <Text style={styles.instruction} numberOfLines={2}>
          {currentInstruction}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.actionButton}
          onPress={handleReplay}
          accessibilityRole="button"
          accessibilityLabel="Replay instruction">
          <Text style={[styles.actionIcon, { color: bannerStyle.iconColor }]}>🔊</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss instruction">
          <Text style={[styles.actionIcon, { color: bannerStyle.iconColor }]}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
};

const getBannerStyle = (severity: ObstacleDetection['severity']) => {
  switch (severity) {
    case 'danger':
      return {
        bgColor: semanticTokens.colors.danger.subtle,
        iconColor: semanticTokens.colors.danger.default,
        label: 'DANGER',
      };
    case 'caution':
      return {
        bgColor: semanticTokens.colors.warning.subtle,
        iconColor: semanticTokens.colors.warning.default,
        label: 'CAUTION',
      };
    default:
      return {
        bgColor: semanticTokens.colors.success.subtle,
        iconColor: semanticTokens.colors.success.default,
        label: 'INFO',
      };
  }
};

interface AIInstructionBannerVerticalProps {
  instruction: string;
  severity?: ObstacleDetection['severity'];
  onReplay?: () => void;
  onDismiss?: () => void;
}

export const AIInstructionBannerVertical: React.FC<AIInstructionBannerVerticalProps> = ({
  instruction,
  severity = 'safe',
  onReplay,
  onDismiss,
}) => {
  const bannerStyle = getBannerStyle(severity);

  return (
    <View
      style={[styles.verticalContainer, { backgroundColor: bannerStyle.bgColor }]}
      accessibilityLabel={`AI instruction: ${instruction}`}
      accessibilityRole="alert">
      <View style={styles.verticalHeader}>
        <Text style={[styles.verticalIcon, { color: bannerStyle.iconColor }]}>
          {severity === 'danger' ? '⚠️' : severity === 'caution' ? '🔔' : '💡'}
        </Text>
        <Text style={[styles.verticalLabel, { color: bannerStyle.iconColor }]}>
          {bannerStyle.label}
        </Text>
      </View>

      <Text style={styles.verticalInstruction}>{instruction}</Text>

      <View style={styles.verticalActions}>
        {onReplay && (
          <Pressable
            style={styles.verticalActionButton}
            onPress={onReplay}
            accessibilityRole="button"
            accessibilityLabel="Replay instruction">
            <Text style={[styles.verticalActionText, { color: bannerStyle.iconColor }]}>
              🔊 Replay
            </Text>
          </Pressable>
        )}

        {onDismiss && (
          <Pressable
            style={styles.verticalActionButton}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel="Dismiss">
            <Text style={[styles.verticalActionText, { color: bannerStyle.iconColor }]}>
              Dismiss
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing[4],
    borderRadius: semanticTokens.radius.lg,
    gap: tokens.spacing[3],
    minHeight: semanticTokens.touchTarget.minimum,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  contentContainer: {
    flex: 1,
  },
  label: {
    fontSize: semanticTokens.fontSize.xs,
    fontWeight: tokens.fontWeight.bold,
    marginBottom: tokens.spacing[1],
  },
  instruction: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
  },
  actionButton: {
    width: semanticTokens.touchTarget.minimum,
    height: semanticTokens.touchTarget.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 18,
  },
  verticalContainer: {
    padding: tokens.spacing[4],
    borderRadius: semanticTokens.radius.lg,
    gap: tokens.spacing[3],
  },
  verticalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  verticalIcon: {
    fontSize: 20,
  },
  verticalLabel: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.bold,
  },
  verticalInstruction: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.default,
  },
  verticalActions: {
    flexDirection: 'row',
    gap: tokens.spacing[4],
  },
  verticalActionButton: {
    minHeight: semanticTokens.touchTarget.minimum,
    justifyContent: 'center',
  },
  verticalActionText: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
  },
});
