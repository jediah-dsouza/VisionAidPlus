import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as ReduxProvider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { bleSlice } from '../../../src/app/store/slices/bleSlice';
import { aiSlice } from '../../../src/app/store/slices/aiSlice';
import { ttsSlice } from '../../../src/app/store/slices/ttsSlice';
import { settingsSlice } from '../../../src/app/store/slices/settingsSlice';
import { emergencySlice } from '../../../src/app/store/slices/emergencySlice';
import { navigationSlice } from '../../../src/app/store/slices/navigationSlice';
import { liveNavigationSlice } from '../../../src/app/store/slices/liveNavigationSlice';
import { alertsSlice } from '../../../src/app/store/slices/alertsSlice';
import { voiceSlice } from '../../../src/app/store/slices/voiceSlice';
import { cameraSlice } from '../../../src/app/store/slices/cameraSlice';
import { analyticsSlice } from '../../../src/app/store/slices/analyticsSlice';

export { NavigationContainer };

type TestRendererInstance = ReturnType<typeof ReactTestRenderer.create>;

interface RenderNavigatorOptions {
  preloadedState?: Record<string, unknown>;
}

export function renderNavigator(
  navigator: React.ReactElement,
  options: RenderNavigatorOptions = {},
): { root: TestRendererInstance; unmount: () => void } {
  const store = configureStore({
    reducer: {
      auth: (state = { isAuthenticated: false, isLoading: false, user: null, token: null, error: null }) => state,
      onboarding: (state = { isComplete: false, currentStep: 0, permissions: {}, devicePaired: false }) => state,
      ble: bleSlice.reducer,
      ai: aiSlice.reducer,
      tts: ttsSlice.reducer,
      settings: settingsSlice.reducer,
      emergency: emergencySlice.reducer,
      navigation: navigationSlice.reducer,
      liveNavigation: liveNavigationSlice.reducer,
      alerts: alertsSlice.reducer,
      voice: voiceSlice.reducer,
      camera: cameraSlice.reducer,
      analytics: analyticsSlice.reducer,
    } as any,
    preloadedState: options.preloadedState as any,
  });

  const root = ReactTestRenderer.create(
    <ReduxProvider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>{navigator}</NavigationContainer>
      </SafeAreaProvider>
    </ReduxProvider>,
  );

  return {
    root,
    unmount: () => root.unmount(),
  };
}

export function createMockNavigation() {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
    isFocused: jest.fn(() => true),
    addListener: jest.fn(() => jest.fn()),
  };
}
