import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BLE_STATES } from '@shared/constants';

interface BLEState {
  status: (typeof BLE_STATES)[keyof typeof BLE_STATES];
  connectedDeviceId: string | null;
  devices: Array<{ id: string; name: string; rssi: number }>;
  signalStrength: number;
  batteryLevel: number | null;
  error: string | null;
}

const initialState: BLEState = {
  status: BLE_STATES.IDLE,
  connectedDeviceId: null,
  devices: [],
  signalStrength: 0,
  batteryLevel: null,
  error: null,
};

export const bleSlice = createSlice({
  name: 'ble',
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<BLEState['status']>) => {
      state.status = action.payload;
      state.error = null;
    },
    setConnectedDevice: (state, action: PayloadAction<string | null>) => {
      state.connectedDeviceId = action.payload;
    },
    setDevices: (state, action: PayloadAction<BLEState['devices']>) => {
      state.devices = action.payload;
    },
    setSignalStrength: (state, action: PayloadAction<number>) => {
      state.signalStrength = action.payload;
    },
    setBatteryLevel: (state, action: PayloadAction<number | null>) => {
      state.batteryLevel = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.status = BLE_STATES.ERROR;
    },
    reset: () => initialState,
  },
});

export const bleActions = bleSlice.actions;
export default bleSlice.reducer;
