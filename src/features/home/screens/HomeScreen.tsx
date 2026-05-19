import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useTheme } from '@app/providers/ThemeProvider';
import { Card, Button, Alert, VoiceFeedbackBanner, Loader } from '@shared/design-system';
import { useHome } from '../hooks/useHome';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';

interface HomeScreenProps {
  navigation?: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = () => {
  const { colors } = useTheme();
  const { summary, bleStatus, aiStatus, emergencyStatus } = useHome();

  const renderStatusCard = (
    title: string,
    isActive: boolean,
    description: string,
    icon: string,
  ) => (
    <Card variant="elevated" padding="md" style={styles.statusCard}>
      <View style={styles.statusHeader}>
        <Text style={styles.statusIcon}>{icon}</Text>
        <View style={styles.statusInfo}>
          <Text style={styles.statusTitle}>{title}</Text>
          <Text style={[styles.statusBadge, isActive ? styles.activeBadge : styles.inactiveBadge]}>
            {isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <Text style={styles.statusDescription}>{description}</Text>
    </Card>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      accessibilityLabel="Home screen">
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome back</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>VisionAid+</Text>
      </View>

      <View style={styles.statusSection}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>System Status</Text>
        {renderStatusCard('Device', summary.deviceConnected, 'Bluetooth device connection', '📱')}
        {renderStatusCard('AI Detection', summary.aiActive, 'Obstacle detection engine', '🤖')}
        {renderStatusCard('Emergency', summary.emergencyActive, 'Emergency monitoring', '🚨')}
      </View>

      {summary.lastObstacle && (
        <View style={styles.alertSection}>
          <Alert
            title="Recent Obstacle"
            message={`${summary.lastObstacle.type} detected - ${summary.lastObstacle.distance}cm`}
            variant={summary.lastObstacle.severity === 'danger' ? 'error' : 'warning'}
          />
        </View>
      )}

      <View style={styles.quickActions}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => {}}
            accessibilityLabel="Start navigation">
            Start Navigation
          </Button>
          <Button
            variant="outline"
            size="lg"
            fullWidth
            onPress={() => {}}
            accessibilityLabel="Connect device">
            Connect Device
          </Button>
        </View>
      </View>

      <View style={styles.statsSection}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today's Summary</Text>
        <Card variant="default" padding="md">
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Obstacles</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>2.3km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>45min</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: tokens.spacing[4],
    gap: tokens.spacing[6],
  },
  header: {
    gap: tokens.spacing[1],
  },
  greeting: {
    fontSize: semanticTokens.fontSize.base,
  },
  title: {
    fontSize: semanticTokens.fontSize['4xl'],
    fontWeight: tokens.fontWeight.bold,
  },
  statusSection: {
    gap: tokens.spacing[3],
  },
  sectionTitle: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    marginBottom: tokens.spacing[1],
  },
  statusCard: {
    gap: tokens.spacing[2],
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  statusIcon: {
    fontSize: 24,
  },
  statusInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
  },
  statusBadge: {
    fontSize: semanticTokens.fontSize.xs,
    fontWeight: tokens.fontWeight.medium,
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.full,
  },
  activeBadge: {
    backgroundColor: semanticTokens.colors.success.muted,
    color: semanticTokens.colors.success.default,
  },
  inactiveBadge: {
    backgroundColor: semanticTokens.colors.neutral[700],
    color: semanticTokens.colors.neutral[400],
  },
  statusDescription: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  alertSection: {
    marginVertical: tokens.spacing[2],
  },
  quickActions: {
    gap: tokens.spacing[3],
  },
  actionGrid: {
    flexDirection: 'column',
    gap: tokens.spacing[3],
  },
  statsSection: {
    gap: tokens.spacing[3],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: tokens.spacing[1],
  },
  statValue: {
    fontSize: semanticTokens.fontSize.xl,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
  },
  statLabel: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
});
