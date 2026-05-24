import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CameraSessionState } from '@core/camera/types';

type Props = {
  state: CameraSessionState;
  frameRate?: number;
};

export const AIStatusIndicator: React.FC<Props> = ({ state, frameRate }) => {
  const statusColor = getStateColor(state);
  const label = state.charAt(0).toUpperCase() + state.slice(1);

  return (
    <View style={[styles.container, { backgroundColor: statusColor }]}>
      <Text style={styles.label}>{label}</Text>
      {frameRate !== undefined && frameRate > 0 && (
        <Text style={styles.fps}>{frameRate} fps</Text>
      )}
    </View>
  );
};

function getStateColor(state: CameraSessionState): string {
  switch (state) {
    case 'active': return '#22C55E';
    case 'preparing': return '#3B82F6';
    case 'suspended': return '#F59E0B';
    case 'error': return '#EF4444';
    case 'idle':
    case 'requesting':
    default: return '#6B7280';
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  fps: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
});
