import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  SectionList,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@app/store';
import { analyticsSlice } from '@app/store/slices/analyticsSlice';
import { semanticTokens, tokens } from '@shared/design-system/theme';
import { AnalyticsFilterBar } from '../components/AnalyticsFilterBar';
import type { AlertRecord, AnalyticsFilter } from '@core/analytics/types';

interface AlertGroup {
  date: string;
  data: AlertRecord[];
}

function groupAlertsByDate(alerts: AlertRecord[]): AlertGroup[] {
  const groups: Record<string, AlertRecord[]> = {};
  alerts.forEach(alert => {
    const date = new Date(alert.timestamp).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(alert);
  });
  return Object.entries(groups)
    .map(([date, data]) => ({ date, data }))
    .sort((a, b) => b.date.localeCompare(a.date));
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
    active: { label: 'Active', color: semanticTokens.colors.danger.default, bg: semanticTokens.colors.danger.muted },
    acknowledged: { label: 'Seen', color: semanticTokens.colors.warning.default, bg: semanticTokens.colors.warning.muted },
    resolved: { label: 'Resolved', color: semanticTokens.colors.success.default, bg: semanticTokens.colors.success.muted },
    dismissed: { label: 'Dismissed', color: semanticTokens.colors.foreground.subtle, bg: semanticTokens.colors.surface.elevated },
  };
  return map[status] ?? map.dismissed;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function filterAlerts(alerts: AlertRecord[], filter: AnalyticsFilter): AlertRecord[] {
  return alerts.filter(alert => {
    if (filter.timeRange.start > 0 && alert.timestamp < filter.timeRange.start) return false;
    if (filter.timeRange.end && alert.timestamp > filter.timeRange.end) return false;
    if (filter.categories.length > 0 && !filter.categories.includes(alert.category)) return false;
    if (filter.severities.length > 0 && !filter.severities.includes(alert.severity)) return false;
    if (filter.priorities.length > 0 && !filter.priorities.includes(alert.priority)) return false;
    if (filter.sources.length > 0 && !filter.sources.includes(alert.source)) return false;
    if (filter.textSearch) {
      const q = filter.textSearch.toLowerCase();
      if (!alert.title.toLowerCase().includes(q) && !alert.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

const AlertItem: React.FC<{ alert: AlertRecord }> = ({ alert }) => {
  const sev = severityBadge(alert.severity);
  const st = statusBadge(alert.status);
  return (
    <View
      style={styles.alertItem}
      accessibilityLabel={`${sev.label} alert: ${alert.title}`}
      accessibilityRole="text">
      <View style={styles.alertHeader}>
        <View style={[styles.severityPill, { backgroundColor: sev.bg }]}>
          <Text style={[styles.severityText, { color: sev.color }]}>{sev.label}</Text>
        </View>
        <Text style={styles.alertTime}>{formatTime(alert.timestamp)}</Text>
      </View>
      <Text style={styles.alertTitle}>{alert.title}</Text>
      <Text style={styles.alertDescription} numberOfLines={2}>
        {alert.description}
      </Text>
      <View style={styles.alertFooter}>
        <Text style={styles.alertSource}>{alert.source}</Text>
        <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
          <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
        </View>
      </View>
    </View>
  );
};

export const AlertHistoryScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const alertHistory = useAppSelector(state => state.analytics?.alertHistory ?? []);
  const filter = useAppSelector(state => {
    if (!state.analytics?.filter) {
      return { timeRange: { start: 0 }, categories: [], severities: [], priorities: [], sources: [] };
    }
    return state.analytics.filter;
  });

  const filteredAlerts = useMemo(() => filterAlerts(alertHistory, filter), [alertHistory, filter]);
  const sections = useMemo(() => groupAlertsByDate(filteredAlerts), [filteredAlerts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  return (
    <View style={styles.container}>
      <AnalyticsFilterBar />
      {sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No alerts match the current filters</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <AlertItem alert={item} />}
          renderSectionHeader={({ section: { date } }) => (
            <Text style={styles.sectionHeader}>{date}</Text>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticTokens.colors.background.default,
  },
  listContent: {
    paddingHorizontal: tokens.spacing[3],
    paddingBottom: tokens.spacing[6],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing[6],
  },
  emptyText: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.muted,
    paddingVertical: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[1],
    backgroundColor: semanticTokens.colors.background.default,
  },
  alertItem: {
    paddingVertical: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[3],
    marginBottom: tokens.spacing[2],
    borderRadius: tokens.radius.md,
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderWidth: 1,
    borderColor: semanticTokens.colors.border.default,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing[2],
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
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
    marginBottom: tokens.spacing[1],
  },
  alertDescription: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    marginBottom: tokens.spacing[2],
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertSource: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.subtle,
    textTransform: 'capitalize',
  },
  statusPill: {
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[0],
    borderRadius: tokens.radius.full,
  },
  statusText: {
    fontSize: semanticTokens.fontSize.xs,
    fontWeight: tokens.fontWeight.medium,
  },
});
