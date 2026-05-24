import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ObstacleDirection } from '@core/live-navigation/types';

interface DirectionArrowProps {
  direction: ObstacleDirection;
  distanceCm: number;
  severity: string;
  size?: 'small' | 'medium' | 'large';
}

const DIRECTION_SYMBOLS: Record<ObstacleDirection, string> = {
  'front': '↑',
  'front-left': '↖',
  'front-right': '↗',
  'left': '←',
  'right': '→',
  'center': '↑',
  'behind': '↓',
  'unknown': '●',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  danger: '#F97316',
  caution: '#F59E0B',
  safe: '#22C55E',
};

const DirectionArrow: React.FC<DirectionArrowProps> = memo(({
  direction,
  distanceCm,
  severity,
  size = 'medium',
}) => {
  const fontSize = size === 'large' ? 32 : size === 'medium' ? 24 : 16;
  const color = SEVERITY_COLORS[severity] ?? '#6B7280';

  return (
    <View style={[styles.container, { width: fontSize * 2, height: fontSize * 2 }]}>
      <Text
        style={[styles.symbol, { fontSize, color }]}
        accessibilityLabel={`Obstacle ${direction}, ${Math.round(distanceCm)} centimeters, ${severity}`}
        accessibilityRole="text"
      >
        {DIRECTION_SYMBOLS[direction]}
      </Text>
      <Text style={[styles.distance, { color }]}>
        {distanceCm < 100 ? `${distanceCm}cm` : `${(distanceCm / 100).toFixed(1)}m`}
      </Text>
    </View>
  );
});

DirectionArrow.displayName = 'DirectionArrow';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontWeight: '700',
  },
  distance: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});

export { DirectionArrow };
