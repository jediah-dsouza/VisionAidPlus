import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { Button } from '@shared/design-system/components';
import { Card } from '@shared/design-system/components';
import { Loader } from '@shared/design-system/components';
import { tokens, semanticTokens } from '@shared/design-system/theme';
import { useOnboarding } from '../hooks/useOnboarding';
import { navigationGuard } from '../../../app/navigation/utils/navigationGuards';
import { accessibilityEngine, logger } from '../../../core';

interface Device {
  id: string;
  name: string;
  rssi: number;
}

export const DevicePairingScreen: React.FC = () => {
  const { devicePaired, markDevicePaired } = useOnboarding();
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  const simulateScan = useCallback(() => {
    setIsScanning(true);
    setDevices([]);

    const mockDevices: Device[] = [
      { id: 'device-001', name: 'VisionAid Pro', rssi: -45 },
      { id: 'device-002', name: 'VisionAid Mini', rssi: -65 },
      { id: 'device-003', name: 'VisionAid Lite', rssi: -80 },
    ];

    setTimeout(() => {
      setDevices(mockDevices);
      setIsScanning(false);
      accessibilityEngine.announce(`Found ${mockDevices.length} devices`, 'normal');
    }, 2000);
  }, []);

  const connectToDevice = useCallback(
    async (device: Device) => {
      setIsScanning(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setConnectedDevice(device);
        markDevicePaired();
        accessibilityEngine.announce(`Connected to ${device.name}`, 'normal');
      } catch (error) {
        logger.error('Failed to connect to device', error);
        accessibilityEngine.announce('Failed to connect to device', 'high');
      } finally {
        setIsScanning(false);
      }
    },
    [markDevicePaired],
  );

  const handleContinue = useCallback(() => {
    navigationGuard.navigate('Onboarding', { screen: 'Complete' });
  }, []);

  const handleSkip = useCallback(() => {
    navigationGuard.navigate('Onboarding', { screen: 'Complete' });
  }, []);

  const renderDeviceItem = useCallback(
    ({ item }: { item: Device }) => (
      <Pressable
        onPress={() => connectToDevice(item)}
        disabled={isScanning}
        accessibilityRole="button"
        accessibilityLabel={`Connect to ${item.name}, signal strength ${item.rssi} decibel milliwatts`}>
        <Card variant="default" style={styles.deviceCard}>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{item.name}</Text>
            <View style={styles.signalStrength}>
              <Text style={styles.signalText}>
                {item.rssi > -50 ? 'Excellent' : item.rssi > -70 ? 'Good' : 'Fair'}
              </Text>
              <Text style={styles.rssiText}>{item.rssi} dBm</Text>
            </View>
          </View>
        </Card>
      </Pressable>
    ),
    [isScanning, connectToDevice],
  );

  const keyExtractor = useCallback((item: Device) => item.id, []);

  if (connectedDevice) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.title}>Device Connected</Text>
          <Text style={styles.subtitle}>Successfully connected to {connectedDevice.name}</Text>
          <View style={styles.deviceInfoBox}>
            <Text style={styles.deviceInfoLabel}>Device ID</Text>
            <Text style={styles.deviceInfoValue}>{connectedDevice.id}</Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Button variant="primary" size="lg" fullWidth onPress={handleContinue}>
            Continue
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Pair Your Device</Text>
          <Text style={styles.subtitle}>
            Connect your VisionAid hardware for obstacle detection
          </Text>
        </View>

        {isScanning ? (
          <View style={styles.scanningContainer}>
            <Loader size="lg" />
            <Text style={styles.scanningText}>Scanning for devices...</Text>
          </View>
        ) : devices.length > 0 ? (
          <FlatList
            data={devices}
            renderItem={renderDeviceItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.deviceList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📡</Text>
            <Text style={styles.emptyStateText}>No devices found</Text>
            <Text style={styles.emptyStateHint}>
              Make sure your VisionAid device is powered on and in pairing mode
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {devices.length > 0 && !isScanning && (
          <Button
            variant="outline"
            size="lg"
            fullWidth
            onPress={simulateScan}
            disabled={isScanning}>
            Scan Again
          </Button>
        )}
        {devices.length === 0 && !isScanning && (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={simulateScan}
            disabled={isScanning}>
            Scan for Devices
          </Button>
        )}
        <Button variant="ghost" size="md" onPress={handleSkip}>
          Skip for Now
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticTokens.colors.background.default,
  },
  content: {
    flex: 1,
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[6],
  },
  header: {
    marginBottom: tokens.spacing[6],
  },
  title: {
    fontSize: semanticTokens.fontSize['3xl'],
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
    marginBottom: tokens.spacing[2],
  },
  subtitle: {
    fontSize: semanticTokens.fontSize.lg,
    color: semanticTokens.colors.foreground.muted,
    lineHeight: 26,
  },
  scanningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    marginTop: tokens.spacing[4],
    fontSize: semanticTokens.fontSize.lg,
    color: semanticTokens.colors.foreground.muted,
  },
  deviceList: {
    gap: tokens.spacing[3],
  },
  deviceCard: {
    padding: tokens.spacing[4],
  },
  deviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceName: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
  },
  signalStrength: {
    alignItems: 'flex-end',
  },
  signalText: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.success.default,
    fontWeight: tokens.fontWeight.medium,
  },
  rssiText: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[6],
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: tokens.spacing[4],
  },
  emptyStateText: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
    marginBottom: tokens.spacing[2],
  },
  emptyStateHint: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
    textAlign: 'center',
  },
  footer: {
    padding: tokens.spacing[6],
    gap: tokens.spacing[3],
    borderTopWidth: 1,
    borderTopColor: semanticTokens.colors.border.default,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: semanticTokens.colors.success.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing[6],
  },
  successIconText: {
    fontSize: 40,
    color: '#FFFFFF',
  },
  deviceInfoBox: {
    marginTop: tokens.spacing[6],
    padding: tokens.spacing[4],
    backgroundColor: semanticTokens.colors.background.subtle,
    borderRadius: semanticTokens.radius.md,
  },
  deviceInfoLabel: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    marginBottom: tokens.spacing[1],
  },
  deviceInfoValue: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.default,
    fontFamily: 'monospace',
  },
});

export default DevicePairingScreen;
