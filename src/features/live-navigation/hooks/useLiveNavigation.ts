import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@app/store';
import { liveNavigationActions } from '@app/store/slices/liveNavigationSlice';
import { navigationManager, radarSyncSystem } from '@core/live-navigation';
import { subscribeToObstacleEvents, subscribeToDangerEvents, subscribeToNavigationLifecycle } from '@core/live-navigation';
import { logger } from '@core/debug';
import type { Obstacle, GuidanceInstruction, EnvironmentMode, DangerLevel } from '@core/live-navigation/types';
import type { LiveNavigationViewState, UseLiveNavigationResult } from '../types';

const initialState: LiveNavigationViewState = {
  status: 'idle',
  environment: 'outdoor',
  dangerLevel: 'none',
  obstacleCount: 0,
  nearestObstacle: null,
  currentInstruction: null,
  radarSnapshot: null,
  isNavigating: false,
  isPaused: false,
  canResume: false,
  sessionId: null,
  sensitivity: 5,
};

export const useLiveNavigation = (): UseLiveNavigationResult => {
  const dispatch = useAppDispatch();
  const liveNavigationState = useAppSelector(state => state.liveNavigation);
  const mountedRef = useRef(true);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const lastSyncRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!navigationManager.isNavigating()) return;

    const obstacleUnsub = subscribeToObstacleEvents(
      () => {
        const now = Date.now();
        if (now - lastSyncRef.current < 50) return;
        lastSyncRef.current = now;
        if (mountedRef.current) {
          const active = navigationManager.getSession();
          const snapshot = radarSyncSystem.getLastSnapshot();
          dispatch(liveNavigationActions.obstaclesUpdated({
            obstacles: snapshot ? [] : [],
            nearest: snapshot?.nearestObstacle ?? null,
          }));
        }
      },
    );

    const dangerUnsub = subscribeToDangerEvents(
      (payload) => {
        const { to } = payload as { to: DangerLevel };
        if (mountedRef.current) {
          dispatch(liveNavigationActions.dangerLevelChanged(to));
        }
      },
    );

    const lifecycleUnsub = subscribeToNavigationLifecycle(
      (payload) => {
        const { session } = payload as { session: any };
        if (mountedRef.current) {
          dispatch(liveNavigationActions.navigationStarted({
            sessionId: session.id,
            startedAt: session.startedAt,
          }));
        }
      },
      (payload) => {
        const { sessionId } = payload as { sessionId: string };
        if (mountedRef.current) {
          dispatch(liveNavigationActions.navigationPaused({ pausedAt: Date.now() }));
        }
      },
      () => {
        if (mountedRef.current) {
          dispatch(liveNavigationActions.navigationResumed());
        }
      },
      () => {
        if (mountedRef.current) {
          dispatch(liveNavigationActions.navigationStopped());
        }
      },
    );

    const syncInterval = setInterval(() => {
      if (!mountedRef.current) return;
      const snapshot = radarSyncSystem.getLastSnapshot();
      if (snapshot) {
        dispatch(liveNavigationActions.radarUpdated({
          sectors: snapshot.sectors.map(s => ({
            angle: s.angle,
            distanceCm: s.distanceCm,
            severity: s.severity,
            obstacleCount: s.obstacleCount,
          })),
          maxDistanceCm: snapshot.maxDistanceCm,
        }));
      }
    }, 100);

    return () => {
      try { obstacleUnsub(); } catch { }
      try { dangerUnsub(); } catch { }
      try { lifecycleUnsub(); } catch { }
      clearInterval(syncInterval);
    };
  }, [dispatch]);

  useEffect(() => {
    if (!mountedRef.current) return;
    setObstacles(liveNavigationState.obstacles);
  }, [liveNavigationState.obstacles]);

  const start = useCallback((): boolean => {
    const result = navigationManager.startNavigation();
    if (result) {
      const session = navigationManager.getSession();
      if (session) {
        dispatch(liveNavigationActions.navigationStarted({
          sessionId: session.id,
          startedAt: session.startedAt,
        }));
      }
    }
    return result;
  }, [dispatch]);

  const stop = useCallback((): void => {
    navigationManager.stopNavigation();
  }, []);

  const pause = useCallback((): boolean => {
    return navigationManager.pauseNavigation();
  }, []);

  const resume = useCallback((): boolean => {
    return navigationManager.resumeNavigation();
  }, []);

  const setEnvironment = useCallback((mode: EnvironmentMode): void => {
    navigationManager.setEnvironment(mode);
  }, []);

  const setSensitivity = useCallback((level: number): void => {
    navigationManager.setSensitivity(level);
  }, []);

  const session = navigationManager.getSession();

  const viewState: LiveNavigationViewState = {
    status: liveNavigationState.status,
    environment: liveNavigationState.environment,
    dangerLevel: liveNavigationState.dangerLevel,
    obstacleCount: liveNavigationState.obstacleCount,
    nearestObstacle: liveNavigationState.nearestObstacle,
    currentInstruction: liveNavigationState.currentInstruction,
    radarSnapshot: radarSyncSystem.getLastSnapshot(),
    isNavigating: liveNavigationState.status === 'navigating',
    isPaused: liveNavigationState.status === 'paused',
    canResume: liveNavigationState.status === 'paused',
    sessionId: liveNavigationState.sessionId,
    sensitivity: liveNavigationState.sensitivity,
  };

  return {
    viewState,
    obstacles,
    start,
    stop,
    pause,
    resume,
    setEnvironment,
    setSensitivity,
  };
};
