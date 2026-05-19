export interface OnboardingState {
  isComplete: boolean;
  currentStep: number;
  permissions: PermissionState;
  devicePaired: boolean;
}

export interface PermissionState {
  camera: PermissionStatus;
  location: PermissionStatus;
  notifications: PermissionStatus;
  bluetooth: PermissionStatus;
}

export type PermissionStatus = 'undetermined' | 'granted' | 'denied' | 'blocked';

export interface OnboardingSlice extends OnboardingState {
  setStep: (step: number) => void;
  completeOnboarding: () => void;
  setPermissionStatus: (permission: keyof PermissionState, status: PermissionStatus) => void;
  setDevicePaired: (paired: boolean) => void;
  resetOnboarding: () => void;
}
