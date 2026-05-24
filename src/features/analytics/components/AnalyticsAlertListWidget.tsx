import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useAppSelector } from '@app/store';
import { Card } from '@shared/design-system';
import { semanticTokens, tokens } from '@shared/design-system/theme';
import type { AlertRecord } from '@core/analytics/types';

interface AnalyticsAlertListWidgetProps {
  limit?: number;
  compact?: boolean;
}

function severityBadge(severity: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    critical: {
      label: 'CRITICAL',
      color: semanticTokens.colors.danger.default,
      bg: semanticTokens.colors.danger.muted,
    },
    warning: {
      label: 'WARNING',
      color: semanticTokens.colors.warning.default,
      bg: semanticTokens.colors.warning.muted,
    },
    info: {
      label: 'INFO',
      color: semanticTokens.colors.info.default,
      bg: semanticTokens.colors.info.muted,
    },
  };
  return map[severity] ?? map.info;
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    active: {
      label: 'Active',
      color: semanticTokens.colors.danger.default,
      bg: semanticTokens.colors.danger.muted,
    },
    acknowledged: {
      label: 'Seen',
      color: semanticTokens.colors.warning.default,
      bg: semanticTokens.colors.warning.muted,
    },
    resolved: {
      label: 'Resolved',
      color: semanticTokens.colors.success.default,
      bg: semanticTokens.colors.success.muted,
    },
    dismissed: {
      label: 'Dismissed',
      color: semanticTokens.colors.foreground.subtle,
      bg: semanticTokens.colors.surface.elevated,
    },
  };
  return map[status] ?? map.dismissed;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const AlertItem: React.FC<{ alert: AlertRecord }> = ({ alert }) => {
  const sev = severityBadge(alert.severity);
  const st = statusBadge(alert.status);

  return (
    <View
      style={styles.alertItem}
      accessibilityLabel={`${sev.label} alert: ${alert.title}, status: ${st.label}`}
      accessibilityRole="text">
      <View style={styles.alertHeader}>
        <View style={[styles.severityPill, { backgroundColor: sev.bg }]}>
          <Text style={[styles.severityText, { color: sev.color }]}>
            {sev.label}
          </Text>
        </View>
        <Text style={styles.alertTime}>{formatTime(alert.timestamp)}</Text>
      </View>
      <Text style={styles.alertTitle} numberOfLines={1}>
        {alert.title}
      </Text>
      <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
        <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
      </View>
    </View>
  );
};

export const AnalyticsAlertListWidget: React.FC<AnalyticsAlertListWidgetProps> = React.memo(
  ({ limit = 5, compact = false }) => {
    const alertHistory = useAppSelector(
      state => state.analytics?.alertHistory ?? [],
    );

    const displayed = React.useMemo(
      () => alertHistory.slice(-limit).reverse(),
      [alertHistory, limit],
    );

    if (alertHistory.length === 0) {
      return (
        <Card
          variant="default"
          padding="md"
          accessibilityLabel="No recent alerts">
          <Text style={styles.emptyText}>No alerts</Text>
        </Card>
      );
    }

    if (compact) {
      const activeCount = alertHistory.filter(a => a.status === 'active').length;
      return (
        <View
          style={styles.compactContainer}
          accessibilityLabel={`${activeCount} active alerts`}
          accessibilityRole="text">
          <Text style={styles.compactIcon}>🔔</Text>
          <Text style={styles.compactValue}>{activeCount}</Text>
          <Text style={styles.compactLabel}>active</Text>
        </View>
      );
    }

    return (
      <Card
        variant="elevated"
        padding="md"
        accessibilityLabel="Recent alerts list"
        accessibilityRole="text">
        <View style={styles.header}>
          <Text style={styles.title}>Recent Alerts</Text>
          <Text style={styles.count}>{alertHistory.length} total</Text>
        </View>
        {displayed.map(alert => (
          <AlertItem key={alert.id} alert={alert} />
        ))}
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
  compactValue: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.danger.default,
  },
  compactLabel: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing[3],
  },
  title: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
  },
  count: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  alertItem: {
    paddingVertical: tokens.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: semanticTokens.colors.border.default,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing[1],
  },
  severityPill: {
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[0],
    borderRadius: tokens.radius.full,
  },
  severityText: {
    fontSize: semanticTokens.fontSize.xs,
    fontWeight: tokens.fontWeight.semibold,
    textTransform: 'uppercase',
  },
  alertTime: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.subtle,
  },
  alertTitle: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.default,
    marginBottom: tokens.spacing[1],
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[0],
    borderRadius: tokens.radius.full,
  },
  statusText: {
    fontSize: semanticTokens.fontSize.xs,
    fontWeight: tokens.fontWeight.medium,
  },
});
