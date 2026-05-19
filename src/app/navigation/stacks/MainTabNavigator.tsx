import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type {
  MainTabParamList,
  HomeStackParamList,
  NavigationStackParamList,
  AlertsStackParamList,
  DeviceStackParamList,
  SettingsStackParamList,
} from '../types/navigation';
import { semanticTokens } from '@shared/design-system/theme';
import { tokens } from '@shared/design-system/theme/tokens';

import { HomeScreen } from '@features/home/screens';
import { NavigationScreen } from '@features/navigation/screens';
import { AlertsScreen } from '@features/alerts/screens';
import { DeviceScreen } from '@features/device/screens';
import { SettingsScreen } from '@features/settings/screens';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const NavigationStack = createNativeStackNavigator<NavigationStackParamList>();
const AlertsStack = createNativeStackNavigator<AlertsStackParamList>();
const DeviceStack = createNativeStackNavigator<DeviceStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const TabIcon: React.FC<{ icon: string; focused: boolean; label: string }> = ({
  icon,
  focused,
  label,
}) => (
  <View style={styles.tabIconContainer}>
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
  </View>
);

const HomeStackNavigator = () => (
  <HomeStack.Navigator id="HomeStack" screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="Home" component={HomeScreen} />
  </HomeStack.Navigator>
);

const NavigationStackNavigator = () => (
  <NavigationStack.Navigator id="NavigationStack" screenOptions={{ headerShown: false }}>
    <NavigationStack.Screen name="Navigation" component={NavigationScreen} />
  </NavigationStack.Navigator>
);

const AlertsStackNavigator = () => (
  <AlertsStack.Navigator id="AlertsStack" screenOptions={{ headerShown: false }}>
    <AlertsStack.Screen name="Alerts" component={AlertsScreen} />
  </AlertsStack.Navigator>
);

const DeviceStackNavigator = () => (
  <DeviceStack.Navigator id="DeviceStack" screenOptions={{ headerShown: false }}>
    <DeviceStack.Screen name="Device" component={DeviceScreen} />
  </DeviceStack.Navigator>
);

const SettingsStackNavigator = () => (
  <SettingsStack.Navigator id="SettingsStack" screenOptions={{ headerShown: false }}>
    <SettingsStack.Screen name="Settings" component={SettingsScreen} />
  </SettingsStack.Navigator>
);

const HomeIcon = ({ focused }: { focused: boolean }) => (
  <TabIcon icon="🏠" focused={focused} label="Home" />
);
const NavigationIcon = ({ focused }: { focused: boolean }) => (
  <TabIcon icon="🧭" focused={focused} label="Navigate" />
);
const AlertsIcon = ({ focused }: { focused: boolean }) => (
  <TabIcon icon="🔔" focused={focused} label="Alerts" />
);
const DeviceIcon = ({ focused }: { focused: boolean }) => (
  <TabIcon icon="📱" focused={focused} label="Device" />
);
const SettingsIcon = ({ focused }: { focused: boolean }) => (
  <TabIcon icon="⚙️" focused={focused} label="Settings" />
);

export const MainTabNavigator: React.FC = () => (
  <Tab.Navigator
    id="MainTabs"
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: semanticTokens.colors.surface.default,
        borderTopColor: semanticTokens.colors.border.default,
        height: 80,
        paddingBottom: tokens.spacing.md,
        paddingTop: tokens.spacing.sm,
      },
      tabBarActiveTintColor: semanticTokens.colors.primary.default,
      tabBarInactiveTintColor: semanticTokens.colors.foreground.subtle,
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: tokens.fontWeight.medium,
      },
    }}>
    <Tab.Screen
      name="HomeTab"
      component={HomeStackNavigator}
      options={{
        tabBarLabel: 'Home',
        tabBarIcon: HomeIcon,
      }}
    />
    <Tab.Screen
      name="NavigationTab"
      component={NavigationStackNavigator}
      options={{
        tabBarLabel: 'Navigate',
        tabBarIcon: NavigationIcon,
      }}
    />
    <Tab.Screen
      name="AlertsTab"
      component={AlertsStackNavigator}
      options={{
        tabBarLabel: 'Alerts',
        tabBarIcon: AlertsIcon,
      }}
    />
    <Tab.Screen
      name="DeviceTab"
      component={DeviceStackNavigator}
      options={{
        tabBarLabel: 'Device',
        tabBarIcon: DeviceIcon,
      }}
    />
    <Tab.Screen
      name="SettingsTab"
      component={SettingsStackNavigator}
      options={{
        tabBarLabel: 'Settings',
        tabBarIcon: SettingsIcon,
      }}
    />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: tokens.spacing[1],
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 10,
    color: semanticTokens.colors.foreground.subtle,
  },
  tabLabelFocused: {
    color: semanticTokens.colors.primary.default,
    fontWeight: tokens.fontWeight.medium,
  },
});
