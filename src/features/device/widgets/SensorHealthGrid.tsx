import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@shared/design-system';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';
import type { SensorHealthStatus } from '../types';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  healthy: { label: 'Active', color: semanticTokens.colors.success.default, icon: '✅' },
  warning: { label: 'Warning', color: semanticTokens.colors.warning.default, icon: '⚠️' },
  stale: { label: 'Stale', color: semanticTokens.colors.warning.default, icon: '⏰' },
  inactive: { label: 'Inactive', color: semanticTokens.colors.foreground.muted, icon: '⚪' },
};

interface SensorHealthGridProps {
  sensors: SensorHealthStatus[];
}

export const SensorHealthGrid: React.FC<SensorHealthGridProps> = ({ sensors }) => (
  <Card variant="default" padding="md" accessibilityLabel="Sensor health status">
    <Text style={styles.title}>Sensor Health</Text>
    <View style={styles.grid}>
      {sensors.map(sensor => {
        const config = STATUS_CONFIG[sensor.status] ?? STATUS_CONFIG.inactive;
        return (
          <View
            key={sensor.sensorType}
            style={styles.sensorCard}
            accessibilityRole="text"
            accessibilityLabel={`${sensor.label}: ${config.label}. ${sensor.message}`}>
            <Text style={styles.sensorIcon}>{config.icon}</Text>
            <Text style={styles.sensorName}>{sensor.label}</Text>
            <Text style={[styles.sensorStatus, { color: config.color }]}>{config.label}</Text>
          </View>
        );
      })}
    </View>
  </Card>
);

const styles = StyleSheet.create({
  title: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
    marginBottom: tokens.spacing[3],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[2],
  },
  sensorCard: {
    width: '48%',
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing[3],
    gap: tokens.spacing[1],
    alignItems: 'center',
  },
  sensorIcon: {
    fontSize: 24,
  },
  sensorName: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.default,
    fontWeight: tokens.fontWeight.medium,
    textAlign: 'center',
  },
  sensorStatus: {
    fontSize: semanticTokens.fontSize.xs,
    fontWeight: tokens.fontWeight.medium,
  },
});
