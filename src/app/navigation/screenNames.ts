export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Navigation: undefined;
  Alerts: undefined;
  Device: undefined;
  Settings: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  AlertDetails: { alertId: string };
  DeviceCalibration: undefined;
  VoiceAssistant: undefined;
  Analytics: undefined;
  About: undefined;
};
