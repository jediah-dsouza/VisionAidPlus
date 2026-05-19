import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { bleSlice } from './slices/bleSlice';
import { aiSlice } from './slices/aiSlice';
import { ttsSlice } from './slices/ttsSlice';
import { settingsSlice } from './slices/settingsSlice';
import { emergencySlice } from './slices/emergencySlice';
import { navigationSlice } from './slices/navigationSlice';
import { alertsSlice } from './slices/alertsSlice';
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
    alerts: alertsSlice.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
