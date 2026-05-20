import React from 'react';
import { StatusBar, LogBox, StyleSheet } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store } from './store';
import { AppNavigator } from './navigation/AppNavigator';
import { ThemeProvider, useTheme } from './providers/ThemeProvider';
import { navigationGuard } from './navigation/utils/navigationGuards';
import env from '../env';
import { logger } from '@core/debug';

// DEV ONLY: Initialize dashboard event middleware
import { dashboardEventMiddleware } from '@features/home/dashboard/middleware';
import { accessibilityEngine } from '@core/accessibility';
if (__DEV__) {
  accessibilityEngine.initialize();
  logger.debug('AccessibilityEngine initialized');
  dashboardEventMiddleware.initialize();
  logger.debug('Dashboard event middleware initialized');
}

LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const NavigationWrapper: React.FC = () => {
  const { colors } = useTheme();
  const navRef = React.useRef<NavigationContainerRef<any>>(null);

  React.useEffect(() => {
    navigationGuard.setNavigationRef(navRef.current);
  }, []);

  return (
    <NavigationContainer
      ref={navRef}
      onStateChange={state => navigationGuard.onNavigationStateChange(state)}
      theme={{
        dark: true,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.textPrimary,
          border: colors.border,
          notification: colors.danger,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' as const },
          medium: { fontFamily: 'System', fontWeight: '500' as const },
          bold: { fontFamily: 'System', fontWeight: '700' as const },
          heavy: { fontFamily: 'System', fontWeight: '900' as const },
        },
      }}>
      <AppNavigator />
    </NavigationContainer>
  );
};

const App: React.FC = () => {
  logger.debug('App initializing', { environment: env.ENVIRONMENT });

  return (
    <GestureHandlerRootView style={styles.root}>
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <SafeAreaProvider>
              <StatusBar
                barStyle="light-content"
                backgroundColor={env.ENVIRONMENT === 'production' ? '#0F172A' : '#1E293B'}
              />
              <NavigationWrapper />
            </SafeAreaProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
};

export default App;
