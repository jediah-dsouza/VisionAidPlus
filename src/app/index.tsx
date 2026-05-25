import React, { useEffect } from 'react';
import { StatusBar, LogBox, StyleSheet, AppState } from 'react-native';
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
import { ErrorBoundary } from '../shared/components/ErrorBoundary';

// Initialize core systems — imports guarantee bundling of critical modules
import { dashboardEventMiddleware } from '@features/home/dashboard/middleware';
import { accessibilityEngine } from '@core/accessibility';
import { bleManager } from '@core/ble';
import { emergencyManager } from '@core/emergency';
import { navigationManager } from '@core/live-navigation';
import { analyticsEventBridge, analyticsBatchProcessor, analyticsEventPipeline } from '@core/analytics';
import { eventBus } from '@core/events/EventBus';
import { errorHandler } from '@core/error/ErrorHandler';
import { networkMonitor } from '@core/network/NetworkMonitor';

// Initialize AccessibilityEngine in ALL builds (critical for visually impaired users)
accessibilityEngine.initialize();
logger.debug('[App] AccessibilityEngine initialized');

if (__DEV__) {
  dashboardEventMiddleware.initialize();
  logger.debug('[App] Dashboard event middleware initialized');
}

// Initialize Emergency Manager (always - critical safety subsystem)
emergencyManager.initialize();
logger.debug('[App] EmergencyManager initialized');

// Initialize BLE Manager
bleManager.initialize({
  requestMTU: env.BLE_REQUEST_MTU,
  scanDuration: env.BLE_SCAN_TIMEOUT,
  backgroundConfig: {
    enabled: env.BLE_BACKGROUND_ENABLED,
    scanOnBackground: false,
    keepConnection: env.BLE_KEEP_CONNECTION_IN_BACKGROUND,
    subscribeOnForeground: false,
  },
});
logger.debug('[App] BLEManager initialized');

// Initialize NavigationManager
navigationManager.initialize();
logger.debug('[App] NavigationManager initialized');

// Initialize NetworkMonitor for offline awareness
networkMonitor.initialize();
logger.debug('[App] NetworkMonitor initialized');

// Initialize Analytics pipeline
analyticsEventBridge.onAnalyticsEvent = event => {
  analyticsBatchProcessor.enqueue(event);
};
analyticsBatchProcessor.onBatchReady = batch => {
  batch.forEach(event => analyticsEventPipeline.ingest(event));
};
analyticsEventBridge.connect(eventBus);
logger.debug('[App] Analytics pipeline initialized');

if (__DEV__) {
  const providerStoreId = (store as any).__REDUX_STORE_ID__;
  const globalStore = (globalThis as any).__VISIONAID_STORE__;
  console.log(`[StoreDebug] Store identity — ID: ${providerStoreId}, matches global: ${store === globalStore}`);
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

  useEffect(() => {
    navigationGuard.setNavigationRef(navRef.current);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: string) => {
      if (nextState === 'active') {
        navigationManager.handleForeground();
      } else if (nextState === 'background' || nextState === 'inactive') {
        navigationManager.handleBackground();
      }
    });
    return () => subscription.remove();
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

  useEffect(() => {
    return () => {
      dashboardEventMiddleware.destroy();
      emergencyManager.destroy();
      bleManager.destroy();
      navigationManager.destroy();
      networkMonitor.destroy();
      logger.debug('[App] Core systems destroyed on unmount');
    };
  }, []);

  if (__DEV__) {
    const appStoreId = (store as any).__REDUX_STORE_ID__;
    const appGlobalStore = (globalThis as any).__VISIONAID_STORE__;
    console.log(`[StoreDebug] App render — ID: ${appStoreId}, matches global: ${store === appGlobalStore}`);
  }

  return (
    <ErrorBoundary name="AppRoot">
      <GestureHandlerRootView style={styles.root}>
        <ReduxProvider store={store}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <SafeAreaProvider>
                <StatusBar
                  barStyle="light-content"
                  backgroundColor={env.ENVIRONMENT === 'production' ? '#0F172A' : '#1E293B'}
                />
                <ErrorBoundary name="Navigation">
                  <NavigationWrapper />
                </ErrorBoundary>
              </SafeAreaProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </ReduxProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

export default App;
