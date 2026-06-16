import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Button as RNButton,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@app/providers/ThemeProvider';
import { Loader, Alert } from '@shared/design-system/components';
import { useHomeDashboard } from '../hooks/useHome';
import type { RootStackParamList } from '@app/navigation/types/navigation';
import {
  BLEStatusWidget,
  AIStatusWidget,
  ObstacleDetectionCard,
  EmergencyFAB,
  AIInstructionBanner,
  QuickActionsPreset,
} from '../dashboard/widgets';
import { semanticTokens, tokens } from '@shared/design-system/theme';

// DEV ONLY: Import Dashboard Dev Panel
import { DashboardDevPanel } from '../dev/DashboardDevPanel';

const SectionHeader: React.FC<{ title: string; icon?: string }> = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    {icon && <Text style={styles.sectionIcon}>{icon}</Text>}
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

export const HomeScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
  const [testButtonClicks, setTestButtonClicks] = useState(0);

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
    navigation.navigate('Main', { screen: 'NavigationTab' });
  }, [navigation]);

  const handleViewAlerts = useCallback(() => {
    navigation.navigate('Main', { screen: 'AlertsTab', params: { screen: 'Alerts' } });
  }, [navigation]);

  const handleEmergencySettings = useCallback(() => {
    navigation.navigate('Emergency', { screen: 'EmergencyHome' });
  }, [navigation]);

  const deviceStatColor = summary.deviceConnected ? '#22C55E' : '#64748B';
  const aiActiveColor = summary.aiActive ? '#22C55E' : '#64748B';
  const deviceColorStyle = { color: deviceStatColor };
  const aiColorStyle = { color: aiActiveColor };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.gradientOverlay}>
          <View style={styles.gradientTop} />
          <View style={styles.gradientBottom} />
        </View>
        <View style={styles.errorContent}>
          <View style={styles.errorIconContainer}>
            <Text style={styles.errorIcon}>⚠</Text>
          </View>
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
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.gradientOverlay}>
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
      </View>
      {__DEV__ && (
        <View style={styles.devTestButton}>
          <RNButton
            title={`🧪 TEST (${testButtonClicks})`}
            color="#FFFFFF"
            onPress={() => {
              const newCount = testButtonClicks + 1;
              setTestButtonClicks(newCount);
            }}
          />
        </View>
      )}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.textPrimary || '#FFFFFF'}
          />
        }
        accessibilityLabel="Home dashboard">
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTextBlock}>
              <Text
                style={[styles.greeting, { color: colors.textSecondary || '#CBD5E1' }]}
                accessibilityRole="header">
                {greeting}
              </Text>
              <Text style={[styles.title, { color: colors.textPrimary || '#FFFFFF' }]}>
                {summary.userName ? `Welcome, ${summary.userName.split(' ')[0]}` : 'VisionAid+'}
              </Text>
            </View>
            {summary.deviceConnected && (
              <View style={styles.deviceBadge}>
                <View style={styles.deviceBadgeDot} />
                <Text style={styles.deviceBadgeText}>Connected</Text>
              </View>
            )}
          </View>
          {summary.detectionCount > 0 && (
            <View style={styles.detectionPill}>
              <Text style={styles.detectionPillText}>
                {summary.detectionCount} detection{summary.detectionCount !== 1 ? 's' : ''} today
              </Text>
            </View>
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

        <View style={styles.sectionCard}>
          <SectionHeader title="System Status" icon="⚡" />
          <View style={styles.statusWidgets}>
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
          <View style={styles.sectionCard}>
            <SectionHeader title="Recent Obstacles" icon="⚠" />
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

        <View style={styles.sectionCard}>
          <SectionHeader title="Quick Actions" icon="🚀" />
          <QuickActionsPreset
            onStartNavigation={handleStartNavigation}
            onConnectDevice={handleConnectDevice}
            onViewAlerts={handleViewAlerts}
            onEmergencySettings={handleEmergencySettings}
            layout="grid"
          />
        </View>

        <View style={styles.sectionCard}>
          <SectionHeader title="Today's Summary" icon="📊" />
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.statValuePrimary]}>
                {summary.detectionCount}
              </Text>
              <Text style={styles.statLabel}>Obstacles</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, deviceColorStyle]}>
                {summary.deviceConnected ? '✓' : '✕'}
              </Text>
              <Text style={styles.statLabel}>Device</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, aiColorStyle]}>
                {summary.aiActive ? 'On' : 'Off'}
              </Text>
              <Text style={styles.statLabel}>AI Active</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {__DEV__ && <DashboardDevPanel />}

      <EmergencyFAB position="bottomRight" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#0F172A',
    opacity: 0.5,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: '#1E293B',
    opacity: 0.12,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: tokens.spacing[4],
    gap: tokens.spacing[5],
    paddingTop: tokens.spacing[2],
  },
  devTestButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: '#FF6600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  header: {
    paddingTop: tokens.spacing[4],
    gap: tokens.spacing[3],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextBlock: {
    flex: 1,
    gap: tokens.spacing[1],
  },
  greeting: {
    fontSize: semanticTokens.fontSize.base,
    letterSpacing: 0.3,
    opacity: 0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: tokens.fontWeight.bold,
    letterSpacing: 0.3,
  },
  deviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[1.5],
    borderRadius: 20,
    gap: tokens.spacing[1.5],
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  deviceBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22C55E',
  },
  deviceBadgeText: {
    fontSize: semanticTokens.fontSize.xs,
    color: '#22C55E',
    fontWeight: tokens.fontWeight.semibold,
  },
  detectionPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[1.5],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  detectionPillText: {
    fontSize: semanticTokens.fontSize.sm,
    color: '#60A5FA',
    fontWeight: tokens.fontWeight.medium,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing[3],
    padding: tokens.spacing[6],
    backgroundColor: '#1A2332',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  loadingText: {
    fontSize: semanticTokens.fontSize.base,
    color: '#CBD5E1',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    padding: tokens.spacing[6],
  },
  errorIconContainer: {
    alignItems: 'center',
    marginBottom: tokens.spacing[6],
  },
  errorIcon: {
    fontSize: 48,
  },
  sectionCard: {
    backgroundColor: '#1A2332',
    borderRadius: 16,
    padding: tokens.spacing[5],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    marginBottom: tokens.spacing[4],
  },
  sectionIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  statusWidgets: {
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
    fontSize: 26,
    fontWeight: tokens.fontWeight.bold,
    letterSpacing: 0.5,
  },
  statValuePrimary: {
    color: '#60A5FA',
  },
  statLabel: {
    fontSize: semanticTokens.fontSize.sm,
    color: '#64748B',
    marginTop: tokens.spacing[1],
    fontWeight: tokens.fontWeight.medium,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  bottomPadding: {
    height: 100,
  },
});

export default HomeScreen;
