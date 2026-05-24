import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Card } from '@shared/design-system';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';
import type { BLEDevice } from '@core/ble';

function rssiToBars(rssi: number): { bars: number; color: string } {
  if (rssi >= -50) return { bars: 4, color: semanticTokens.colors.success.default };
  if (rssi >= -65) return { bars: 3, color: semanticTokens.colors.success.default };
  if (rssi >= -80) return { bars: 2, color: semanticTokens.colors.warning.default };
  if (rssi >= -90) return { bars: 1, color: semanticTokens.colors.warning.default };
  return { bars: 0, color: semanticTokens.colors.danger.default };
}

interface DeviceCardProps {
  device: BLEDevice;
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: (device: BLEDevice) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  isConnected,
  isConnecting,
  onConnect,
}) => {
  const signal = rssiToBars(device.rssi);

  return (
    <Card
      variant={isConnected ? 'elevated' : 'outline'}
      padding="md"
      interactive={!isConnected && !isConnecting}
      onPress={() => !isConnected && !isConnecting && onConnect(device)}
      accessibilityRole="button"
      accessibilityLabel={`${device.name}. Signal strength ${signal.bars} bars out of 4. ${isConnected ? 'Connected' : isConnecting ? 'Connecting' : 'Tap to connect'}`}
      accessibilityState={{ disabled: isConnected || isConnecting, selected: isConnected }}>
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📱</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>{device.name}</Text>
          <Text style={styles.id}>ID: {device.id}</Text>
          <View style={styles.signalRow}>
            {[1, 2, 3, 4].map(bar => (
              <View
                key={bar}
                style={[
                  styles.signalBar,
                  {
                    backgroundColor:
                      bar <= signal.bars ? signal.color : semanticTokens.colors.border.muted,
                    opacity: bar <= signal.bars ? 1 : 0.3,
                  },
                ]}
              />
            ))}
            <Text style={styles.rssiText}>{device.rssi} dBm</Text>
          </View>
        </View>
        {(isConnected || isConnecting) && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isConnected
                  ? semanticTokens.colors.success.muted
                  : semanticTokens.colors.warning.muted,
              },
            ]}
            accessibilityLiveRegion="polite">
            <Text
              style={[
                styles.badgeText,
                {
                  color: isConnected
                    ? semanticTokens.colors.success.default
                    : semanticTokens.colors.warning.default,
                },
              ]}>
              {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : ''}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.md,
    backgroundColor: semanticTokens.colors.surface.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
  },
  id: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.subtle,
    marginTop: 2,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: tokens.spacing[1],
  },
  signalBar: {
    width: 8,
    height: 16,
    borderRadius: 2,
  },
  rssiText: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
    marginLeft: tokens.spacing[1],
  },
  badge: {
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.full,
  },
  badgeText: {
    fontSize: semanticTokens.fontSize.xs,
    fontWeight: tokens.fontWeight.medium,
  },
});
