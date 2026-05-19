import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { storage, STORAGE_KEYS } from '../../../core';
import type { OnboardingState, PermissionState, PermissionStatus } from '../types';

const initialState: OnboardingState = {
  isComplete: false,
  currentStep: 0,
  permissions: {
    camera: 'undetermined',
    location: 'undetermined',
    notifications: 'undetermined',
    bluetooth: 'undetermined',
  },
  devicePaired: false,
};

export const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    setStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    completeOnboarding: state => {
      state.isComplete = true;
      state.currentStep = 0;
      storage.set(STORAGE_KEYS.ONBOARDING_COMPLETE, true);
    },
    setPermissionStatus: (
      state,
      action: PayloadAction<{ permission: keyof PermissionState; status: PermissionStatus }>,
    ) => {
      state.permissions[action.payload.permission] = action.payload.status;
    },
    setDevicePaired: (state, action: PayloadAction<boolean>) => {
      state.devicePaired = action.payload;
      if (action.payload) {
        storage.set(STORAGE_KEYS.DEVICE_PAIRED, true);
      }
    },
    resetOnboarding: state => {
      state.isComplete = false;
      state.currentStep = 0;
      state.permissions = initialState.permissions;
      state.devicePaired = false;
      storage.remove(STORAGE_KEYS.ONBOARDING_COMPLETE);
      storage.remove(STORAGE_KEYS.DEVICE_PAIRED);
    },
    loadOnboardingState: (state, action: PayloadAction<Partial<OnboardingState>>) => {
      if (action.payload.isComplete !== undefined) {
        state.isComplete = action.payload.isComplete;
      }
      if (action.payload.permissions) {
        state.permissions = action.payload.permissions;
      }
      if (action.payload.devicePaired !== undefined) {
        state.devicePaired = action.payload.devicePaired;
      }
    },
  },
});

export const {
  setStep,
  completeOnboarding,
  setPermissionStatus,
  setDevicePaired,
  resetOnboarding,
  loadOnboardingState,
} = onboardingSlice.actions;

export default onboardingSlice.reducer;
