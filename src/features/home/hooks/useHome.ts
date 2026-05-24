import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAppSelector, useAppDispatch, store } from '@app/store';
import { eventBus, EVENTS } from '@core/events/EventBus';
import { accessibilityEngine } from '@core/accessibility';
import { aiActions } from '@app/store/slices/aiSlice';
import { bleActions } from '@app/store/slices/bleSlice';
import { bleService } from '@core/native/BLEService';
import { aiService } from '@core/native/AIService';

export const useHome = () => {
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // [DIAGNOSTIC] Store identity from hook context (one-time)
  const useHomeStoreId = (store as any).__REDUX_STORE_ID__;
  const useHomeGlobalStore = (globalThis as any).__VISIONAID_STORE__;
  console.log(`[useHome] 🔑 Store ID: ${useHomeStoreId}`);
  console.log(`[useHome]   store === globalThis.__VISIONAID_STORE__: ${store === useHomeGlobalStore}`);

  const dispatch = useAppDispatch();

  const bleState = useAppSelector(state => state.ble);
  const aiState = useAppSelector(state => state.ai);
  const emergencyState = useAppSelector(state => state.emergency);
  const authState = useAppSelector(state => state.auth);

  const summary = useMemo(
    () => ({
      deviceConnected: bleState.connectionState === 'connected',
      deviceReconnecting: bleState.connectionState === 'reconnecting',
      aiActive: aiState.status === 'detecting' || aiState.status === 'processing',
      emergencyActive: emergencyState.status !== 'idle',
      lastObstacle: aiState.currentObstacle,
      detectionCount: aiState.detectionHistory.length,
      hasUser: !!authState.user,
      userName: authState.user?.name ?? 'User',
    }),
    [bleState, aiState, emergencyState, authState],
  );

  useEffect(() => {
    // Only subscribe to EventBus for events NOT already handled by AccessibilityEngine
    // Battery/reconnect announcements are handled by useDeviceBattery/useDeviceReconnection

    const unsubscribeBleConnected = eventBus.subscribe(
      EVENTS.BLE_DEVICE_CONNECTED,
      payload => {
        const device = payload as { deviceName?: string };
        accessibilityEngine.announce(
          `Device connected${device.deviceName ? `: ${device.deviceName}` : ''}`,
          'normal',
        );
      },
      'high',
    );

    const unsubscribeBleDisconnected = eventBus.subscribe(
      EVENTS.BLE_DEVICE_DISCONNECTED,
      () => {
        accessibilityEngine.announce('Device disconnected', 'high');
      },
      'high',
    );

    return () => {
      unsubscribeBleConnected();
      unsubscribeBleDisconnected();
    };
  }, []);

  const handleConnectDevice = useCallback(async () => {
    accessibilityEngine.announce('Starting device scan', 'normal');
    dispatch(bleActions.setStatus('scanning'));
    try {
      await bleService.startScan();
    } catch (error) {
      if (!mountedRef.current) return;
      dispatch(bleActions.setError((error as Error).message));
    }
  }, [dispatch]);

  const handleDisconnectDevice = useCallback(async () => {
    accessibilityEngine.announce('Disconnecting device', 'normal');
    try {
      await bleService.disconnect();
      if (!mountedRef.current) return;
      dispatch(bleActions.setConnected(null));
    } catch (error) {
      if (!mountedRef.current) return;
      dispatch(bleActions.setError((error as Error).message));
    }
  }, [dispatch]);

  const handleStartDetection = useCallback(() => {
    accessibilityEngine.announce('Starting AI detection', 'normal');
    dispatch(aiActions.setStatus('detecting'));
    aiService.initialize();
  }, [dispatch]);

  const handleStopDetection = useCallback(() => {
    accessibilityEngine.announce('Stopping AI detection', 'normal');
    dispatch(aiActions.setStatus('idle'));
    dispatch(aiActions.clearObstacle());
  }, [dispatch]);

  return {
    summary,
    bleStatus: bleState.status,
    aiStatus: aiState.status,
    emergencyStatus: emergencyState.status,
    isLoading:
      bleState.status === 'scanning' ||
      bleState.status === 'connecting' ||
      aiState.status === 'processing',
    error: bleState.lastError ?? aiState.error ?? null,
    handleConnectDevice,
    handleDisconnectDevice,
    handleStartDetection,
    handleStopDetection,
  };
};

export const useHomeDashboard = () => {
  const { summary, isLoading, error, ...handlers } = useHome();
  const detectionHistory = useAppSelector(state => state.ai.detectionHistory);
  const obstacles = useMemo(
    () => [summary.lastObstacle, ...detectionHistory].filter(Boolean),
    [summary.lastObstacle, detectionHistory],
  );

  return {
    summary,
    obstacles,
    isLoading,
    error,
    ...handlers,
  };
};
