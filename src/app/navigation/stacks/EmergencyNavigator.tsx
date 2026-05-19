import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { EmergencyStackParamList } from '../types/navigation';
import { getModalScreenOptions } from '../utils/navigationConfig';
import { EmergencyScreen } from '@features/emergency/screens';
import { tokens, semanticTokens } from '@shared/design-system/theme';

const EmergencyStack = createNativeStackNavigator<EmergencyStackParamList>();

export const EmergencyNavigator: React.FC = () => (
  <EmergencyStack.Navigator
    id="EmergencyStack"
    screenOptions={{
      ...getModalScreenOptions(),
      headerShown: true,
      headerTitle: 'Emergency',
      headerTintColor: semanticTokens.colors.danger.default,
      headerStyle: {
        backgroundColor: semanticTokens.colors.background.default,
      },
    }}>
    <EmergencyStack.Screen
      name="EmergencyHome"
      component={EmergencyScreen}
      options={{ title: 'Emergency' }}
    />
    <EmergencyStack.Screen
      name="CaregiverContacts"
      component={CaregiverContactsScreen}
      options={{ title: 'Emergency Contacts' }}
    />
    <EmergencyStack.Screen
      name="EmergencyHistory"
      component={EmergencyHistoryScreen}
      options={{ title: 'History' }}
    />
  </EmergencyStack.Navigator>
);

const CaregiverContactsScreen = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>Manage your emergency contacts</Text>
  </View>
);

const EmergencyHistoryScreen = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>View your emergency history</Text>
  </View>
);

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: semanticTokens.colors.background.default,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing[4],
  },
  placeholderText: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
    textAlign: 'center',
  },
});
