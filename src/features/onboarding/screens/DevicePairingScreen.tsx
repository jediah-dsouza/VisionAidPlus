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

const SignalBars: React.FC<{ strength: number }> = ({ strength }) => {
  const bars = [1, 2, 3, 4];
  const level = strength > -50 ? 4 : strength > -65 ? 3 : strength > -75 ? 2 : 1;
  return (
    <View style={styles.signalBars}>
      {bars.map(bar => (
        <View
          key={bar}
          style={[
            styles.signalBar,
            { height: 8 + bar * 4, opacity: bar <= level ? 1 : 0.25 },
            bar <= level && { backgroundColor: '#22C55E' },
          ]}
        />
      ))}
    </View>
  );
};

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
        style={({ pressed }) => [
          styles.devicePressable,
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Connect to ${item.name}, signal strength ${item.rssi} decibel milliwatts`}>
        <View style={styles.deviceCard}>
          <View style={styles.deviceIcon}>
            <Text style={styles.deviceIconText}>📡</Text>
          </View>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{item.name}</Text>
            <View style={styles.signalStrength}>
              <SignalBars strength={item.rssi} />
              <Text style={styles.signalText}>
                {item.rssi > -50 ? 'Excellent' : item.rssi > -70 ? 'Good' : 'Fair'}
              </Text>
            </View>
          </View>
          <View style={styles.connectChevron}>
            <Text style={styles.connectChevronText}>Connect ›</Text>
          </View>
        </View>
      </Pressable>
    ),
    [isScanning, connectToDevice],
  );

  const keyExtractor = useCallback((item: Device) => item.id, []);

  if (connectedDevice) {
    return (
      <View style={styles.root}>
        <View style={styles.gradientOverlay}>
          <View style={styles.gradientTop} />
          <View style={styles.gradientBottom} />
        </View>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.successIconOuter}>
              <View style={styles.successIconGlow} />
              <View style={styles.successIcon}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
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
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.gradientOverlay}>
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
      </View>
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
              <View style={styles.scanningAnimation}>
                <View style={styles.scanningPulse1} />
                <View style={styles.scanningPulse2} />
                <View style={styles.scanningPulse3} />
                <Text style={styles.scanningIcon}>📡</Text>
              </View>
              <Text style={styles.scanningText}>Scanning for devices...</Text>
              <Text style={styles.scanningHint}>Ensure your device is powered on</Text>
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
              <View style={styles.emptyStateIconWrapper}>
                <View style={styles.emptyStateIconGlow} />
                <Text style={styles.emptyStateIcon}>📡</Text>
              </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B1121',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#0F172A',
    opacity: 0.6,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: '#1E293B',
    opacity: 0.15,
  },
  container: {
    flex: 1,
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
    fontSize: 30,
    fontWeight: tokens.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: tokens.spacing[2],
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: semanticTokens.fontSize.lg,
    color: semanticTokens.colors.foreground.muted,
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  scanningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningAnimation: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    marginBottom: tokens.spacing[6],
  },
  scanningPulse1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  scanningPulse2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  scanningPulse3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  scanningIcon: {
    fontSize: 36,
  },
  scanningText: {
    marginTop: tokens.spacing[4],
    fontSize: semanticTokens.fontSize.lg,
    color: '#FFFFFF',
    fontWeight: tokens.fontWeight.semibold,
  },
  scanningHint: {
    marginTop: tokens.spacing[2],
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  deviceList: {
    gap: tokens.spacing[3],
  },
  devicePressable: {
    borderRadius: 16,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2332',
    borderRadius: 16,
    padding: tokens.spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  deviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing[4],
  },
  deviceIconText: {
    fontSize: 20,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: '#FFFFFF',
    marginBottom: tokens.spacing[1],
  },
  signalStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  signalBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#475569',
  },
  signalText: {
    fontSize: semanticTokens.fontSize.xs,
    color: '#22C55E',
    fontWeight: tokens.fontWeight.medium,
  },
  rssiText: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
  },
  connectChevron: {
    marginLeft: tokens.spacing[2],
  },
  connectChevronText: {
    fontSize: 15,
    color: semanticTokens.colors.primary.default,
    fontWeight: tokens.fontWeight.semibold,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[6],
  },
  emptyStateIconWrapper: {
    position: 'relative',
    marginBottom: tokens.spacing[5],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateIconGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: semanticTokens.colors.primary.default,
    opacity: 0.1,
  },
  emptyStateIcon: {
    fontSize: 44,
  },
  emptyStateText: {
    fontSize: semanticTokens.fontSize.xl,
    fontWeight: tokens.fontWeight.semibold,
    color: '#FFFFFF',
    marginBottom: tokens.spacing[2],
  },
  emptyStateHint: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    padding: tokens.spacing[6],
    gap: tokens.spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  successIconOuter: {
    position: 'relative',
    marginBottom: tokens.spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconGlow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#22C55E',
    opacity: 0.2,
    transform: [{ scale: 1.3 }],
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  successIconText: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: tokens.fontWeight.bold,
  },
  deviceInfoBox: {
    marginTop: tokens.spacing[6],
    padding: tokens.spacing[4],
    backgroundColor: '#1A2332',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  deviceInfoLabel: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    marginBottom: tokens.spacing[1],
  },
  deviceInfoValue: {
    fontSize: semanticTokens.fontSize.base,
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
});

export default DevicePairingScreen;
