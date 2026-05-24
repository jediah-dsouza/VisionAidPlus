import React, { memo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLiveNavigation } from '../hooks/useLiveNavigation';
import { DirectionArrow } from '../components/DirectionArrow';
import { DistanceRadar } from '../components/DistanceRadar';
import { InstructionBanner } from '../components/InstructionBanner';
import { DangerOverlay } from '../components/DangerOverlay';
import { NavigationControls } from '../components/NavigationControls';
import type { EnvironmentMode, Obstacle } from '@core/live-navigation/types';
import type { RadarSectorData } from '../components/DistanceRadar';

const ObstacleItem: React.FC<{ item: Obstacle }> = memo(({ item }) => (
  <View style={styles.obstacleItem}>
    <DirectionArrow
      direction={item.direction}
      distanceCm={item.distanceCm}
      severity={item.severity}
      size="small"
    />
    <View style={styles.obstacleInfo}>
      <Text style={styles.obstacleType}>{item.type}</Text>
      <Text style={styles.obstacleDetail}>
        {item.distanceCm < 100
          ? `${Math.round(item.distanceCm)}cm`
          : `${(item.distanceCm / 100).toFixed(1)}m`}
        {' · '}
        {item.severity}
        {item.confidence < 1 ? ` · ${Math.round(item.confidence * 100)}%` : ''}
      </Text>
    </View>
  </View>
));

ObstacleItem.displayName = 'ObstacleItem';

const LiveNavigationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { viewState, obstacles, setEnvironment, setSensitivity } = useLiveNavigation();

  const renderObstacleItem = useCallback(
    ({ item }: { item: Obstacle }) => <ObstacleItem item={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Obstacle) => item.id, []);

  const radarSectors: RadarSectorData[] = viewState.radarSnapshot
    ? viewState.radarSnapshot.sectors.map(s => ({
        angle: s.angle,
        distanceCm: s.distanceCm,
        severity: s.severity,
        obstacleCount: s.obstacleCount,
      }))
    : [];

  const handleEnvironmentChange = useCallback(
    (mode: EnvironmentMode) => setEnvironment(mode),
    [setEnvironment],
  );

  const handleSensitivityChange = useCallback(
    (level: number) => setSensitivity(level),
    [setSensitivity],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <DangerOverlay level={viewState.dangerLevel} obstacleCount={viewState.obstacleCount} />

      <View style={styles.header}>
        <Text style={styles.title}>Live Navigation</Text>
        <Text style={styles.status}>
          {viewState.isNavigating
            ? viewState.isPaused
              ? 'Paused'
              : 'Navigating'
            : 'Ready'}
        </Text>
      </View>

      <InstructionBanner instruction={viewState.currentInstruction} />

      {viewState.isNavigating && (
        <View style={styles.radarContainer}>
          <DistanceRadar
            sectors={radarSectors}
            maxDistanceCm={viewState.radarSnapshot?.maxDistanceCm ?? 500}
            size={140}
          />
          <Text style={styles.obstacleCountText}>
            {viewState.obstacleCount} obstacle{viewState.obstacleCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {viewState.isNavigating && obstacles.length > 0 && (
        <FlatList
          data={obstacles}
          renderItem={renderObstacleItem}
          keyExtractor={keyExtractor}
          style={styles.obstacleList}
          contentContainerStyle={styles.obstacleListContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}

      {!viewState.isNavigating && obstacles.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No active obstacles</Text>
          <Text style={styles.emptySubtitle}>
            Start navigation to begin obstacle detection and guidance.
          </Text>
        </View>
      )}

      <View style={styles.controlsContainer}>
        <NavigationControls
          isNavigating={viewState.isNavigating}
          isPaused={viewState.isPaused}
          canResume={viewState.canResume}
          environment={viewState.environment}
          sensitivity={viewState.sensitivity}
          onStart={useLiveNavigation().start}
          onStop={useLiveNavigation().stop}
          onPause={useLiveNavigation().pause}
          onResume={useLiveNavigation().resume}
          onEnvironmentChange={handleEnvironmentChange}
          onSensitivityChange={handleSensitivityChange}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    color: '#60A5FA',
  },
  radarContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  obstacleCountText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
  },
  obstacleList: {
    flex: 1,
    marginHorizontal: 16,
  },
  obstacleListContent: {
    paddingBottom: 8,
  },
  obstacleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  obstacleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  obstacleType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
    textTransform: 'capitalize',
  },
  obstacleDetail: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
  },
  controlsContainer: {
    paddingBottom: 16,
  },
});

export { LiveNavigationScreen };
