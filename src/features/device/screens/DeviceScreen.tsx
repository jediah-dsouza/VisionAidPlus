import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert as RNAlert, RefreshControl } from 'react-native';
import { useTheme } from '@app/providers/ThemeProvider';
import { Button, Modal, Loader } from '@shared/design-system';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';
import { accessibilityEngine } from '@core/accessibility';
import { useDevice } from '../hooks';
import {
  ScanHeader,
  DeviceList,
  ConnectionStatus,
  DeviceInfoPanel,
  BatteryMonitor,
  SignalMonitor,
  SensorHealthGrid,
  DiagnosticsPanel,
  CalibrationAccessCard,
  ReconnectBanner,
  EmptyDeviceState,
} from '../widgets';

interface DeviceScreenProps {
  navigation?: any;
}

export const DeviceScreen: React.FC<DeviceScreenProps> = () => {
  const { colors } = useTheme();
  const {
    viewState,
    scan,
    connection,
    battery,
    signal,
    diagnostics,
    sensorHealth,
    calibration,
    reconnection,
  } = useDevice();

  const isConnected = connection.isConnected;
  const isConnecting = connection.isConnecting;
  const isScanning = scan.isScanning;

  const handleScanToggle = useCallback(() => {
    if (isScanning) {
      scan.stopScan();
    } else {
      accessibilityEngine.announce('Scanning for nearby devices', 'normal', false);
      scan.startScan();
    }
  }, [isScanning, scan]);

  const handleConnect = useCallback(
    async (device: any) => {
      accessibilityEngine.announce(`Connecting to ${device.name}`, 'high', false);
      await connection.connectToDevice(device);
    },
    [connection],
  );

  const handleDisconnect = useCallback(() => {
    RNAlert.alert('Disconnect Device', 'Are you sure you want to disconnect from this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: () => {
          accessibilityEngine.announce('Disconnecting from device', 'high', false);
          connection.disconnect();
        },
      },
    ]);
  }, [connection]);

  const handleRetryAfterError = useCallback(() => {
    connection.retryAfterError();
    handleScanToggle();
  }, [connection, handleScanToggle]);

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isConnected) {
      diagnostics.refresh();
    } else {
      await scan.startScan();
    }
    setRefreshing(false);
  }, [isConnected, diagnostics, scan]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Device</Text>
          <ConnectionStatus connectionState={viewState.connection.connectionState} size="sm" />
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {isConnected
            ? `Connected to ${connection.connectedDeviceName ?? 'device'}`
            : 'Manage your VisionAid device'}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.textSecondary}
          />
        }>
        {reconnection.showReconnectionUI && (
          <ReconnectBanner
            currentAttempt={reconnection.currentAttempt}
            maxAttempts={reconnection.maxAttempts}
            timeUntilNextAttempt={reconnection.timeUntilNextAttempt}
            onDismiss={reconnection.dismissReconnection}
          />
        )}

        {isConnected ? (
          <View style={styles.connectedView}>
            <DeviceInfoPanel
              deviceName={connection.connectedDeviceName}
              deviceId={connection.connectedDeviceId}
              firmwareVersion={viewState.info.firmwareVersion}
              hardwareVersion={viewState.info.hardwareVersion}
              mtu={viewState.info.mtu}
            />
            <BatteryMonitor
              batteryLevel={battery.batteryLevel}
              chargingStatus={battery.chargingStatus}
              isLowBattery={battery.isLowBattery}
              isCriticalBattery={battery.isCriticalBattery}
              isCharging={battery.isCharging}
              isBatteryFull={battery.isBatteryFull}
            />
            <SignalMonitor
              rssi={signal.rssi}
              signalQuality={signal.signalQuality}
              isWeakSignal={signal.isWeakSignal}
              isCriticalSignal={signal.isCriticalSignal}
            />
            <SensorHealthGrid sensors={sensorHealth.sensors} />
            <DiagnosticsPanel
              totalPacketsReceived={diagnostics.totalPacketsReceived}
              totalPacketsParsed={diagnostics.totalPacketsParsed}
              totalParseErrors={diagnostics.totalParseErrors}
              averageParseTimeMs={diagnostics.averageParseTimeMs}
              totalReconnections={diagnostics.totalReconnections}
              totalDisconnections={diagnostics.totalDisconnections}
              uptimeFormatted={diagnostics.uptimeFormatted}
              lastPacketAt={diagnostics.lastPacketAt}
              hasActivity={diagnostics.hasActivity}
            />
            <CalibrationAccessCard
              status={calibration.status}
              isCalibrating={calibration.isCalibrating}
              isConnected={isConnected}
              onStartCalibration={calibration.startCalibration}
              onCancelCalibration={calibration.cancelCalibration}
            />
            <Button
              variant="danger"
              size="lg"
              fullWidth
              onPress={handleDisconnect}
              accessibilityLabel="Disconnect from device">
              Disconnect
            </Button>
          </View>
        ) : (
          <View style={styles.disconnectedView}>
            <ScanHeader isScanning={isScanning} onScanToggle={handleScanToggle} />
            {isScanning || scan.discoveredDevices.length > 0 ? (
              <DeviceList
                devices={scan.discoveredDevices}
                connectedDeviceId={connection.connectedDeviceId}
                isConnecting={isConnecting}
                isScanning={isScanning}
                onConnect={handleConnect}
              />
            ) : (
              <EmptyDeviceState
                isScanning={isScanning}
                hasError={connection.isError}
                errorMessage={connection.lastError}
                onScan={handleScanToggle}
                onRetry={handleRetryAfterError}
              />
            )}
            {isConnecting && (
              <View style={styles.connectingOverlay}>
                <Loader size="lg" label="Connecting to device..." />
              </View>
            )}
          </View>
        )}

        {calibration.isCalibrating && (
          <Modal
            visible={calibration.isCalibrating}
            onClose={calibration.cancelCalibration}
            title="Calibrating Device"
            description="Please wait while we calibrate your device sensors. Keep the device steady."
            size="md">
            <View style={styles.calibrationModalContent}>
              <Loader size="xl" label="Calibrating sensors..." />
              <Text style={styles.calibrationHint}>
                Hold the device at chest level and point forward.
              </Text>
              <Button
                variant="outline"
                size="md"
                fullWidth
                onPress={calibration.cancelCalibration}
                accessibilityLabel="Cancel calibration">
                Cancel
              </Button>
            </View>
          </Modal>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: tokens.spacing[4],
    paddingTop: tokens.spacing[4],
    paddingBottom: tokens.spacing[2],
    gap: tokens.spacing[1],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: semanticTokens.fontSize['3xl'],
    fontWeight: tokens.fontWeight.bold,
  },
  subtitle: {
    fontSize: semanticTokens.fontSize.base,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
    paddingBottom: tokens.spacing[8],
  },
  connectedView: {
    gap: tokens.spacing[4],
  },
  disconnectedView: {
    flex: 1,
    gap: tokens.spacing[4],
  },
  connectingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: tokens.radius.lg,
  },
  calibrationModalContent: {
    gap: tokens.spacing[6],
    alignItems: 'center',
    paddingVertical: tokens.spacing[4],
  },
  calibrationHint: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.subtle,
    textAlign: 'center',
    lineHeight: 24,
  },
});
