import { useMemo } from 'react';
import type { DeviceViewState } from '../types';
import { useDeviceScan } from './useDeviceScan';
import { useDeviceConnection } from './useDeviceConnection';
import { useDeviceBattery } from './useDeviceBattery';
import { useDeviceSignal } from './useDeviceSignal';
import { useDeviceDiagnostics } from './useDeviceDiagnostics';
import { useDeviceSensorHealth } from './useDeviceSensorHealth';
import { useDeviceCalibration } from './useDeviceCalibration';
import { useDeviceReconnection } from './useDeviceReconnection';

export interface UseDeviceResult {
  viewState: DeviceViewState;
  scan: ReturnType<typeof useDeviceScan>;
  connection: ReturnType<typeof useDeviceConnection>;
  battery: ReturnType<typeof useDeviceBattery>;
  signal: ReturnType<typeof useDeviceSignal>;
  diagnostics: ReturnType<typeof useDeviceDiagnostics>;
  sensorHealth: ReturnType<typeof useDeviceSensorHealth>;
  calibration: ReturnType<typeof useDeviceCalibration>;
  reconnection: ReturnType<typeof useDeviceReconnection>;
}

export const useDevice = (): UseDeviceResult => {
  const scan = useDeviceScan();
  const connection = useDeviceConnection();
  const battery = useDeviceBattery();
  const signal = useDeviceSignal();
  const diagnostics = useDeviceDiagnostics();
  const sensorHealth = useDeviceSensorHealth();
  const calibration = useDeviceCalibration();
  const reconnection = useDeviceReconnection();

  const viewState: DeviceViewState = useMemo(
    () => ({
      scan,
      connection,
      battery,
      signal,
      diagnostics,
      info: {
        firmwareVersion: null,
        hardwareVersion: null,
        deviceState: null,
        mtu: 23,
        uptime: diagnostics.uptime,
        deviceId: connection.connectedDeviceId,
        deviceName: connection.connectedDeviceName,
      },
      sensorHealth: sensorHealth.sensors,
      calibration,
      reconnection,
    }),
    [scan, connection, battery, signal, diagnostics, sensorHealth, calibration, reconnection],
  );

  return {
    viewState,
    scan,
    connection,
    battery,
    signal,
    diagnostics,
    sensorHealth,
    calibration,
    reconnection,
  };
};
