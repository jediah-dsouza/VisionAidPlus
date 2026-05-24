import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { DetectionContract } from '@core/camera/types';

type Props = {
  detection: DetectionContract;
};

export const ObstacleIndicator: React.FC<Props> = ({ detection }) => {
  const priorityColor = getPriorityColor(detection.priority);
  const distanceValue = (detection.metadata as Record<string, unknown>)?.distance;
  const distanceLabel = typeof distanceValue === 'number'
    ? `${distanceValue}m` : '';

  return (
    <View style={[styles.container, { borderColor: priorityColor }]}>
      <Text style={[styles.label, { color: priorityColor }]}>
        {detection.type.replace('_', ' ')}
      </Text>
      {distanceLabel ? <Text style={styles.distance}>{distanceLabel}</Text> : null}
    </View>
  );
};

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return '#FF0000';
    case 'high': return '#FF6600';
    case 'normal': return '#FFCC00';
    case 'low': return '#66CCFF';
    case 'background': return '#999999';
    default: return '#FFFFFF';
  }
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  distance: {
    fontSize: 12,
    color: '#FFFFFF',
  },
});
