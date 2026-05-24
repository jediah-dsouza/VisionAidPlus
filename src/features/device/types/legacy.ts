export interface DeviceState {
  isScanning: boolean;
  isConnecting: boolean;
  connectedDeviceId: string | null;
  availableDevices: Array<{
    id: string;
    name: string;
    rssi: number;
  }>;
  batteryLevel: number | null;
  signalStrength: number;
}

export interface DeviceInfo {
  id: string;
  name: string;
  firmwareVersion: string;
  batteryLevel: number;
  signalStrength: number;
  lastConnected: string | null;
}

export interface DeviceSettings {
  autoReconnect: boolean;
  signalThreshold: number;
  lowBatteryAlert: boolean;
}
