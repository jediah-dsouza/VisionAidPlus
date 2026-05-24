import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppSelector } from '@app/store';
import { Card } from '@shared/design-system';
import { semanticTokens, tokens } from '@shared/design-system/theme';

interface AnalyticsSafetyWidgetProps {
  compact?: boolean;
}

export const AnalyticsSafetyWidget: React.FC<AnalyticsSafetyWidgetProps> = React.memo(
  ({ compact = false }) => {
    const safety = useAppSelector(state => state.analytics?.metrics.safety ?? null);

    if (!safety) {
      return (
        <Card
          variant="default"
          padding="md"
          accessibilityLabel="Safety metrics not available">
          <Text style={styles.emptyText}>No safety data</Text>
        </Card>
      );
    }

    const severityColor = (sev: string) => {
      if (sev === 'critical') return semanticTokens.colors.danger.default;
      if (sev === 'warning') return semanticTokens.colors.warning.default;
      return semanticTokens.colors.info.default;
    };

    if (compact) {
      return (
        <View
          style={styles.compactContainer}
          accessibilityLabel={`Safety: ${safety.hazardCount} hazards, ${safety.criticalAlerts} critical`}
          accessibilityRole="text">
          <Text style={styles.compactIcon}>⚠️</Text>
          <View style={styles.compactContent}>
            <Text style={styles.compactValue}>{safety.hazardCount}</Text>
            <Text style={styles.compactLabel}>hazards</Text>
          </View>
        </View>
      );
    }

    return (
      <Card
        variant="elevated"
        padding="md"
        accessibilityLabel="Safety metrics widget"
        accessibilityRole="text">
        <Text style={styles.title}>Safety</Text>
        <View style={styles.row}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{safety.hazardCount}</Text>
            <Text style={styles.statLabel}>Hazards</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: semanticTokens.colors.danger.default }]}>
              {safety.criticalAlerts}
            </Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: semanticTokens.colors.warning.default }]}>
              {safety.warnings}
            </Text>
            <Text style={styles.statLabel}>Warnings</Text>
          </View>
        </View>
        <View style={styles.severityRow}>
          {Object.entries(safety.severityRatio).map(([sev, ratio]) => (
            <View key={sev} style={styles.severityBadge}>
              <View
                style={[
                  styles.severityDot,
                  { backgroundColor: severityColor(sev) },
                ]}
              />
              <Text style={styles.severityText}>
                {sev}: {(ratio * 100).toFixed(0)}%
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.updated}>
          Updated: {new Date(safety.lastUpdated).toLocaleTimeString()}
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
  severityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[2],
    marginBottom: tokens.spacing[2],
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.full,
    backgroundColor: semanticTokens.colors.surface.elevated,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  severityText: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
  },
  updated: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.subtle,
    textAlign: 'right',
  },
});
