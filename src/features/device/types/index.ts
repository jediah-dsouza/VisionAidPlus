import type { BLEConnectionState, BLEChargingStatus, BLEDevice, BLEMetrics } from '@core/ble';

export type { DeviceState, DeviceInfo, DeviceSettings } from './legacy';

export interface DeviceScanState {
  isScanning: boolean;
  discoveredDevices: BLEDevice[];
  scanError: string | null;
  lastScanAt: number | null;
}

export interface DeviceConnectionViewState {
  connectionState: BLEConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  isReconnecting: boolean;
  isError: boolean;
  connectedDeviceId: string | null;
  connectedDeviceName: string | null;
  connectedAt: number | null;
  reconnectAttempts: number;
  lastError: string | null;
}

export interface DeviceBatteryViewState {
  batteryLevel: number | null;
  chargingStatus: BLEChargingStatus | null;
  isLowBattery: boolean;
  isCriticalBattery: boolean;
  isCharging: boolean;
  isBatteryFull: boolean;
}

export interface DeviceSignalViewState {
  rssi: number;
  signalQuality: 'excellent' | 'good' | 'fair' | 'weak' | 'poor' | 'unknown';
  isWeakSignal: boolean;
  isCriticalSignal: boolean;
}

export interface SensorHealthStatus {
  sensorType: 'obstacle' | 'battery' | 'signal' | 'status' | 'navigation';
  label: string;
  isActive: boolean;
  lastUpdate: number | null;
  status: 'healthy' | 'warning' | 'stale' | 'inactive';
  message: string;
}

export interface DeviceDiagnosticsViewState {
  totalPacketsReceived: number;
  totalPacketsParsed: number;
  totalParseErrors: number;
  averageParseTimeMs: number;
  totalReconnections: number;
  totalDisconnections: number;
  uptime: number;
  uptimeFormatted: string;
  lastPacketAt: number | null;
}

export interface DeviceInfoViewState {
  firmwareVersion: string | null;
  hardwareVersion: string | null;
  deviceState: string | null;
  mtu: number;
  uptime: number;
  deviceId: string | null;
  deviceName: string | null;
}

export type CalibrationStatus = 'idle' | 'ready' | 'in_progress' | 'complete' | 'failed';

export interface DeviceCalibrationViewState {
  status: CalibrationStatus;
  isCalibrating: boolean;
  lastCalibratedAt: number | null;
}

export interface DeviceReconnectionViewState {
  isReconnecting: boolean;
  currentAttempt: number;
  maxAttempts: number;
  timeUntilNextAttempt: number | null;
}

export interface DeviceViewState {
  scan: DeviceScanState;
  connection: DeviceConnectionViewState;
  battery: DeviceBatteryViewState;
  signal: DeviceSignalViewState;
  diagnostics: DeviceDiagnosticsViewState;
  info: DeviceInfoViewState;
  sensorHealth: SensorHealthStatus[];
  calibration: DeviceCalibrationViewState;
  reconnection: DeviceReconnectionViewState;
}
