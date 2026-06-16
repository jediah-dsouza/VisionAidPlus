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
  <View
    style={styles.container}
    accessibilityLabel="Emergency contacts. This feature is coming soon.">
    <Text style={styles.title}>Emergency Contacts</Text>
    <Text style={styles.description}>
      Your emergency contacts will appear here. You can add trusted people who will be notified in
      case of an emergency. This feature is coming soon.
    </Text>
  </View>
);

const EmergencyHistoryScreen = () => (
  <View
    style={styles.container}
    accessibilityLabel="Emergency history. This feature is coming soon.">
    <Text style={styles.title}>Emergency History</Text>
    <Text style={styles.description}>
      Your emergency history will appear here. Past alerts and responses will be logged for your
      review. This feature is coming soon.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticTokens.colors.background.default,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing[8],
    gap: tokens.spacing[4],
  },
  title: {
    fontSize: semanticTokens.fontSize['2xl'],
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
    textAlign: 'center',
    marginBottom: tokens.spacing[2],
  },
  description: {
    fontSize: semanticTokens.fontSize.lg,
    color: semanticTokens.colors.foreground.muted,
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 320,
  },
});
