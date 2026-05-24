import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BLE_STATES } from '@shared/constants';
import type { BLEDevice } from '@core/ble';

function connectionStateToStatus(state: BLEState['connectionState']): BLEState['status'] {
  const map: Record<string, string> = {
    idle: BLE_STATES.IDLE,
    scanning: BLE_STATES.SCANNING,
    connecting: BLE_STATES.CONNECTING,
    connected: BLE_STATES.CONNECTED,
    disconnecting: BLE_STATES.DISCONNECTED,
    disconnected: BLE_STATES.DISCONNECTED,
    reconnecting: BLE_STATES.RECONNECTING,
    error: BLE_STATES.ERROR,
  };
  return (map[state] ?? BLE_STATES.IDLE) as BLEState['status'];
}

interface BLEState {
  connectionState: 'idle' | 'scanning' | 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'reconnecting' | 'error';
  status: (typeof BLE_STATES)[keyof typeof BLE_STATES];
  connectedDeviceId: string | null;
  connectedDeviceName: string | null;
  devices: BLEDevice[];
  signalStrength: number;
  batteryLevel: number | null;
  chargingStatus: 'charging' | 'discharging' | 'full' | null;
  mtu: number;
  reconnectAttempts: number;
  lastError: string | null;
  connectedAt: number | null;
  isScanning: boolean;
}

const initialState: BLEState = {
  connectionState: 'idle',
  status: BLE_STATES.IDLE,
  connectedDeviceId: null,
  connectedDeviceName: null,
  devices: [],
  signalStrength: -127,
  batteryLevel: null,
  chargingStatus: null,
  mtu: 23,
  reconnectAttempts: 0,
  lastError: null,
  connectedAt: null,
  isScanning: false,
};

export const bleSlice = createSlice({
  name: 'ble',
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<BLEState['status']>) => {
      state.status = action.payload;
      state.lastError = null;
    },
    setConnectionState: (state, action: PayloadAction<BLEState['connectionState']>) => {
      state.connectionState = action.payload;
      state.status = connectionStateToStatus(action.payload);
    },
    setConnected: (state, action: PayloadAction<{ id: string; name: string; rssi?: number } | null>) => {
      if (action.payload) {
        state.connectionState = 'connected';
        state.status = BLE_STATES.CONNECTED;
        state.connectedDeviceId = action.payload.id;
        state.connectedDeviceName = action.payload.name;
        state.connectedAt = Date.now();
        state.isScanning = false;
        state.lastError = null;
        if (action.payload.rssi !== undefined) {
          state.signalStrength = action.payload.rssi;
        }
      } else {
        state.connectionState = 'disconnected';
        state.status = BLE_STATES.DISCONNECTED;
        state.connectedDeviceId = null;
        state.connectedDeviceName = null;
        state.connectedAt = null;
        state.signalStrength = -127;
        state.isScanning = false;
      }
    },
    setConnectedDevice: (state, action: PayloadAction<{ id: string; name: string } | null>) => {
      if (action.payload) {
        state.connectedDeviceId = action.payload.id;
        state.connectedDeviceName = action.payload.name;
        state.connectedAt = Date.now();
      } else {
        state.connectedDeviceId = null;
        state.connectedDeviceName = null;
        state.connectedAt = null;
      }
    },
    setDevices: (state, action: PayloadAction<BLEDevice[]>) => {
      state.devices = action.payload;
    },
    addDevice: (state, action: PayloadAction<BLEDevice>) => {
      const existingIndex = state.devices.findIndex(d => d.id === action.payload.id);
      if (existingIndex >= 0) {
        state.devices[existingIndex] = action.payload;
      } else {
        state.devices.push(action.payload);
      }
    },
    setSignalStrength: (state, action: PayloadAction<number>) => {
      state.signalStrength = action.payload;
    },
    setBatteryLevel: (state, action: PayloadAction<number | null>) => {
      state.batteryLevel = action.payload !== null ? Math.max(0, Math.min(100, action.payload)) : null;
    },
    setChargingStatus: (state, action: PayloadAction<BLEState['chargingStatus']>) => {
      state.chargingStatus = action.payload;
    },
    setMtu: (state, action: PayloadAction<number>) => {
      state.mtu = action.payload;
    },
    setReconnectAttempts: (state, action: PayloadAction<number>) => {
      state.reconnectAttempts = action.payload;
    },
    setScanning: (state, action: PayloadAction<boolean>) => {
      state.isScanning = action.payload;
      if (action.payload) {
        state.connectionState = 'scanning';
        state.status = BLE_STATES.SCANNING;
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.lastError = action.payload;
      state.status = BLE_STATES.ERROR;
      state.connectionState = 'error';
    },
    reset: () => initialState,
  },
});

export const bleActions = bleSlice.actions;
export default bleSlice.reducer;
