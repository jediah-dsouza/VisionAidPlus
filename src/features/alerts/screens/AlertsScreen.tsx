import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useTheme } from '@app/providers/ThemeProvider';
import { Card, Button, EmptyState } from '@shared/design-system';
import { useAlerts } from '../hooks/useAlerts';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';
import type { Alert } from '../types';

interface AlertsScreenProps {
  navigation?: any;
}

export const AlertsScreen: React.FC<AlertsScreenProps> = () => {
  const { colors } = useTheme();
  const { alerts, unreadCount, markAsRead, markAllAsRead, dismissAlert } = useAlerts();

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'danger':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✓';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const AlertSeparator: React.FC = () => <View style={styles.separator} />;

  const renderAlertItem = ({ item }: { item: Alert; index: number }) => {
    if (item.dismissed) return null;

    return (
      <Card
        variant={item.read ? 'default' : 'elevated'}
        padding="md"
        interactive
        onPress={() => markAsRead(item.id)}
        style={styles.alertCard}>
        <View style={styles.alertHeader}>
          <View style={styles.alertIconContainer}>
            <Text style={styles.alertIcon}>{getAlertIcon(item.type)}</Text>
          </View>
          <View style={styles.alertInfo}>
            <Text style={[styles.alertTitle, !item.read && styles.unreadTitle]}>{item.title}</Text>
            <Text style={styles.alertTime}>{formatTime(item.timestamp)}</Text>
          </View>
          <Pressable
            style={styles.dismissButton}
            onPress={() => dismissAlert(item.id)}
            accessibilityLabel="Dismiss alert">
            <Text style={styles.dismissIcon}>✕</Text>
          </Pressable>
        </View>
        <Text style={styles.alertMessage}>{item.message}</Text>
        {item.source && <Text style={styles.alertSource}>Source: {item.source.toUpperCase()}</Text>}
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Alerts</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {alerts.length} total, {unreadCount} unread
            </Text>
          </View>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onPress={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </View>
      </View>

      {alerts.length > 0 ? (
        <FlatList
          data={alerts}
          renderItem={renderAlertItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={AlertSeparator}
        />
      ) : (
        <EmptyState
          title="No Alerts"
          description="You don't have any alerts yet. Alerts will appear here when obstacles are detected or emergencies occur."
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: tokens.spacing[4],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: semanticTokens.fontSize['3xl'],
    fontWeight: tokens.fontWeight.bold,
  },
  subtitle: {
    fontSize: semanticTokens.fontSize.base,
    marginTop: tokens.spacing[1],
  },
  list: {
    padding: tokens.spacing[4],
    gap: tokens.spacing[3],
  },
  alertCard: {
    gap: tokens.spacing[2],
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.md,
    backgroundColor: semanticTokens.colors.surface.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 20,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
  },
  unreadTitle: {
    fontWeight: tokens.fontWeight.bold,
  },
  alertTime: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.subtle,
    marginTop: 2,
  },
  dismissButton: {
    width: semanticTokens.touchTarget.minimum,
    height: semanticTokens.touchTarget.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissIcon: {
    fontSize: 14,
    color: semanticTokens.colors.foreground.subtle,
  },
  alertMessage: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  alertSource: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.subtle,
  },
  separator: {
    height: tokens.spacing[2],
  },
});
