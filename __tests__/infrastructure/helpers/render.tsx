import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Provider as ReduxProvider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
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

type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

interface RenderOptions {
  preloadedState?: Record<string, unknown>;
  wrapInProvider?: boolean;
}

function createTestStore(preloadedState?: Record<string, unknown>) {
  return configureStore({
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
    preloadedState: preloadedState as any,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: { ignoredActions: ['persist/PERSIST'] },
      }),
  });
}

type TestRendererInstance = ReturnType<typeof ReactTestRenderer.create>;

export function renderWithProviders(
  component: React.ReactElement,
  options: RenderOptions = {},
): { root: TestRendererInstance; store: ReturnType<typeof createTestStore>; unmount: () => void } {
  const { preloadedState, wrapInProvider = true } = options;

  const store = createTestStore(preloadedState);

  let element: React.ReactElement = component;
  if (wrapInProvider) {
    element = <ReduxProvider store={store}>{component}</ReduxProvider>;
  }

  let root!: TestRendererInstance;
  act(() => {
    root = ReactTestRenderer.create(element);
  });
  return {
    root,
    store,
    unmount: () => {
      act(() => {
        root.unmount();
      });
    },
  };
}

export function render(
  component: React.ReactElement,
): { root: TestRendererInstance; unmount: () => void } {
  let root!: TestRendererInstance;
  act(() => {
    root = ReactTestRenderer.create(component);
  });
  return {
    root,
    unmount: () => {
      act(() => {
        root.unmount();
      });
    },
  };
}
