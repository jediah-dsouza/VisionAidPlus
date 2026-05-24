import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BLE_STATES } from '@shared/constants';
import type { BLEDevice } from '@core/ble';

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
      state.batteryLevel = action.payload;
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
