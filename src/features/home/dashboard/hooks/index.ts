import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@app/store';
import { eventBus, EVENTS } from '@core/events/EventBus';
import { accessibilityEngine } from '@core/accessibility';
import { aiActions } from '@app/store/slices/aiSlice';
import { bleActions } from '@app/store/slices/bleSlice';
import { DEFAULT_DASHBOARD_CONFIG, DashboardConfig, DashboardState } from '../types';

type SubscriptionCleanup = () => void;

interface UseDashboardOptions {
  config?: Partial<DashboardConfig>;
  enableMiddleware?: boolean;
}

interface UseDashboardReturn {
  state: DashboardState;
  isLoading: boolean;
  error: string | null;
  subscribe: (event: string, handler: (payload: unknown) => void) => SubscriptionCleanup;
  refresh: () => void;
  reset: () => void;
}

export const useDashboard = (options: UseDashboardOptions = {}): UseDashboardReturn => {
  const { config = {}, enableMiddleware = true } = options;

  const dispatch = useAppDispatch();
  const subscriptionsRef = useRef<Map<string, SubscriptionCleanup>>(new Map());

  const bleState = useAppSelector(state => state.ble);
  const aiState = useAppSelector(state => state.ai);
  const emergencyState = useAppSelector(state => state.emergency);

  const state = useMemo<DashboardState>(
    () => ({
      ble: {
        status: bleState.status,
        deviceId: bleState.connectedDeviceId,
        deviceName: null,
        signalStrength: bleState.signalStrength,
        batteryLevel: bleState.batteryLevel,
      },
      ai: {
        status: aiState.status,
        currentObstacle: aiState.currentObstacle,
        detectionCount: aiState.detectionHistory.length,
        lastDetectionTime: aiState.lastDetectionTime,
      },
      emergency: {
        isActive: emergencyState.status !== 'idle',
        countdownRemaining:
          emergencyState.status === 'countdown' ? emergencyState.countdownRemaining : null,
        contactsCount: emergencyState.contacts.length,
      },
      isInitialized: true,
      lastUpdateTime: new Date().toISOString(),
    }),
    [bleState, aiState, emergencyState],
  );

  const isLoading = useMemo(
    () =>
      bleState.status === 'scanning' ||
      bleState.status === 'connecting' ||
      aiState.status === 'processing' ||
      emergencyState.status === 'countdown',
    [bleState, aiState, emergencyState],
  );

  const error = useMemo(() => bleState.error ?? aiState.error ?? null, [bleState, aiState]);

  const subscribe = useCallback(
    (event: string, handler: (payload: unknown) => void): SubscriptionCleanup => {
      const unsubscribe = eventBus.subscribe(event, handler);
      subscriptionsRef.current.set(event, unsubscribe);
      return unsubscribe;
    },
    [],
  );

  const refresh = useCallback(() => {
    accessibilityEngine.announce('Dashboard refreshed', 'normal');
  }, []);

  const reset = useCallback(() => {
    dispatch(aiActions.reset());
    dispatch(bleActions.reset());
  }, [dispatch]);

  useEffect(() => {
    if (enableMiddleware) {
      const initHandler = () => {
        console.log('Dashboard event middleware initialized');
      };

      const obstacleHandler = (payload: unknown) => {
        console.log('Obstacle detected in dashboard', payload);
      };

      const sub1 = eventBus.subscribe(EVENTS.CAMERA_INITIALIZED, initHandler, 'high');
      const sub2 = eventBus.subscribe(EVENTS.AI_OBSTACLE_DETECTED, obstacleHandler, 'normal');

      return () => {
        sub1();
        sub2();
      };
    }
  }, [enableMiddleware]);

  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
      subscriptionsRef.current.clear();
    };
  }, []);

  return { state, isLoading, error, subscribe, refresh, reset };
};

export const useDashboardWidget = (
  widgetId: string,
  options: { autoRefresh?: boolean; refreshInterval?: number } = {},
) => {
  const { autoRefresh = false, refreshInterval = 1000 } = options;
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleUpdate = useCallback(() => {
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(handleUpdate, refreshInterval);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [autoRefresh, refreshInterval, handleUpdate]);

  return {
    widgetId,
    lastUpdate,
    isStale: Date.now() - lastUpdate.getTime() > refreshInterval * 5,
  };
};

export const useObstacleHistory = (maxItems: number = 10) => {
  const { detectionHistory, currentObstacle } = useAppSelector(state => state.ai);

  return useMemo(
    () => ({
      history: detectionHistory.slice(0, maxItems),
      latest: currentObstacle,
      total: detectionHistory.length,
    }),
    [detectionHistory, currentObstacle, maxItems],
  );
};

export const useDeviceStatus = () => {
  const { status, connectedDeviceId, signalStrength, batteryLevel, error } = useAppSelector(
    state => state.ble,
  );

  return useMemo(
    () => ({
      isConnected: status === 'connected',
      isConnecting: status === 'connecting' || status === 'scanning',
      isDisconnected: status === 'disconnected' || status === 'idle',
      deviceId: connectedDeviceId,
      signalStrength,
      batteryLevel,
      error,
      status,
    }),
    [status, connectedDeviceId, signalStrength, batteryLevel, error],
  );
};

export const useAIStatus = () => {
  const { status, currentObstacle, detectionHistory, error } = useAppSelector(state => state.ai);

  return useMemo(
    () => ({
      isActive: status === 'detecting' || status === 'processing',
      isWarning: status === 'warning' || status === 'danger',
      currentObstacle,
      detectionCount: detectionHistory.length,
      error,
      status,
    }),
    [status, currentObstacle, detectionHistory, error],
  );
};
