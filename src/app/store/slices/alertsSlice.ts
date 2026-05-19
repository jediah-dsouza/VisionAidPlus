import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  dismissed: boolean;
  source: 'ble' | 'ai' | 'system' | 'emergency';
}

interface AlertsState {
  alerts: Alert[];
  unreadCount: number;
}

const initialState: AlertsState = {
  alerts: [],
  unreadCount: 0,
};

export const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    addAlert: (
      state,
      action: PayloadAction<Omit<Alert, 'id' | 'timestamp' | 'read' | 'dismissed'>>,
    ) => {
      const newAlert: Alert = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
        dismissed: false,
      };
      state.alerts = [newAlert, ...state.alerts];
      state.unreadCount += 1;
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find(a => a.id === action.payload);
      if (alert && !alert.read) {
        alert.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: state => {
      state.alerts.forEach(a => {
        a.read = true;
      });
      state.unreadCount = 0;
    },
    dismissAlert: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find(a => a.id === action.payload);
      if (alert && !alert.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.alerts = state.alerts.filter(a => a.id !== action.payload);
    },
    clearAllAlerts: () => initialState,
  },
});

export const alertsActions = alertsSlice.actions;
export default alertsSlice.reducer;
