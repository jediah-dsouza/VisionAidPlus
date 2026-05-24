import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@shared/design-system';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';

interface DeviceInfoPanelProps {
  deviceName: string | null;
  deviceId: string | null;
  firmwareVersion: string | null;
  hardwareVersion: string | null;
  mtu: number;
}

export const DeviceInfoPanel: React.FC<DeviceInfoPanelProps> = ({
  deviceName,
  deviceId,
  firmwareVersion,
  hardwareVersion,
  mtu,
}) => (
  <Card variant="default" padding="md" accessibilityLabel="Device information">
    <View style={styles.header}>
      <Text style={styles.icon}>📱</Text>
      <Text style={styles.title}>{deviceName ?? 'Unknown Device'}</Text>
    </View>
    <View style={styles.grid}>
      <InfoRow label="Device ID" value={deviceId ?? '---'} />
      <InfoRow label="Firmware" value={firmwareVersion ?? '---'} />
      <InfoRow label="Hardware" value={hardwareVersion ?? '---'} />
      <InfoRow label="MTU" value={`${mtu} bytes`} />
    </View>
  </Card>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.row} accessibilityRole="text" accessibilityLabel={`${label}: ${value}`}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
    marginBottom: tokens.spacing[4],
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
  },
  grid: {
    gap: tokens.spacing[2],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: tokens.spacing[1],
  },
  label: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  value: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.default,
    fontWeight: tokens.fontWeight.medium,
  },
});
