import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../types/navigation';
import { getDefaultScreenOptions } from '../utils/navigationConfig';
import { LoginScreen, RegisterScreen, ForgotPasswordScreen } from '@features/auth/screens';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => (
  <AuthStack.Navigator id="AuthStack" screenOptions={getDefaultScreenOptions()}>
    <AuthStack.Screen
      name="Login"
      component={LoginScreen}
      options={{ title: 'Sign In', headerShown: false }}
    />
    <AuthStack.Screen
      name="Register"
      component={RegisterScreen}
      options={{ title: 'Create Account', headerShown: false }}
    />
    <AuthStack.Screen
      name="ForgotPassword"
      component={ForgotPasswordScreen}
      options={{ title: 'Reset Password', headerShown: false }}
    />
  </AuthStack.Navigator>
);
