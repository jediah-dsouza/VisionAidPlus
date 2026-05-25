import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EMERGENCY_STATES } from '@shared/constants';
import type { EmergencyContact } from '@shared/types';

interface EmergencyHistoryEntry {
  id: string;
  status: string;
  startedAt: number;
  triggeredAt: number | null;
  resolvedAt: number | null;
  cancelledAt: number | null;
  contactsNotified: number;
  contactsFailed: number;
  smsSent: number;
  smsFailed: number;
  duration: number;
}

interface EmergencyState {
  status: (typeof EMERGENCY_STATES)[keyof typeof EMERGENCY_STATES];
  countdownRemaining: number;
  countdownTotal: number;
  triggeredAt: string | null;
  resolvedAt: string | null;
  cancelledAt: string | null;
  contacts: EmergencyContact[];
  contactsNotified: number;
  contactsFailed: number;
  smsSent: number;
  smsFailed: number;
  error: string | null;
  sessionId: string | null;
  history: EmergencyHistoryEntry[];
  escalationAttempts: number;
  gpsCoordinates: { latitude: number; longitude: number } | null;
  lastUpdatedAt: string | null;
}

const initialState: EmergencyState = {
  status: EMERGENCY_STATES.IDLE,
  countdownRemaining: 0,
  countdownTotal: 0,
  triggeredAt: null,
  resolvedAt: null,
  cancelledAt: null,
  contacts: [],
  contactsNotified: 0,
  contactsFailed: 0,
  smsSent: 0,
  smsFailed: 0,
  error: null,
  sessionId: null,
  history: [],
  escalationAttempts: 0,
  gpsCoordinates: null,
  lastUpdatedAt: null,
};

export const emergencySlice = createSlice({
  name: 'emergency',
  initialState,
  reducers: {
    startCountdown: (state, action: PayloadAction<number>) => {
      state.status = EMERGENCY_STATES.COUNTDOWN;
      state.countdownRemaining = action.payload;
      state.countdownTotal = action.payload;
      state.triggeredAt = null;
      state.resolvedAt = null;
      state.cancelledAt = null;
      state.contactsNotified = 0;
      state.contactsFailed = 0;
      state.smsSent = 0;
      state.smsFailed = 0;
      state.lastUpdatedAt = new Date().toISOString();
    },
    updateCountdown: (state, action: PayloadAction<number>) => {
      state.countdownRemaining = action.payload;
      state.lastUpdatedAt = new Date().toISOString();
    },
    triggerEmergency: (state, action: PayloadAction<{ sessionId?: string }>) => {
      state.status = EMERGENCY_STATES.TRIGGERED;
      state.triggeredAt = new Date().toISOString();
      if (action.payload.sessionId) {
        state.sessionId = action.payload.sessionId;
      }
      state.lastUpdatedAt = new Date().toISOString();
    },
    setSending: state => {
      state.status = EMERGENCY_STATES.SENDING;
      state.lastUpdatedAt = new Date().toISOString();
    },
    incrementContactsNotified: (state, action: PayloadAction<number>) => {
      state.contactsNotified += action.payload;
      state.lastUpdatedAt = new Date().toISOString();
    },
    incrementContactsFailed: (state, action: PayloadAction<number>) => {
      state.contactsFailed += action.payload;
      state.lastUpdatedAt = new Date().toISOString();
    },
    setSmsSent: (state, action: PayloadAction<number>) => {
      state.smsSent = action.payload;
      state.lastUpdatedAt = new Date().toISOString();
    },
    setSmsFailed: (state, action: PayloadAction<number>) => {
      state.smsFailed = action.payload;
      state.lastUpdatedAt = new Date().toISOString();
    },
    setEscalationAttempts: (state, action: PayloadAction<number>) => {
      state.escalationAttempts = action.payload;
      state.lastUpdatedAt = new Date().toISOString();
    },
    setGpsCoordinates: (state, action: PayloadAction<{ latitude: number; longitude: number } | null>) => {
      state.gpsCoordinates = action.payload;
      state.lastUpdatedAt = new Date().toISOString();
    },
    resolveEmergency: state => {
      state.status = EMERGENCY_STATES.RESOLVED;
      state.resolvedAt = new Date().toISOString();
      state.lastUpdatedAt = new Date().toISOString();
    },
    cancelEmergency: state => {
      state.status = EMERGENCY_STATES.CANCELLED;
      state.cancelledAt = new Date().toISOString();
      state.countdownRemaining = 0;
      state.lastUpdatedAt = new Date().toISOString();
    },
    saveSessionToHistory: state => {
      if (state.sessionId && state.triggeredAt) {
        const entry: EmergencyHistoryEntry = {
          id: state.sessionId,
          status: state.status,
          startedAt: new Date(state.triggeredAt).getTime(),
          triggeredAt: new Date(state.triggeredAt).getTime(),
          resolvedAt: state.resolvedAt ? new Date(state.resolvedAt).getTime() : null,
          cancelledAt: state.cancelledAt ? new Date(state.cancelledAt).getTime() : null,
          contactsNotified: state.contactsNotified,
          contactsFailed: state.contactsFailed,
          smsSent: state.smsSent,
          smsFailed: state.smsFailed,
          duration: state.resolvedAt
            ? new Date(state.resolvedAt).getTime() - new Date(state.triggeredAt).getTime()
            : 0,
        };
        state.history = [entry, ...state.history].slice(0, 20);
      }
    },
    resetEmergency: state => {
      state.status = EMERGENCY_STATES.IDLE;
      state.countdownRemaining = 0;
      state.countdownTotal = 0;
      state.triggeredAt = null;
      state.resolvedAt = null;
      state.cancelledAt = null;
      state.contactsNotified = 0;
      state.contactsFailed = 0;
      state.smsSent = 0;
      state.smsFailed = 0;
      state.sessionId = null;
      state.escalationAttempts = 0;
      state.gpsCoordinates = null;
      state.lastUpdatedAt = new Date().toISOString();
    },
    setContacts: (state, action: PayloadAction<EmergencyContact[]>) => {
      state.contacts = action.payload;
    },
    addContact: (state, action: PayloadAction<EmergencyContact>) => {
      if (action.payload.isPrimary) {
        state.contacts = state.contacts.map(c => ({ ...c, isPrimary: false }));
      }
      state.contacts = [...state.contacts, action.payload];
    },
    removeContact: (state, action: PayloadAction<string>) => {
      state.contacts = state.contacts.filter(c => c.id !== action.payload);
    },
    updateContact: (state, action: PayloadAction<EmergencyContact>) => {
      const index = state.contacts.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        if (action.payload.isPrimary) {
          state.contacts = state.contacts.map(c => ({ ...c, isPrimary: false }));
        }
        state.contacts[index] = action.payload;
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearHistory: state => {
      state.history = [];
    },
  },
});

export const emergencyActions = emergencySlice.actions;
export default emergencySlice.reducer;
