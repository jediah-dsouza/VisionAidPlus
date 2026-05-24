import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppSelector } from '@app/store';
import { Card } from '@shared/design-system';
import { semanticTokens, tokens } from '@shared/design-system/theme';

interface AnalyticsUsageWidgetProps {
  compact?: boolean;
}

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hrs = Math.floor(min / 60);
  if (hrs > 0) return `${hrs}h ${min % 60}m`;
  if (min > 0) return `${min}m ${sec % 60}s`;
  return `${sec}s`;
}

export const AnalyticsUsageWidget: React.FC<AnalyticsUsageWidgetProps> = React.memo(
  ({ compact = false }) => {
    const usage = useAppSelector(state => state.analytics?.metrics.usage ?? null);

    if (!usage) {
      return (
        <Card
          variant="default"
          padding="md"
          accessibilityLabel="Usage metrics not available">
          <Text style={styles.emptyText}>No usage data</Text>
        </Card>
      );
    }

    const featureEntries = Object.entries(usage.featureActivationCounts).sort(
      (a, b) => b[1] - a[1],
    );

    if (compact) {
      return (
        <View
          style={styles.compactContainer}
          accessibilityLabel={`Usage: ${formatDuration(usage.totalSessionDuration)} session time`}
          accessibilityRole="text">
          <Text style={styles.compactIcon}>📊</Text>
          <View style={styles.compactContent}>
            <Text style={styles.compactValue}>
              {formatDuration(usage.totalSessionDuration)}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <Card
        variant="elevated"
        padding="md"
        accessibilityLabel="Usage metrics widget"
        accessibilityRole="text">
        <Text style={styles.title}>Usage</Text>
        <View style={styles.row}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {formatDuration(usage.totalSessionDuration)}
            </Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{usage.peakUsageHour}:00</Text>
            <Text style={styles.statLabel}>Peak Hour</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {formatDuration(usage.averageSessionLength)}
            </Text>
            <Text style={styles.statLabel}>Avg Session</Text>
          </View>
        </View>
        {featureEntries.length > 0 && (
          <View style={styles.featureSection}>
            <Text style={styles.sectionLabel}>Feature Activations</Text>
            {featureEntries.slice(0, 6).map(([feature, count]) => (
              <View key={feature} style={styles.featureRow}>
                <Text style={styles.featureName}>{feature}</Text>
                <View style={styles.featureBarBg}>
                  <View
                    style={[
                      styles.featureBarFill,
                      {
                        width: `${(count / Math.max(...featureEntries.map(e => e[1]))) * 100}%`,
                        backgroundColor: semanticTokens.colors.accent.default,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.featureCount}>{count}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.updated}>
          Updated: {new Date(usage.lastUpdated).toLocaleTimeString()}
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
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
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
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
  },
  statLabel: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
    marginTop: tokens.spacing[1],
  },
  featureSection: {
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
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    marginBottom: tokens.spacing[1],
  },
  featureName: {
    width: 80,
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.default,
    textTransform: 'capitalize',
  },
  featureBarBg: {
    flex: 1,
    height: 12,
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderRadius: tokens.radius.full,
    overflow: 'hidden',
  },
  featureBarFill: {
    height: '100%',
    borderRadius: tokens.radius.full,
  },
  featureCount: {
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
