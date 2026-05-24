import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@shared/design-system';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';

const QUALITY_CONFIG: Record<string, { label: string; color: string; bars: number }> = {
  excellent: { label: 'Excellent', color: semanticTokens.colors.success.default, bars: 4 },
  good: { label: 'Good', color: semanticTokens.colors.success.default, bars: 3 },
  fair: { label: 'Fair', color: semanticTokens.colors.warning.default, bars: 2 },
  weak: { label: 'Weak', color: semanticTokens.colors.warning.default, bars: 1 },
  poor: { label: 'Poor', color: semanticTokens.colors.danger.default, bars: 0 },
  unknown: { label: 'Unknown', color: semanticTokens.colors.foreground.muted, bars: 0 },
};

interface SignalMonitorProps {
  rssi: number;
  signalQuality: string;
  isWeakSignal: boolean;
  isCriticalSignal: boolean;
}

export const SignalMonitor: React.FC<SignalMonitorProps> = ({
  rssi,
  signalQuality,
  isWeakSignal,
  isCriticalSignal,
}) => {
  const quality = QUALITY_CONFIG[signalQuality] ?? QUALITY_CONFIG.unknown;

  return (
    <Card
      variant="default"
      padding="md"
      accessibilityLabel={`Signal strength: ${quality.label}. RSSI: ${rssi} decibel milliwatts.`}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>📶</Text>
        <Text style={styles.headerTitle}>Signal</Text>
        <Text style={[styles.qualityLabel, { color: quality.color }]}>{quality.label}</Text>
      </View>
      <View style={styles.barsRow}>
        {[1, 2, 3, 4].map(bar => (
          <View
            key={bar}
            style={[
              styles.bar,
              {
                height: 8 + bar * 6,
                backgroundColor:
                  bar <= quality.bars ? quality.color : semanticTokens.colors.surface.elevated,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.footer}>
        <Text style={styles.rssiValue}>{rssi} dBm</Text>
        {(isWeakSignal || isCriticalSignal) && (
          <Text
            style={[
              styles.warning,
              {
                color: isCriticalSignal
                  ? semanticTokens.colors.danger.default
                  : semanticTokens.colors.warning.default,
              },
            ]}>
            {isCriticalSignal ? 'Critical signal' : 'Weak signal'}
          </Text>
        )}
      </View>
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
  qualityLabel: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.semibold,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginBottom: tokens.spacing[3],
    height: 40,
  },
  bar: {
    flex: 1,
    borderRadius: 3,
    minHeight: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rssiValue: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    fontWeight: tokens.fontWeight.medium,
  },
  warning: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
  },
});
