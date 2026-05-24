import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { DangerLevel } from '@core/live-navigation/types';

interface DangerOverlayProps {
  level: DangerLevel;
  obstacleCount: number;
}

const LEVEL_CONFIG: Record<DangerLevel, { label: string; color: string; visible: boolean }> = {
  none: { label: '', color: 'transparent', visible: false },
  low: { label: 'Low danger', color: '#F59E0B40', visible: false },
  moderate: { label: 'Moderate danger', color: '#F9731640', visible: true },
  high: { label: 'High danger', color: '#EF444460', visible: true },
  critical: { label: 'Critical danger', color: '#EF4444B0', visible: true },
};

const DangerOverlay: React.FC<DangerOverlayProps> = memo(({ level, obstacleCount }) => {
  const config = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.none;
  if (!config.visible) return null;

  return (
    <View
      style={[styles.container, { backgroundColor: config.color }]}
      accessibilityLabel={`${config.label}. ${obstacleCount} obstacles detected`}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Text style={styles.label}>{config.label}</Text>
      <Text style={styles.count}>{obstacleCount} obstacle{obstacleCount !== 1 ? 's' : ''}</Text>
    </View>
  );
});

DangerOverlay.displayName = 'DangerOverlay';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: '#00000080',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  count: {
    fontSize: 14,
    color: '#E5E7EB',
    marginTop: 8,
  },
});

export { DangerOverlay };
