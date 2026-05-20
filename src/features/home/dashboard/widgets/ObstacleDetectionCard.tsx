import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Button } from '@shared/design-system/components';
import { semanticTokens, tokens } from '@shared/design-system/theme';
import { accessibilityEngine } from '@core/accessibility';
import type { ObstacleDetection } from '@shared/types';

interface ObstacleDetectionCardProps {
  obstacle: ObstacleDetection;
  isNew?: boolean;
  onDismiss?: () => void;
  onRetry?: () => void;
  compact?: boolean;
}

const getSeverityConfig = (severity: ObstacleDetection['severity']) => {
  switch (severity) {
    case 'danger':
      return {
        color: semanticTokens.colors.danger.default,
        bgColor: semanticTokens.colors.danger.subtle,
        icon: '⚠️',
        label: 'Danger',
        priority: 'critical',
      };
    case 'caution':
      return {
        color: semanticTokens.colors.warning.default,
        bgColor: semanticTokens.colors.warning.subtle,
        icon: '⚠',
        label: 'Caution',
        priority: 'high',
      };
    case 'safe':
    default:
      return {
        color: semanticTokens.colors.success.default,
        bgColor: semanticTokens.colors.success.subtle,
        icon: '✓',
        label: 'Safe',
        priority: 'normal',
      };
  }
};

const getDirectionIcon = (direction: ObstacleDetection['direction']) => {
  switch (direction) {
    case 'left':
      return '◀';
    case 'right':
      return '▶';
    case 'center':
    default:
      return '●';
  }
};

const formatDistance = (distance: number): string => {
  if (distance >= 100) {
    return `${(distance / 100).toFixed(1)}m`;
  }
  return `${distance}cm`;
};

export const ObstacleDetectionCard: React.FC<ObstacleDetectionCardProps> = ({
  obstacle,
  isNew = false,
  onDismiss,
  onRetry,
  compact = false,
}) => {
  const severityConfig = useMemo(() => getSeverityConfig(obstacle.severity), [obstacle.severity]);
  const directionIcon = useMemo(() => getDirectionIcon(obstacle.direction), [obstacle.direction]);
  const formattedDistance = useMemo(() => formatDistance(obstacle.distance), [obstacle.distance]);

  const handleDismiss = useCallback(() => {
    if (onDismiss) {
      accessibilityEngine.announce('Obstacle dismissed', 'high');
      onDismiss();
    }
  }, [onDismiss]);

  const accessibilityLabel = useMemo(
    () =>
      `${obstacle.severity} obstacle: ${obstacle.type}, ${formattedDistance} away, on your ${obstacle.direction}`,
    [obstacle, formattedDistance],
  );

  if (compact) {
    return (
      <View
        style={[styles.compactContainer, { backgroundColor: severityConfig.bgColor }]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="alert">
        <Text style={[styles.compactIcon, { color: severityConfig.color }]}>
          {severityConfig.icon}
        </Text>
        <View style={styles.compactContent}>
          <Text style={styles.compactType}>{obstacle.type}</Text>
          <Text style={styles.compactDistance}>{formattedDistance}</Text>
        </View>
      </View>
    );
  }

  return (
    <Card
      variant="elevated"
      padding="md"
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="alert">
      <View style={[styles.header, { backgroundColor: severityConfig.bgColor }]}>
        <Text style={[styles.icon, { color: severityConfig.color }]}>{severityConfig.icon}</Text>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.type, { color: severityConfig.color }]}>{obstacle.type}</Text>
            <View style={[styles.severityBadge, { backgroundColor: `${severityConfig.color}20` }]}>
              <Text style={[styles.severityLabel, { color: severityConfig.color }]}>
                {severityConfig.label}
              </Text>
            </View>
          </View>
          {isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newLabel}>NEW</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceValue}>{obstacle.distance}</Text>
          <Text style={styles.distanceUnit}>cm</Text>
        </View>

        <View style={styles.directionContainer}>
          <Text style={styles.directionLabel}>Direction</Text>
          <View style={styles.directionDisplay}>
            <Text
              style={[
                styles.directionIcon,
                obstacle.direction === 'center' && { color: severityConfig.color },
              ]}>
              ◀
            </Text>
            <View
              style={[
                styles.directionCenter,
                obstacle.direction === 'center' && { backgroundColor: severityConfig.color },
              ]}>
              <Text
                style={[
                  styles.directionCenterText,
                  obstacle.direction === 'center' && { color: '#FFFFFF' },
                ]}>
                {directionIcon}
              </Text>
            </View>
            <Text
              style={[
                styles.directionIcon,
                obstacle.direction === 'center' && { color: severityConfig.color },
              ]}>
              ▶
            </Text>
          </View>
          <Text style={styles.directionText}>{obstacle.direction}</Text>
        </View>
      </View>

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionLabel}>Voice Instruction</Text>
        <Text style={styles.instructionText}>{obstacle.voiceInstruction}</Text>
      </View>

      <View style={styles.timestampContainer}>
        <Text style={styles.timestamp}>{new Date(obstacle.timestamp).toLocaleTimeString()}</Text>
      </View>

      <View style={styles.actions}>
        <Button variant="ghost" size="sm" onPress={handleDismiss} accessibilityLabel="Dismiss">
          Dismiss
        </Button>
      </View>
    </Card>
  );
};

export const ObstacleDetectionCardList: React.FC<{
  obstacles: ObstacleDetection[];
  maxItems?: number;
  onDismiss?: (index: number) => void;
}> = ({ obstacles, maxItems = 5, onDismiss }) => {
  const displayObstacles = obstacles.slice(0, maxItems);

  return (
    <View
      style={styles.listContainer}
      accessibilityLabel={`${displayObstacles.length} obstacles detected`}>
      {displayObstacles.map((obstacle, index) => (
        <ObstacleDetectionCard
          key={`${obstacle.timestamp}-${index}`}
          obstacle={obstacle}
          isNew={index === 0}
          onDismiss={onDismiss ? () => onDismiss(index) : undefined}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing[2],
    borderRadius: semanticTokens.radius.md,
    gap: tokens.spacing[2],
    minHeight: semanticTokens.touchTarget.minimum,
  },
  compactIcon: {
    fontSize: 20,
  },
  compactContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactType: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
    textTransform: 'capitalize',
  },
  compactDistance: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
    padding: tokens.spacing[3],
    borderRadius: semanticTokens.radius.md,
    marginBottom: tokens.spacing[4],
  },
  icon: {
    fontSize: 28,
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  type: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.bold,
    textTransform: 'capitalize',
  },
  severityBadge: {
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.full,
  },
  severityLabel: {
    fontSize: semanticTokens.fontSize.xs,
    fontWeight: tokens.fontWeight.medium,
  },
  newBadge: {
    marginTop: tokens.spacing[1],
    backgroundColor: semanticTokens.colors.primary.default,
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: 2,
    borderRadius: tokens.radius.sm,
    alignSelf: 'flex-start',
  },
  newLabel: {
    fontSize: 10,
    fontWeight: tokens.fontWeight.bold,
    color: '#FFFFFF',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  distanceValue: {
    fontSize: semanticTokens.fontSize['3xl'],
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
  },
  distanceUnit: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
    marginLeft: tokens.spacing[1],
  },
  directionContainer: {
    alignItems: 'center',
  },
  directionLabel: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
    marginBottom: tokens.spacing[1],
  },
  directionDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  directionIcon: {
    fontSize: 16,
    color: semanticTokens.colors.neutral[500],
  },
  directionCenter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: semanticTokens.colors.neutral[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  directionCenterText: {
    fontSize: 14,
    color: semanticTokens.colors.foreground.muted,
  },
  directionText: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
    marginTop: tokens.spacing[1],
    textTransform: 'capitalize',
  },
  instructionContainer: {
    marginTop: tokens.spacing[4],
    padding: tokens.spacing[3],
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderRadius: semanticTokens.radius.md,
  },
  instructionLabel: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
    marginBottom: tokens.spacing[1],
  },
  instructionText: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.default,
    fontWeight: tokens.fontWeight.medium,
  },
  timestampContainer: {
    marginTop: tokens.spacing[3],
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.subtle,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: tokens.spacing[3],
  },
  listContainer: {
    gap: tokens.spacing[3],
  },
});
