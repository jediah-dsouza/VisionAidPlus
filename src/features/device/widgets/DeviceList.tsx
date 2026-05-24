import React from 'react';
import { FlatList, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { DeviceCard } from './DeviceCard';
import type { BLEDevice } from '@core/ble';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';

interface DeviceListProps {
  devices: BLEDevice[];
  connectedDeviceId: string | null;
  isConnecting: boolean;
  isScanning: boolean;
  onConnect: (device: BLEDevice) => void;
}

export const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  connectedDeviceId,
  isConnecting,
  isScanning,
  onConnect,
}) => {
  if (isScanning && devices.length === 0) {
    return (
      <View
        style={styles.loadingContainer}
        accessibilityRole="text"
        accessibilityLabel="Scanning for nearby devices">
        <ActivityIndicator size="large" color={semanticTokens.colors.primary.default} />
        <Text style={styles.loadingText}>Scanning for nearby devices...</Text>
      </View>
    );
  }

  if (devices.length === 0) return null;

  return (
    <FlatList
      data={devices}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <DeviceCard
          device={item}
          isConnected={item.id === connectedDeviceId}
          isConnecting={isConnecting}
          onConnect={onConnect}
        />
      )}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      accessibilityRole="list"
      accessibilityLabel={`${devices.length} device${devices.length !== 1 ? 's' : ''} found`}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    gap: tokens.spacing[3],
    paddingTop: tokens.spacing[3],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  loadingText: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.subtle,
  },
});
