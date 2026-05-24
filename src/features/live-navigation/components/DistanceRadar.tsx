import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RadarSectorData {
  angle: number;
  distanceCm: number;
  severity: string;
  obstacleCount: number;
}

interface DistanceRadarProps {
  sectors: RadarSectorData[];
  maxDistanceCm: number;
  size?: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  danger: '#F97316',
  caution: '#F59E0B',
  safe: '#22C55E70',
};

const DistanceRadar: React.FC<DistanceRadarProps> = memo(({
  sectors,
  maxDistanceCm,
  size = 120,
}) => {
  const center = size / 2;
  const radius = center - 8;
  const sectorAngle = 360 / sectors.length;

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
      accessibilityLabel={`Radar showing ${sectors.length} sectors`}
      accessibilityRole="image"
    >
      {sectors.map((sector, index) => {
        const startAngle = (sector.angle - sectorAngle / 2) * (Math.PI / 180);
        const endAngle = (sector.angle + sectorAngle / 2) * (Math.PI / 180);
        const distanceRatio = Math.min(1, sector.distanceCm / maxDistanceCm);
        const fillRadius = radius * (1 - distanceRatio * 0.85);

        const x1 = center + fillRadius * Math.cos(startAngle);
        const y1 = center + fillRadius * Math.sin(startAngle);
        const x2 = center + fillRadius * Math.cos(endAngle);
        const y2 = center + fillRadius * Math.sin(endAngle);

        return (
          <View
            key={index}
            style={[
              styles.sector,
              {
                left: x1 - 3,
                top: y1 - 3,
                width: Math.abs(x2 - x1) + 6,
                height: Math.abs(y2 - y1) + 6,
                backgroundColor: SEVERITY_COLORS[sector.severity] ?? '#6B728070',
              },
            ]}
          />
        );
      })}

      <View style={[styles.centerDot, { width: 10, height: 10, borderRadius: 5 }]} />

      <Text style={styles.rangeLabel}>
        {maxDistanceCm >= 100
          ? `${(maxDistanceCm / 100).toFixed(0)}m`
          : `${maxDistanceCm}cm`}
      </Text>
    </View>
  );
});

DistanceRadar.displayName = 'DistanceRadar';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sector: {
    position: 'absolute',
    borderRadius: 2,
  },
  centerDot: {
    backgroundColor: '#2563EB',
    position: 'absolute',
  },
  rangeLabel: {
    position: 'absolute',
    bottom: 4,
    fontSize: 9,
    color: '#9CA3AF',
  },
});

export { DistanceRadar };
export type { RadarSectorData };
