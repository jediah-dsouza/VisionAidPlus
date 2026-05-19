import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '../types/navigation';
import { getDefaultScreenOptions } from '../utils/navigationConfig';
import {
  WelcomeScreen,
  PermissionsScreen,
  DevicePairingScreen,
  CompleteScreen,
} from '@features/onboarding/screens';

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => (
  <OnboardingStack.Navigator
    id="OnboardingStack"
    screenOptions={{ ...getDefaultScreenOptions(), animation: 'fade' }}>
    <OnboardingStack.Screen
      name="Welcome"
      component={WelcomeScreen}
      options={{ headerShown: false }}
    />
    <OnboardingStack.Screen
      name="Permissions"
      component={PermissionsScreen}
      options={{ headerShown: false }}
    />
    <OnboardingStack.Screen
      name="DevicePairing"
      component={DevicePairingScreen}
      options={{ headerShown: false }}
    />
    <OnboardingStack.Screen
      name="Complete"
      component={CompleteScreen}
      options={{ headerShown: false }}
    />
  </OnboardingStack.Navigator>
);
