import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTheme } from '@app/providers/ThemeProvider';
import { Card, Button, Loader, Alert } from '@shared/design-system/components';
import { useHomeDashboard } from '../hooks/useHome';
import {
  BLEStatusWidget,
  AIStatusWidget,
  ObstacleDetectionCard,
  EmergencyFAB,
  AIInstructionBanner,
  QuickActionsPreset,
} from '../dashboard/widgets';
import { semanticTokens, tokens } from '@shared/design-system/theme';
import type { ObstacleDetection } from '@shared/types';

// DEV ONLY: Import Dashboard Dev Panel
import { DashboardDevPanel } from '../dev/DashboardDevPanel';

export const HomeScreen: React.FC = () => {
  const { colors } = useTheme();
  const {
    summary,
    obstacles,
    isLoading,
    error,
    handleConnectDevice,
    handleDisconnectDevice,
    handleStartDetection,
    handleStopDetection,
  } = useHomeDashboard();

  const [refreshing, setRefreshing] = useState(false);
  const [dismissedObstacles, setDismissedObstacles] = useState<Set<string>>(new Set());

  const currentObstacle = summary.lastObstacle;
  const visibleObstacles = useMemo(
    () => obstacles.filter(o => o && !dismissedObstacles.has(o.timestamp)),
    [obstacles, dismissedObstacles],
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleDismissObstacle = useCallback(
    (index: number) => {
      const obstacle = visibleObstacles[index];
      if (obstacle) {
        setDismissedObstacles(prev => new Set([...prev, obstacle.timestamp]));
      }
    },
    [visibleObstacles],
  );

  const handleStartNavigation = useCallback(() => {
    console.log('Start navigation');
  }, []);

  const handleViewAlerts = useCallback(() => {
    console.log('View alerts');
  }, []);

  const handleEmergencySettings = useCallback(() => {
    console.log('Emergency settings');
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Alert
          title="Connection Error"
          message={error}
          variant="error"
          action={{
            label: 'Retry',
            onPress: handleRefresh,
          }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.textPrimary}
          />
        }
        accessibilityLabel="Home dashboard">
        <View style={styles.header}>
          <Text
            style={[styles.greeting, { color: colors.textSecondary }]}
            accessibilityRole="header">
            {greeting}
          </Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {summary.userName ? `Welcome, ${summary.userName.split(' ')[0]}` : 'VisionAid+'}
          </Text>
          {summary.detectionCount > 0 && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {summary.detectionCount} detections today
            </Text>
          )}
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <Loader size="md" />
            <Text style={styles.loadingText}>Initializing services...</Text>
          </View>
        )}

        {currentObstacle && (
          <AIInstructionBanner obstacle={currentObstacle} autoDismissDelay={8000} />
        )}

        <View style={styles.statusSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>System Status</Text>

          <View style={styles.statusWidgets}>
            <BLEStatusWidget
              onConnect={handleConnectDevice}
              onDisconnect={handleDisconnectDevice}
              compact
            />
            <AIStatusWidget
              onStartDetection={handleStartDetection}
              onStopDetection={handleStopDetection}
              compact
            />
          </View>

          <View style={styles.fullWidgets}>
            <BLEStatusWidget
              onConnect={handleConnectDevice}
              onDisconnect={handleDisconnectDevice}
            />
            <AIStatusWidget
              onStartDetection={handleStartDetection}
              onStopDetection={handleStopDetection}
            />
          </View>
        </View>

        {visibleObstacles.length > 0 && (
          <View style={styles.obstacleSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Recent Obstacles
            </Text>
            <View style={styles.obstacleList}>
              {visibleObstacles.slice(0, 3).map((obstacle, index) => (
                <ObstacleDetectionCard
                  key={`${obstacle.timestamp}-${index}`}
                  obstacle={obstacle}
                  isNew={index === 0 && obstacles[0]?.timestamp === obstacle.timestamp}
                  onDismiss={() => handleDismissObstacle(index)}
                  compact
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          <QuickActionsPreset
            onStartNavigation={handleStartNavigation}
            onConnectDevice={handleConnectDevice}
            onViewAlerts={handleViewAlerts}
            onEmergencySettings={handleEmergencySettings}
            layout="grid"
          />
        </View>

        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today's Summary</Text>
          <Card variant="elevated" padding="md">
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: semanticTokens.colors.primary.default }]}>
                  {summary.detectionCount}
                </Text>
                <Text style={styles.statLabel}>Obstacles</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statValue,
                    {
                      color: summary.deviceConnected
                        ? semanticTokens.colors.success.default
                        : semanticTokens.colors.neutral[500],
                    },
                  ]}>
                  {summary.deviceConnected ? '✓' : '✕'}
                </Text>
                <Text style={styles.statLabel}>Device</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text
                  style={[
                    styles.statValue,
                    {
                      color: summary.aiActive
                        ? semanticTokens.colors.success.default
                        : semanticTokens.colors.neutral[500],
                    },
                  ]}>
                  {summary.aiActive ? 'On' : 'Off'}
                </Text>
                <Text style={styles.statLabel}>AI Active</Text>
              </View>
            </View>
          </Card>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* DEV ONLY: Dashboard Dev Panel for testing */}
      {__DEV__ && <DashboardDevPanel />}

      <EmergencyFAB position="bottomRight" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
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
    fontSize: semanticTokens.fontSize['3xl'],
    fontWeight: tokens.fontWeight.bold,
  },
  subtitle: {
    fontSize: semanticTokens.fontSize.sm,
    marginTop: tokens.spacing[1],
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[3],
    padding: tokens.spacing[4],
    backgroundColor: semanticTokens.colors.surface.default,
    borderRadius: semanticTokens.radius.md,
  },
  loadingText: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
  },
  statusSection: {
    gap: tokens.spacing[3],
  },
  sectionTitle: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
  },
  statusWidgets: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
  },
  fullWidgets: {
    gap: tokens.spacing[3],
  },
  obstacleSection: {
    gap: tokens.spacing[3],
  },
  obstacleList: {
    gap: tokens.spacing[3],
  },
  quickActionsSection: {
    gap: tokens.spacing[3],
  },
  statsSection: {
    gap: tokens.spacing[3],
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: semanticTokens.fontSize['2xl'],
    fontWeight: tokens.fontWeight.bold,
  },
  statLabel: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    marginTop: tokens.spacing[1],
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: semanticTokens.colors.border.default,
  },
  bottomPadding: {
    height: 100,
  },
});
