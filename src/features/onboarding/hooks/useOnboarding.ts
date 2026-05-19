import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@app/store';
import {
  setStep,
  completeOnboarding,
  setPermissionStatus,
  setDevicePaired,
  resetOnboarding,
} from '../store/onboardingSlice';
import type { PermissionStatus } from '../types';

export const useOnboarding = () => {
  const dispatch = useAppDispatch();
  const { isComplete, currentStep, permissions, devicePaired } = useAppSelector(
    state => state.onboarding,
  );

  const goToStep = useCallback(
    (step: number) => {
      dispatch(setStep(step));
    },
    [dispatch],
  );

  const complete = useCallback(() => {
    dispatch(completeOnboarding());
  }, [dispatch]);

  const updatePermission = useCallback(
    (
      permission: 'camera' | 'location' | 'notifications' | 'bluetooth',
      status: PermissionStatus,
    ) => {
      dispatch(setPermissionStatus({ permission, status }));
    },
    [dispatch],
  );

  const markDevicePaired = useCallback(() => {
    dispatch(setDevicePaired(true));
  }, [dispatch]);

  const reset = useCallback(() => {
    dispatch(resetOnboarding());
  }, [dispatch]);

  const allPermissionsGranted = Object.values(permissions).every(status => status === 'granted');

  const hasDeniedPermissions = Object.values(permissions).some(
    status => status === 'denied' || status === 'blocked',
  );

  return {
    isComplete,
    currentStep,
    permissions,
    devicePaired,
    goToStep,
    complete,
    updatePermission,
    markDevicePaired,
    reset,
    allPermissionsGranted,
    hasDeniedPermissions,
  };
};
