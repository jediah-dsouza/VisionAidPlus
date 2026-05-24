import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppSelector } from '@app/store';
import { Card } from '@shared/design-system';
import { semanticTokens, tokens } from '@shared/design-system/theme';

interface AnalyticsObstacleWidgetProps {
  compact?: boolean;
}

export const AnalyticsObstacleWidget: React.FC<AnalyticsObstacleWidgetProps> = React.memo(
  ({ compact = false }) => {
    const obstacles = useAppSelector(
      state => state.analytics?.metrics.obstacles ?? null,
    );

    if (!obstacles) {
      return (
        <Card
          variant="default"
          padding="md"
          accessibilityLabel="Obstacle metrics not available">
          <Text style={styles.emptyText}>No obstacle data</Text>
        </Card>
      );
    }

    const typeEntries = Object.entries(obstacles.typeDistribution).sort(
      (a, b) => b[1] - a[1],
    );

    if (compact) {
      return (
        <View
          style={styles.compactContainer}
          accessibilityLabel={`Obstacles: ${obstacles.totalDetections} total, ${(obstacles.averageConfidence * 100).toFixed(0)}% confidence`}
          accessibilityRole="text">
          <Text style={styles.compactIcon}>🚧</Text>
          <View style={styles.compactContent}>
            <Text style={styles.compactValue}>{obstacles.totalDetections}</Text>
            <Text style={styles.compactLabel}>detected</Text>
          </View>
        </View>
      );
    }

    return (
      <Card
        variant="elevated"
        padding="md"
        accessibilityLabel="Obstacle metrics widget"
        accessibilityRole="text">
        <Text style={styles.title}>Obstacles</Text>
        <View style={styles.row}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{obstacles.totalDetections}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {(obstacles.averageConfidence * 100).toFixed(0)}%
            </Text>
            <Text style={styles.statLabel}>Avg Confidence</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{obstacles.peakDensity.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Peak Density</Text>
          </View>
        </View>
        {typeEntries.length > 0 && (
          <View style={styles.typeSection}>
            <Text style={styles.sectionLabel}>Type Distribution</Text>
            {typeEntries.slice(0, 5).map(([type, count]) => (
              <View key={type} style={styles.typeRow}>
                <Text style={styles.typeName}>{type}</Text>
                <View style={styles.typeBarBg}>
                  <View
                    style={[
                      styles.typeBarFill,
                      {
                        width: `${(count / obstacles.totalDetections) * 100}%`,
                        backgroundColor: semanticTokens.colors.primary.default,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.typeCount}>{count}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.updated}>
          Updated: {new Date(obstacles.lastUpdated).toLocaleTimeString()}
        </Text>
      </Card>
    );
  },
);

const styles = StyleSheet.create({
  emptyText: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    textAlign: 'center',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    padding: tokens.spacing[2],
    borderRadius: semanticTokens.radius.md,
    backgroundColor: semanticTokens.colors.surface.elevated,
  },
  compactIcon: {
    fontSize: 18,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: tokens.spacing[1],
  },
  compactValue: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
  },
  compactLabel: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
  },
  title: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
    marginBottom: tokens.spacing[3],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: tokens.spacing[3],
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
  },
  statLabel: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
    marginTop: tokens.spacing[1],
  },
  typeSection: {
    marginTop: tokens.spacing[2],
    paddingTop: tokens.spacing[3],
    borderTopWidth: 1,
    borderTopColor: semanticTokens.colors.border.default,
  },
  sectionLabel: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.muted,
    marginBottom: tokens.spacing[2],
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    marginBottom: tokens.spacing[1],
  },
  typeName: {
    width: 80,
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.default,
    textTransform: 'capitalize',
  },
  typeBarBg: {
    flex: 1,
    height: 12,
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderRadius: tokens.radius.full,
    overflow: 'hidden',
  },
  typeBarFill: {
    height: '100%',
    borderRadius: tokens.radius.full,
  },
  typeCount: {
    width: 30,
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
    textAlign: 'right',
  },
  updated: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.subtle,
    textAlign: 'right',
    marginTop: tokens.spacing[2],
  },
});
