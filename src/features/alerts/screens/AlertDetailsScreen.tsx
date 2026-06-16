import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppSelector } from '@app/store';
import { Card, Button } from '@shared/design-system';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';

export const AlertDetailsScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { alertId } = route.params || {};
  const allAlerts = useAppSelector(state => state.alerts?.alerts ?? []);

  const alert = useMemo(() => allAlerts.find(a => a.id === alertId), [allAlerts, alertId]);

  const severityConfig = useMemo(() => {
    if (!alert) return { color: semanticTokens.colors.neutral[500], icon: '📋', label: 'Unknown' };
    switch (alert.type) {
      case 'danger':
        return { color: semanticTokens.colors.danger.default, icon: '⚠️', label: 'Danger' };
      case 'warning':
        return { color: semanticTokens.colors.warning.default, icon: '⚡', label: 'Warning' };
      default:
        return { color: semanticTokens.colors.info.default, icon: 'ℹ️', label: 'Info' };
    }
  }, [alert]);

  if (!alert) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Alert Details</Text>
          <Text style={styles.subtitle}>Alert not found</Text>
        </View>
        <Card variant="elevated" padding="lg">
          <View style={styles.statusContainer}>
            <Text style={styles.statusIcon}>📋</Text>
            <Text style={styles.statusText}>This alert is no longer available.</Text>
          </View>
        </Card>
        <Button variant="ghost" size="md" fullWidth onPress={() => navigation.goBack()}>
          Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alert Details</Text>
        <Text style={styles.subtitle}>ID: {alertId}</Text>
      </View>

      <Card variant="elevated" padding="lg">
        <View style={styles.alertHeader}>
          <Text style={[styles.alertIcon, { color: severityConfig.color }]}>
            {severityConfig.icon}
          </Text>
          <View style={styles.alertHeaderContent}>
            <Text style={styles.alertTitle}>{alert.title ?? 'Alert'}</Text>
            <View style={[styles.severityBadge, { backgroundColor: `${severityConfig.color}20` }]}>
              <Text style={[styles.severityText, { color: severityConfig.color }]}>
                {severityConfig.label}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.alertMessage}>{alert.message}</Text>

        {alert.timestamp && (
          <Text style={styles.alertTime}>{new Date(alert.timestamp).toLocaleString()}</Text>
        )}
      </Card>

      <Button variant="ghost" size="md" fullWidth onPress={() => navigation.goBack()}>
        Back
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticTokens.colors.background.default,
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
  },
  header: {
    gap: tokens.spacing[1],
  },
  title: {
    fontSize: semanticTokens.fontSize['3xl'],
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
  },
  subtitle: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  alertIcon: {
    fontSize: 32,
  },
  alertHeaderContent: {
    flex: 1,
    gap: tokens.spacing[1],
  },
  alertTitle: {
    fontSize: semanticTokens.fontSize.xl,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[0.5],
    borderRadius: tokens.radius.full,
  },
  severityText: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: semanticTokens.colors.border.default,
    marginVertical: tokens.spacing[4],
  },
  alertMessage: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.default,
    lineHeight: 24,
  },
  alertTime: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    marginTop: tokens.spacing[4],
  },
  statusContainer: {
    alignItems: 'center',
    gap: tokens.spacing[3],
    paddingVertical: tokens.spacing[4],
  },
  statusIcon: {
    fontSize: 40,
  },
  statusText: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
    textAlign: 'center',
  },
});
