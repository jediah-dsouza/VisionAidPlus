import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { DetectionContract } from '@core/camera/types';
import { ObstacleIndicator } from './ObstacleIndicator';
import { ConfidenceBadge } from './ConfidenceBadge';

type Props = {
  detection: DetectionContract;
};

export const DetectionBoundary: React.FC<Props> = ({ detection }) => {
  const { position, priority } = detection;
  const borderColor = getPriorityColor(priority);

  return (
    <View
      style={[
        styles.boundary,
        {
          left: position.x,
          top: position.y,
          width: position.width,
          height: position.height,
          borderColor,
        },
      ]}
      accessibilityLabel={`${detection.type} detected at ${Math.round(position.x)}, ${Math.round(position.y)}`}
    >
      <ObstacleIndicator detection={detection} />
      <ConfidenceBadge confidence={detection.confidence.overall} />
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
  boundary: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 4,
    overflow: 'hidden',
    gap: 2,
  },
});
