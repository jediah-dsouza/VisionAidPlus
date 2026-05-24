import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Emergency: NavigatorScreenParams<EmergencyStackParamList>;
  Modal: NavigatorScreenParams<ModalStackParamList>;
  Calibration: NavigatorScreenParams<CalibrationStackParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  Permissions: undefined;
  DevicePairing: undefined;
  Complete: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  NavigationTab: NavigatorScreenParams<NavigationStackParamList>;
  AlertsTab: NavigatorScreenParams<AlertsStackParamList>;
  DeviceTab: NavigatorScreenParams<DeviceStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

export type HomeStackParamList = {
  Home: undefined;
  Emergency: undefined;
};

export type NavigationStackParamList = {
  Navigation: undefined;
  LiveNavigation: undefined;
  DestinationSearch: undefined;
  RouteDetails: { routeId: string };
};

export type AlertsStackParamList = {
  Alerts: undefined;
  AlertDetails: { alertId: string };
};

export type DeviceStackParamList = {
  Device: undefined;
  DeviceDetails: { deviceId: string };
  Calibration: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
  About: undefined;
  Privacy: undefined;
  Accessibility: undefined;
};

export type EmergencyStackParamList = {
  EmergencyHome: undefined;
  CaregiverContacts: undefined;
  EmergencyHistory: undefined;
};

export type ModalStackParamList = {
  Confirmation: { title: string; message: string; confirmText?: string; cancelText?: string };
  Alert: { title: string; message: string; type?: 'info' | 'warning' | 'error' };
  BottomSheet: { component: string; props?: Record<string, unknown> };
};

export type CalibrationStackParamList = {
  CalibrationStart: undefined;
  CalibrationInstructions: undefined;
  CalibrationComplete: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, T>,
  RootStackScreenProps<'Auth'>
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  RootStackScreenProps<'Main'>
>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, T>,
  MainTabScreenProps<'HomeTab'>
>;

export type NavigationStackScreenProps<T extends keyof NavigationStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<NavigationStackParamList, T>,
    MainTabScreenProps<'NavigationTab'>
  >;

export type DeviceStackScreenProps<T extends keyof DeviceStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<DeviceStackParamList, T>,
  MainTabScreenProps<'DeviceTab'>
>;

export type EmergencyStackScreenProps<T extends keyof EmergencyStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<EmergencyStackParamList, T>,
    RootStackScreenProps<'Emergency'>
  >;

export type ModalStackScreenProps<T extends keyof ModalStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ModalStackParamList, T>,
  RootStackScreenProps<'Modal'>
>;

export type CalibrationStackScreenProps<T extends keyof CalibrationStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<CalibrationStackParamList, T>,
    RootStackScreenProps<'Calibration'>
  >;
