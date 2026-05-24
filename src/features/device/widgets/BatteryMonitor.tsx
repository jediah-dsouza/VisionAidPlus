import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@shared/design-system';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';

interface BatteryMonitorProps {
  batteryLevel: number | null;
  chargingStatus: string | null;
  isLowBattery: boolean;
  isCriticalBattery: boolean;
  isCharging: boolean;
  isBatteryFull: boolean;
}

function getBatteryColor(level: number, isCharging: boolean): string {
  if (isCharging) return semanticTokens.colors.primary.default;
  if (level <= 10) return semanticTokens.colors.danger.default;
  if (level <= 20) return semanticTokens.colors.warning.default;
  return semanticTokens.colors.success.default;
}

export const BatteryMonitor: React.FC<BatteryMonitorProps> = ({
  batteryLevel,
  chargingStatus,
  isLowBattery,
  isCriticalBattery,
  isCharging,
  isBatteryFull,
}) => {
  const level = batteryLevel ?? 0;
  const color = getBatteryColor(level, isCharging);
  const statusText = isCharging
    ? 'Charging'
    : isBatteryFull
      ? 'Full'
      : isCriticalBattery
        ? 'Critical'
        : isLowBattery
          ? 'Low'
          : 'Normal';
  const statusColor = isCriticalBattery
    ? semanticTokens.colors.danger.default
    : isLowBattery
      ? semanticTokens.colors.warning.default
      : semanticTokens.colors.foreground.muted;

  return (
    <Card
      variant="default"
      padding="md"
      accessibilityLabel={`Battery level ${batteryLevel ?? 'unknown'} percent. ${statusText}.`}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>{isCharging ? '⚡' : '🔋'}</Text>
        <Text style={styles.headerTitle}>Battery</Text>
        <Text style={[styles.headerStatus, { color: statusColor }]}>{statusText}</Text>
      </View>
      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.min(100, Math.max(0, level))}%`, backgroundColor: color },
            ]}
          />
        </View>
        <Text style={[styles.percentage, { color }]}>
          {batteryLevel !== null ? `${batteryLevel}%` : '---'}
        </Text>
      </View>
      {chargingStatus === 'charging' && (
        <Text style={styles.chargingLabel} accessibilityRole="text">
          Device is charging
        </Text>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    marginBottom: tokens.spacing[3],
  },
  headerIcon: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
    flex: 1,
  },
  headerStatus: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  barBackground: {
    flex: 1,
    height: 20,
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderRadius: tokens.radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: tokens.radius.full,
  },
  percentage: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.bold,
    minWidth: 50,
    textAlign: 'right',
  },
  chargingLabel: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.primary.default,
    marginTop: tokens.spacing[2],
    fontWeight: tokens.fontWeight.medium,
  },
});
