import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@app/providers/ThemeProvider';
import { useAppSelector, useAppDispatch } from '@app/store';

import type { RootStackParamList } from './types/navigation';
import { getModalScreenOptions } from './utils/navigationConfig';

import { AuthNavigator } from './stacks/AuthNavigator';
import { OnboardingNavigator } from './stacks/OnboardingNavigator';
import { MainTabNavigator } from './stacks/MainTabNavigator';
import { EmergencyNavigator } from './stacks/EmergencyNavigator';
import { ModalNavigator } from './stacks/ModalNavigator';
import { CalibrationNavigator } from './stacks/CalibrationNavigator';

import { SplashScreen } from './screens/SplashScreen';
import {
  isDevAuthBypassEnabled,
  getMockAuthData,
  getInitialSettingsState,
  logDevAuthStatus,
} from '@features/auth/DevAuthBypass';
import { setUser, setToken } from '@features/auth';
import { settingsActions } from '@app/store/slices/settingsSlice';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();

  // DEV ONLY: Initialize mock auth state if bypass is enabled
  useEffect(() => {
    if (isDevAuthBypassEnabled()) {
      logDevAuthStatus();

      // Set mock user and token in Redux auth state
      const mockAuthData = getMockAuthData();
      if (mockAuthData.user) {
        dispatch(setUser(mockAuthData.user));
        dispatch(setToken(mockAuthData.token));
      }

      // Set onboarding complete in settings
      const mockSettings = getInitialSettingsState();
      if (mockSettings) {
        dispatch(settingsActions.setHasCompletedOnboarding(mockSettings.hasCompletedOnboarding));
      }
    }
  }, [dispatch]);

  const { isAuthenticated } = useAppSelector(state => state.auth);
  const { hasCompletedOnboarding } = useAppSelector(state => state.settings);

  const getInitialRoute = (): keyof RootStackParamList => {
    // DEV ONLY: Skip auth flow if bypass is enabled
    if (isDevAuthBypassEnabled()) {
      return 'Main';
    }

    // Production auth logic
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
