import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@app/providers/ThemeProvider';
import { useAppSelector } from '@app/store';

import type { RootStackParamList } from './types/navigation';
import { getModalScreenOptions } from './utils/navigationConfig';

import { AuthNavigator } from './stacks/AuthNavigator';
import { OnboardingNavigator } from './stacks/OnboardingNavigator';
import { MainTabNavigator } from './stacks/MainTabNavigator';
import { EmergencyNavigator } from './stacks/EmergencyNavigator';
import { ModalNavigator } from './stacks/ModalNavigator';
import { CalibrationNavigator } from './stacks/CalibrationNavigator';

import { SplashScreen } from './screens/SplashScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { colors } = useTheme();
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const { hasCompletedOnboarding } = useAppSelector(state => state.settings);

  const getInitialRoute = (): keyof RootStackParamList => {
    if (!isAuthenticated) return 'Auth';
    if (!hasCompletedOnboarding) return 'Onboarding';
    return 'Main';
  };

  return (
    <RootStack.Navigator
      id="RootStack"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
      initialRouteName={getInitialRoute()}>
      <RootStack.Screen name="Splash" component={SplashScreen} options={{ animation: 'none' }} />

      <RootStack.Screen
        name="Auth"
        component={AuthNavigator}
        options={{
          ...getModalScreenOptions(),
          animation: 'slide_from_right',
        }}
      />

      <RootStack.Screen
        name="Onboarding"
        component={OnboardingNavigator}
        options={{
          animation: 'fade',
          gestureEnabled: false,
        }}
      />

      <RootStack.Screen name="Main" component={MainTabNavigator} options={{ animation: 'none' }} />

      <RootStack.Screen
        name="Emergency"
        component={EmergencyNavigator}
        options={{
          ...getModalScreenOptions(),
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />

      <RootStack.Screen
        name="Modal"
        component={ModalNavigator}
        options={{
          ...getModalScreenOptions(),
          presentation: 'modal',
        }}
      />

      <RootStack.Screen
        name="Calibration"
        component={CalibrationNavigator}
        options={{
          ...getModalScreenOptions(),
          presentation: 'modal',
        }}
      />
    </RootStack.Navigator>
  );
};
