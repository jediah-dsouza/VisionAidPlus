import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert as RNAlert } from 'react-native';
import { useTheme } from '@app/providers/ThemeProvider';
import { Card, Button, Loader, EmptyState, Modal } from '@shared/design-system';
import { useDevice } from '../hooks/useDevice';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';

interface DeviceScreenProps {
  navigation?: any;
}

export const DeviceScreen: React.FC<DeviceScreenProps> = () => {
  const { colors } = useTheme();
  const { status, devices, connectedDeviceId, startScan, stopScan, connect, disconnect } =
    useDevice();
  const [showCalibration, setShowCalibration] = useState(false);

  const isScanning = status === 'scanning';
  const isConnecting = status === 'connecting';
  const isConnected = status === 'connected';

  const connectedDevice = devices.find(d => d.id === connectedDeviceId);

  const handleScan = () => {
    if (isScanning) {
      stopScan();
    } else {
      startScan();
    }
  };

  const handleConnect = (deviceId: string) => {
    connect(deviceId);
  };

  const handleDisconnect = () => {
    RNAlert.alert('Disconnect Device', 'Are you sure you want to disconnect from this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: disconnect },
    ]);
  };

  const renderDeviceItem = ({ item }: { item: { id: string; name: string; rssi: number } }) => {
    const isConnectedDevice = item.id === connectedDeviceId;

    return (
      <Card
        variant={isConnectedDevice ? 'elevated' : 'outline'}
        padding="md"
        interactive
        onPress={() => !isConnectedDevice && handleConnect(item.id)}
        style={styles.deviceCard}>
        <View style={styles.deviceInfo}>
          <View style={styles.deviceIcon}>
            <Text style={styles.deviceIconText}>📱</Text>
          </View>
          <View style={styles.deviceDetails}>
            <Text style={styles.deviceName}>{item.name}</Text>
            <Text style={styles.deviceId}>ID: {item.id}</Text>
            <View style={styles.signalRow}>
              <Text style={styles.signalLabel}>Signal:</Text>
              <View
                style={[
                  styles.signalBar,
                  { width: `${Math.max(0, Math.min(100, (item.rssi + 100) * 2))}%` },
                ]}
              />
            </View>
          </View>
          {isConnectedDevice && (
            <View style={styles.connectedBadge}>
              <Text style={styles.connectedText}>Connected</Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Device</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Connect your VisionAid device
        </Text>
      </View>

      <View style={styles.content}>
        {isConnected && connectedDevice ? (
          <View style={styles.connectedSection}>
            <Card variant="elevated" padding="lg">
              <View style={styles.connectedHeader}>
                <Text style={styles.connectedIcon}>📱</Text>
                <Text style={styles.connectedTitle}>{connectedDevice.name}</Text>
              </View>
              <View style={styles.deviceStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Status</Text>
                  <Text
                    style={[styles.statValue, { color: semanticTokens.colors.success.default }]}>
                    Connected
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Signal</Text>
                  <Text style={styles.statValue}>Strong</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Battery</Text>
                  <Text style={styles.statValue}>85%</Text>
                </View>
              </View>
              <View style={styles.connectedActions}>
                <Button variant="outline" size="md" onPress={() => setShowCalibration(true)}>
                  Calibrate
                </Button>
                <Button variant="danger" size="md" onPress={handleDisconnect}>
                  Disconnect
                </Button>
              </View>
            </Card>
          </View>
        ) : (
          <View style={styles.scanSection}>
            <Button
              variant={isScanning ? 'danger' : 'primary'}
              size="lg"
              fullWidth
              onPress={handleScan}
              isLoading={isScanning || isConnecting}>
              {isScanning ? 'Stop Scanning' : 'Scan for Devices'}
            </Button>

            {devices.length > 0 ? (
              <FlatList
                data={devices}
                renderItem={renderDeviceItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.deviceList}
                showsVerticalScrollIndicator={false}
              />
            ) : isScanning ? (
              <View style={styles.scanningState}>
                <Loader size="lg" label="Scanning for devices..." />
              </View>
            ) : (
              <EmptyState
                title="No Devices Found"
                description="Make sure your VisionAid device is powered on and in pairing mode."
                actionLabel="Scan Again"
                onAction={handleScan}
              />
            )}
          </View>
        )}
      </View>

      <Modal
        visible={showCalibration}
        onClose={() => setShowCalibration(false)}
        title="Device Calibration"
        description="Follow the instructions to calibrate your device for optimal performance."
        size="md">
        <View style={styles.calibrationContent}>
          <Text style={styles.calibrationStep}>1. Hold device at chest level</Text>
          <Text style={styles.calibrationStep}>2. Point forward</Text>
          <Text style={styles.calibrationStep}>3. Press calibrate button</Text>
          <Button variant="primary" size="md" fullWidth onPress={() => setShowCalibration(false)}>
            Start Calibration
          </Button>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: tokens.spacing[4],
    gap: tokens.spacing[1],
  },
  title: {
    fontSize: semanticTokens.fontSize['3xl'],
    fontWeight: tokens.fontWeight.bold,
  },
  subtitle: {
    fontSize: semanticTokens.fontSize.base,
  },
  content: {
    flex: 1,
    padding: tokens.spacing[4],
  },
  connectedSection: {
    flex: 1,
    gap: tokens.spacing[4],
  },
  connectedHeader: {
    alignItems: 'center',
    gap: tokens.spacing[3],
    marginBottom: tokens.spacing[4],
  },
  connectedIcon: {
    fontSize: 48,
  },
  connectedTitle: {
    fontSize: semanticTokens.fontSize.xl,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
  },
  deviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: tokens.spacing[4],
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  statValue: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
  },
  connectedActions: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
    justifyContent: 'center',
  },
  scanSection: {
    flex: 1,
    gap: tokens.spacing[4],
  },
  deviceList: {
    gap: tokens.spacing[3],
    paddingTop: tokens.spacing[4],
  },
  deviceCard: {
    marginBottom: tokens.spacing[2],
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: tokens.radius.md,
    backgroundColor: semanticTokens.colors.surface.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceIconText: {
    fontSize: 24,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
  },
  deviceId: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.subtle,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    marginTop: tokens.spacing[1],
  },
  signalLabel: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
  },
  signalBar: {
    height: 4,
    backgroundColor: semanticTokens.colors.success.default,
    borderRadius: 2,
    maxWidth: 80,
  },
  connectedBadge: {
    backgroundColor: semanticTokens.colors.success.muted,
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.full,
  },
  connectedText: {
    fontSize: semanticTokens.fontSize.xs,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.success.default,
  },
  scanningState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calibrationContent: {
    gap: tokens.spacing[4],
  },
  calibrationStep: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.default,
    paddingVertical: tokens.spacing[2],
  },
});
