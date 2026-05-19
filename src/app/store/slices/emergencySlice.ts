import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EMERGENCY_STATES } from '@shared/constants';
import type { EmergencyContact } from '@shared/types';

interface EmergencyState {
  status: (typeof EMERGENCY_STATES)[keyof typeof EMERGENCY_STATES];
  countdownRemaining: number;
  triggeredAt: string | null;
  contactsNotified: string[];
  contacts: EmergencyContact[];
  error: string | null;
}

const initialState: EmergencyState = {
  status: EMERGENCY_STATES.IDLE,
  countdownRemaining: 5,
  triggeredAt: null,
  contactsNotified: [],
  contacts: [],
  error: null,
};

export const emergencySlice = createSlice({
  name: 'emergency',
  initialState,
  reducers: {
    startCountdown: (state, action: PayloadAction<number>) => {
      state.status = EMERGENCY_STATES.COUNTDOWN;
      state.countdownRemaining = action.payload;
    },
    updateCountdown: (state, action: PayloadAction<number>) => {
      state.countdownRemaining = action.payload;
    },
    triggerEmergency: state => {
      state.status = EMERGENCY_STATES.TRIGGERED;
      state.triggeredAt = new Date().toISOString();
    },
    setSending: state => {
      state.status = EMERGENCY_STATES.SENDING;
    },
    resolveEmergency: state => {
      state.status = EMERGENCY_STATES.RESOLVED;
      state.triggeredAt = null;
    },
    cancelEmergency: state => {
      state.status = EMERGENCY_STATES.CANCELLED;
      state.countdownRemaining = 5;
    },
    resetEmergency: state => {
      state.status = EMERGENCY_STATES.IDLE;
      state.countdownRemaining = 5;
      state.triggeredAt = null;
    },
    setContacts: (state, action: PayloadAction<EmergencyContact[]>) => {
      state.contacts = action.payload;
    },
    addContact: (state, action: PayloadAction<EmergencyContact>) => {
      state.contacts = [...state.contacts, action.payload];
    },
    removeContact: (state, action: PayloadAction<string>) => {
      state.contacts = state.contacts.filter(c => c.id !== action.payload);
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const emergencyActions = emergencySlice.actions;
export default emergencySlice.reducer;
