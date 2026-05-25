import { useState, useEffect, useCallback, useRef } from 'react';
import { eventBus } from '@core/events/EventBus';
import { AI_EVENTS } from '@core/events/AI_EVENTS';
import { CameraLifecycleManager } from '@core/camera/CameraLifecycleManager';
import { FramePipelineCoordinator } from '@core/camera/FramePipelineCoordinator';
import { FrameThrottleController } from '@core/camera/FrameThrottleController';
import { FrameMetricsCollector } from '@core/camera/FrameMetricsCollector';
import { DetectionSessionManager } from '@core/camera/DetectionSessionManager';
import { logger } from '@core/debug';
import type { CameraSessionState } from '@core/camera/types';
import type { AIViewState, UseCameraResult } from '../types';

const initialState: AIViewState = {
  sessionState: 'idle',
  detections: [],
  frameRate: 0,
  error: null,
  overlayVisible: true,
};

export const useCamera = (): UseCameraResult => {
  const mountedRef = useRef(true);
  const [viewState, setViewState] = useState<AIViewState>(initialState);

  const lifecycleRef = useRef(new CameraLifecycleManager());
  const throttleRef = useRef(new FrameThrottleController(30));
  const metricsRef = useRef(new FrameMetricsCollector());
  const pipelineRef = useRef(new FramePipelineCoordinator({}, throttleRef.current, metricsRef.current));
  const sessionRef = useRef(new DetectionSessionManager());

  useEffect(() => {
    mountedRef.current = true;

    const unsub1 = eventBus.subscribe(AI_EVENTS.SESSION_STATE_CHANGE, (payload: unknown) => {
      const { state } = payload as { state: CameraSessionState };
      if (mountedRef.current) setViewState(prev => ({ ...prev, sessionState: state }));
    });

    const unsub2 = eventBus.subscribe(AI_EVENTS.METRICS_UPDATE, (payload: unknown) => {
      const { metrics } = payload as { metrics: { currentFps: number } };
      if (mountedRef.current) setViewState(prev => ({ ...prev, frameRate: metrics.currentFps }));
    });

    const unsub3 = eventBus.subscribe(AI_EVENTS.PIPELINE_ERROR, (payload: unknown) => {
      const { message } = payload as { message: string };
      if (mountedRef.current) setViewState(prev => ({ ...prev, error: message }));
    });

    const lifecycle = lifecycleRef.current;
    const throttle = throttleRef.current;
    const frameMetrics = metricsRef.current;
    const pipeline = pipelineRef.current;
    const session = sessionRef.current;

    return () => {
      mountedRef.current = false;
      unsub1();
      unsub2();
      unsub3();
      lifecycle.destroy?.();
      throttle.destroy?.();
      frameMetrics.destroy?.();
      pipeline.destroy?.();
      session.destroy?.();
    };
  }, []);

  const startCamera = useCallback(() => {
    lifecycleRef.current.start();
    sessionRef.current.start();
  }, []);

  const stopCamera = useCallback(() => {
    lifecycleRef.current.stop();
    sessionRef.current.stop();
  }, []);

  const suspendCamera = useCallback(() => {
    lifecycleRef.current.suspend();
  }, []);

  const resumeCamera = useCallback(() => {
    lifecycleRef.current.resume();
  }, []);

  const toggleOverlay = useCallback(() => {
    setViewState(prev => ({ ...prev, overlayVisible: !prev.overlayVisible }));
  }, []);

  return { viewState, startCamera, stopCamera, suspendCamera, resumeCamera, toggleOverlay };
};
