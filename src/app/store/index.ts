import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { bleSlice } from './slices/bleSlice';
import { aiSlice } from './slices/aiSlice';
import { ttsSlice } from './slices/ttsSlice';
import { settingsSlice } from './slices/settingsSlice';
import { emergencySlice } from './slices/emergencySlice';
import { navigationSlice } from './slices/navigationSlice';
import { liveNavigationSlice } from './slices/liveNavigationSlice';
import { alertsSlice } from './slices/alertsSlice';
import { voiceSlice } from './slices/voiceSlice';
import { cameraSlice } from './slices/cameraSlice';
import { authReducer } from '@features/auth';
import { onboardingReducer } from '@features/onboarding';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    onboarding: onboardingReducer,
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
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

const STORE_ID = `store_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`;
(store as any).__REDUX_STORE_ID__ = STORE_ID;
if (__DEV__) {
  (globalThis as any).__VISIONAID_STORE__ = store;
  console.log(`[StoreDebug] 🏪 STORE CREATED — ID: ${STORE_ID}`);
  console.log(`[StoreDebug]   globalThis.__VISIONAID_STORE__ === store:`, (globalThis as any).__VISIONAID_STORE__ === store);
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
