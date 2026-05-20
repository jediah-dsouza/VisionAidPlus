import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppSelector } from '@app/store';
import { Card, Button } from '@shared/design-system/components';
import { semanticTokens, tokens } from '@shared/design-system/theme';
import { WidgetStatus } from '../types';

interface AIStatusWidgetProps {
  onStartDetection?: () => void;
  onStopDetection?: () => void;
  compact?: boolean;
}

const getStatusFromState = (status: string): WidgetStatus => {
  switch (status) {
    case 'detecting':
    case 'processing':
      return 'connected';
    case 'warning':
    case 'danger':
      return 'connected';
    case 'idle':
    case 'offline':
      return 'disconnected';
    default:
      return 'disconnected';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'detecting':
      return 'Detecting';
    case 'processing':
      return 'Processing';
    case 'warning':
      return 'Warning';
    case 'danger':
      return 'Danger';
    case 'idle':
      return 'Idle';
    case 'offline':
      return 'Offline';
    default:
      return 'Unknown';
  }
};

export const AIStatusWidget: React.FC<AIStatusWidgetProps> = ({
  onStartDetection,
  onStopDetection,
  compact = false,
}) => {
  const { status, currentObstacle, detectionHistory } = useAppSelector(state => state.ai);

  const widgetStatus = useMemo(() => getStatusFromState(status), [status]);
  const statusLabel = useMemo(() => getStatusLabel(status), [status]);
  const isActive = status === 'detecting' || status === 'processing';
  const isDanger = status === 'danger' || status === 'warning';

  const statusColor = useMemo(() => {
    switch (status) {
      case 'danger':
        return semanticTokens.colors.danger.default;
      case 'warning':
        return semanticTokens.colors.warning.default;
      case 'detecting':
      case 'processing':
        return semanticTokens.colors.success.default;
      default:
        return semanticTokens.colors.neutral[500];
    }
  }, [status]);

  if (compact) {
    return (
      <View
        style={[
          styles.compactContainer,
          { borderColor: isDanger ? statusColor : semanticTokens.colors.neutral[600] },
        ]}
        accessibilityLabel={`AI detection ${statusLabel}`}
        accessibilityRole="text">
        <Text style={styles.compactIcon}>{isDanger ? '⚠️' : '🤖'}</Text>
        <View style={styles.compactContent}>
          <View style={styles.pulseContainer}>
            <View
              style={[
                styles.pulse,
                isActive
                  ? { backgroundColor: statusColor }
                  : { backgroundColor: semanticTokens.colors.neutral[600] },
              ]}
            />
          </View>
          <Text style={[styles.compactLabel, { color: statusColor }]}>
            {isActive ? `${detectionHistory.length}` : 'Off'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Card
      variant="elevated"
      padding="md"
      accessibilityLabel={`AI detection status: ${statusLabel}`}
      accessibilityRole="text">
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🤖</Text>
          {isActive && (
            <View style={[styles.activityIndicator, { backgroundColor: statusColor }]} />
          )}
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>AI Detection</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      {currentObstacle && (
        <View style={[styles.obstaclePreview, { borderColor: statusColor }]}>
          <Text style={styles.obstacleIcon}>
            {currentObstacle.severity === 'danger' ? '⚠️' : '🚧'}
          </Text>
          <View style={styles.obstacleInfo}>
            <Text style={styles.obstacleType}>{currentObstacle.type}</Text>
            <Text style={styles.obstacleDistance}>
              {currentObstacle.distance}cm {currentObstacle.direction}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{detectionHistory.length}</Text>
          <Text style={styles.statLabel}>Detections</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {currentObstacle ? `${currentObstacle.distance}cm` : '--'}
          </Text>
          <Text style={styles.statLabel}>Last Distance</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{currentObstacle?.direction || '--'}</Text>
          <Text style={styles.statLabel}>Direction</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {isActive ? (
          <Button
            variant="outline"
            size="sm"
            onPress={onStopDetection}
            accessibilityLabel="Stop detection">
            Stop
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onPress={onStartDetection}
            accessibilityLabel="Start detection">
            Start
          </Button>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing[2],
    borderRadius: semanticTokens.radius.md,
    borderWidth: 1,
    gap: tokens.spacing[2],
    minHeight: semanticTokens.touchTarget.minimum,
  },
  compactIcon: {
    fontSize: 20,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  pulseContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compactLabel: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  iconContainer: {
    position: 'relative',
  },
  icon: {
    fontSize: 28,
  },
  activityIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: semanticTokens.colors.surface.default,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.full,
    gap: tokens.spacing[1],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: semanticTokens.fontSize.xs,
    fontWeight: tokens.fontWeight.medium,
  },
  obstaclePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
    marginTop: tokens.spacing[4],
    padding: tokens.spacing[3],
    borderRadius: semanticTokens.radius.md,
    borderWidth: 1,
    backgroundColor: semanticTokens.colors.surface.elevated,
  },
  obstacleIcon: {
    fontSize: 24,
  },
  obstacleInfo: {
    flex: 1,
  },
  obstacleType: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
    textTransform: 'capitalize',
  },
  obstacleDistance: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: tokens.spacing[4],
    paddingTop: tokens.spacing[4],
    borderTopWidth: 1,
    borderTopColor: semanticTokens.colors.border.default,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: semanticTokens.fontSize.xl,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
  },
  statLabel: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
    marginTop: tokens.spacing[1],
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: tokens.spacing[4],
  },
});
