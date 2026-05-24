import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppSelector } from '@app/store';
import { Card } from '@shared/design-system';
import { semanticTokens, tokens } from '@shared/design-system/theme';

interface AnalyticsSessionWidgetProps {
  compact?: boolean;
}

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hrs = Math.floor(min / 60);
  if (hrs > 0) return `${hrs}h ${min % 60}m ${sec % 60}s`;
  if (min > 0) return `${min}m ${sec % 60}s`;
  return `${sec}s`;
}

export const AnalyticsSessionWidget: React.FC<AnalyticsSessionWidgetProps> = React.memo(
  ({ compact = false }) => {
    const session = useAppSelector(
      state => state.analytics?.metrics.session ?? null,
    );
    const isActive = useAppSelector(state => state.analytics?.isActive ?? false);

    if (!session) {
      return (
        <Card
          variant="default"
          padding="md"
          accessibilityLabel="Session data not available">
          <View style={styles.inactiveContainer}>
            <View
              style={[styles.activeDot, { backgroundColor: semanticTokens.colors.foreground.subtle }]}
            />
            <Text style={styles.emptyText}>No active session</Text>
          </View>
        </Card>
      );
    }

    if (compact) {
      return (
        <View
          style={styles.compactContainer}
          accessibilityLabel={`Session ${isActive ? 'active' : 'ended'}, ${formatDuration(session.duration)}`}
          accessibilityRole="text">
          <View
            style={[
              styles.compactDot,
              { backgroundColor: isActive ? semanticTokens.colors.success.default : semanticTokens.colors.foreground.subtle },
            ]}
          />
          <Text style={styles.compactValue}>
            {formatDuration(session.duration)}
          </Text>
        </View>
      );
    }

    return (
      <Card
        variant="elevated"
        padding="md"
        accessibilityLabel={`Session ${isActive ? 'active' : 'ended'} widget`}
        accessibilityRole="text">
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View
              style={[
                styles.activeDot,
                { backgroundColor: isActive ? semanticTokens.colors.success.default : semanticTokens.colors.foreground.subtle },
              ]}
            />
            <Text style={styles.title}>
              {isActive ? 'Session Active' : 'Session Ended'}
            </Text>
          </View>
          <Text style={styles.sessionId} numberOfLines={1}>
            {session.sessionId.slice(0, 12)}...
          </Text>
        </View>
        <View style={styles.row}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {formatDuration(session.duration)}
            </Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{session.totalDetections}</Text>
            <Text style={styles.statLabel}>Detections</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{session.totalObstacles}</Text>
            <Text style={styles.statLabel}>Obstacles</Text>
          </View>
        </View>
        <View style={styles.secondRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{session.totalAlerts}</Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: semanticTokens.colors.danger.default }]}>
              {session.criticalEvents}
            </Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {(session.averageConfidence * 100).toFixed(0)}%
            </Text>
            <Text style={styles.statLabel}>Avg Confidence</Text>
          </View>
        </View>
        <Text style={styles.startTime}>
          Started: {new Date(session.startTime).toLocaleString()}
        </Text>
      </Card>
    );
  },
);

const styles = StyleSheet.create({
  inactiveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[2],
  },
  emptyText: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    padding: tokens.spacing[2],
    borderRadius: semanticTokens.radius.md,
    backgroundColor: semanticTokens.colors.surface.elevated,
  },
  compactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compactValue: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing[3],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
  },
  sessionId: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.subtle,
    maxWidth: 100,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: tokens.spacing[2],
  },
  secondRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: tokens.spacing[3],
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
  },
  statLabel: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
    marginTop: tokens.spacing[1],
  },
  startTime: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.subtle,
    textAlign: 'right',
  },
});
