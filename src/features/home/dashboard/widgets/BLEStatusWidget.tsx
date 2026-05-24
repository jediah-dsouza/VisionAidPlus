import React, { useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppSelector, store } from '@app/store';
import { Card, Button } from '@shared/design-system/components';
import { semanticTokens, tokens } from '@shared/design-system/theme';
import { bleService } from '@core/native/BLEService';
import { WidgetStatus } from '../types';

interface BLEStatusWidgetProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
  compact?: boolean;
}

const getStatusFromState = (connectionState: string): WidgetStatus => {
  switch (connectionState) {
    case 'connected':
      return 'connected';
    case 'scanning':
    case 'connecting':
    case 'reconnecting':
      return 'loading';
    case 'disconnected':
    case 'error':
      return 'disconnected';
    default:
      return 'disconnected';
  }
};

const signalColor = semanticTokens.colors.success.default;

const getSignalBars = (rssi: number): number => {
  if (rssi >= -50) return 4;
  if (rssi >= -60) return 3;
  if (rssi >= -70) return 2;
  if (rssi >= -80) return 1;
  return 0;
};

const getSignalLabel = (rssi: number): string => {
  if (rssi >= -50) return 'Excellent';
  if (rssi >= -60) return 'Good';
  if (rssi >= -70) return 'Fair';
  if (rssi >= -80) return 'Weak';
  return 'Poor';
};

export const BLEStatusWidget: React.FC<BLEStatusWidgetProps> = ({
  onConnect,
  onDisconnect,
  compact = false,
}) => {
  // [DIAGNOSTIC] Store identity
  const bleWidgetStoreId = (store as any).__REDUX_STORE_ID__;
  const bleWidgetGlobalStore = (globalThis as any).__VISIONAID_STORE__;
  console.log('[BLEWidget] 🔄 RENDER - Widget mounting/updating');
  console.log('[BLEWidget] Props:', { onConnect: !!onConnect, onDisconnect: !!onDisconnect, compact });
  console.log(`[BLEWidget] 🔑 Store ID: ${bleWidgetStoreId}`);
  console.log(`[BLEWidget]   store === globalThis.__VISIONAID_STORE__: ${store === bleWidgetGlobalStore}`);
  console.log(`[BLEWidget]   store.subscribe: ${typeof store.subscribe}`);
  console.log(`[BLEWidget]   useAppSelector function ref: ${useAppSelector.name || 'anonymous'}`);

  // [DIAGNOSTIC] Direct store subscription to detect subscriber firing
  useEffect(() => {
    console.log('[BLEWidget] 📡 Installing direct store.subscribe() listener');
    const unsubscribe = store.subscribe(() => {
      const currentState = store.getState();
      console.log('[BLEWidget] 🔔 STORE SUBSCRIBER FIRED');
      console.log('[BLEWidget]   ble.status:', currentState.ble.status);
      console.log('[BLEWidget]   ble.connectedDeviceId:', currentState.ble.connectedDeviceId);
      console.log('[BLEWidget]   store.getState().ble === state.ble via selector:', 'N/A (selector not called)');
    });
    return () => {
      console.log('[BLEWidget] 🧹 Cleaning up store.subscribe() listener');
      unsubscribe();
    };
  }, []);

  const {
    connectionState,
    status,
    connectedDeviceId,
    connectedDeviceName,
    signalStrength,
    batteryLevel,
    chargingStatus,
    devices,
    reconnectAttempts,
    isScanning,
  } = useAppSelector(
    state => {
      console.log('[BLEWidget] Selector executing - full ble state:', state.ble);
      return state.ble;
    },
  );

  console.log('[BLEWidget] Current Redux state:', { connectionState, status, connectedDeviceId, signalStrength, batteryLevel });

  const widgetStatus = useMemo(() => getStatusFromState(connectionState), [connectionState]);
  const signalBars = useMemo(() => getSignalBars(signalStrength), [signalStrength]);
  const signalLabel = useMemo(() => getSignalLabel(signalStrength), [signalStrength]);

  const handleRetry = useCallback(() => {
    bleService.startScan();
  }, []);

  const statusColor = useMemo(() => {
    switch (widgetStatus) {
      case 'connected':
        return semanticTokens.colors.success.default;
      case 'loading':
        return semanticTokens.colors.warning.default;
      default:
        return semanticTokens.colors.danger.default;
    }
  }, [widgetStatus]);

  const statusText = useMemo(() => {
    if (connectionState === 'reconnecting') {
      return `Reconnecting (${reconnectAttempts})...`;
    }
    switch (widgetStatus) {
      case 'connected':
        return 'Connected';
      case 'loading':
        if (isScanning) return 'Scanning...';
        return 'Connecting...';
      default:
        return 'Disconnected';
    }
  }, [widgetStatus, connectionState, isScanning, reconnectAttempts]);

  if (compact) {
    return (
      <View
        style={[styles.compactContainer, { borderColor: statusColor }]}
        accessibilityLabel={`Bluetooth ${statusText}`}
        accessibilityRole="text">
        <Text style={styles.compactIcon}>📱</Text>
        <View style={styles.compactContent}>
          <View style={styles.signalBars}>
            {[1, 2, 3, 4].map(bar => (
              <View
                key={bar}
                style={[
                  styles.signalBar,
                  { height: 8 + bar * 3 },
                  bar <= signalBars
                    ? { backgroundColor: statusColor }
                    : { backgroundColor: semanticTokens.colors.neutral[600] },
                ]}
              />
            ))}
          </View>
          {widgetStatus === 'connected' && (
            <Text style={styles.compactBattery}>{batteryLevel ?? '?'}%</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <Card
      variant="elevated"
      padding="md"
      accessibilityLabel={`Bluetooth device status: ${statusText}`}
      accessibilityRole="text">
      <View style={styles.header}>
        <Text style={styles.icon}>📱</Text>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Device</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>
      </View>

      {widgetStatus === 'connected' && connectedDeviceId && (
        <View style={styles.deviceInfo}>
          <View style={styles.signalContainer}>
            <Text style={styles.signalLabel}>Signal {signalLabel}</Text>
            <View style={styles.signalBarsLarge}>
              {[1, 2, 3, 4].map(bar => (
                <View
                  key={bar}
                  style={[
                    styles.signalBarLarge,
                    { height: 12 + bar * 4 },
                    bar <= signalBars
                      ? { backgroundColor: signalColor }
                      : { backgroundColor: semanticTokens.colors.neutral[600] },
                  ]}
                />
              ))}
            </View>
          </View>
          {batteryLevel !== null && (
            <View style={styles.batteryContainer}>
              <Text style={styles.batteryIcon}>🔋</Text>
              <Text style={styles.batteryText}>{batteryLevel}%</Text>
              {chargingStatus === 'charging' && (
                <Text style={styles.chargingText}>⚡</Text>
              )}
              {batteryLevel <= 20 && (
                <Text style={styles.batteryLow}>⚠️</Text>
              )}
            </View>
          )}
          {connectionState === 'reconnecting' && (
            <Text style={styles.reconnectText}>Reconnecting...</Text>
          )}
        </View>
      )}

      {widgetStatus === 'disconnected' && devices.length === 0 && (
        <Text style={styles.hint}>Connect a VisionAid device for obstacle detection</Text>
      )}

      <View style={styles.actions}>
        {widgetStatus === 'connected' ? (
          <Button
            variant="ghost"
            size="sm"
            onPress={onDisconnect}
            accessibilityLabel="Disconnect device">
            Disconnect
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            isLoading={widgetStatus === 'loading'}
            onPress={onConnect}
            accessibilityLabel={widgetStatus === 'loading' ? 'Connecting' : 'Connect device'}>
            Connect
          </Button>
        )}
        {widgetStatus === 'error' && (
          <Button
            variant="outline"
            size="sm"
            onPress={handleRetry}
            accessibilityLabel="Retry connection">
            Retry
          </Button>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing[2],
    borderRadius: semanticTokens.radius.md,
    borderWidth: 1,
    gap: tokens.spacing[2],
    minHeight: semanticTokens.touchTarget.minimum,
  },
  compactIcon: {
    fontSize: 20,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 20,
  },
  signalBar: {
    width: 4,
    borderRadius: 2,
  },
  compactBattery: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  icon: {
    fontSize: 28,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.full,
    gap: tokens.spacing[1],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: semanticTokens.fontSize.xs,
    fontWeight: tokens.fontWeight.medium,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: tokens.spacing[4],
    paddingTop: tokens.spacing[4],
    borderTopWidth: 1,
    borderTopColor: semanticTokens.colors.border.default,
  },
  signalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  signalLabel: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  signalBarsLarge: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 28,
  },
  signalBarLarge: {
    width: 6,
    borderRadius: 3,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
  },
  batteryIcon: {
    fontSize: 16,
  },
  batteryText: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
  },
  chargingText: {
    fontSize: 14,
    marginLeft: tokens.spacing[1],
  },
  batteryLow: {
    fontSize: 14,
    marginLeft: tokens.spacing[1],
  },
  reconnectText: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.warning.default,
    marginTop: tokens.spacing[1],
  },
  hint: {
    marginTop: tokens.spacing[3],
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: tokens.spacing[4],
    gap: tokens.spacing[2],
  },
});
