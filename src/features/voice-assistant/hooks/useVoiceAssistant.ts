import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@app/store';
import { voiceActions } from '@app/store/slices/voiceSlice';
import { SpeechLifecycleManager } from '@core/voice-assistant/SpeechLifecycleManager';
import { SpeechQueueManager } from '@core/voice-assistant/SpeechQueueManager';
import { SpeechPriorityEngine } from '@core/voice-assistant/SpeechPriorityEngine';
import { SpeechDeduplicationEngine } from '@core/voice-assistant/SpeechDeduplicationEngine';
import { InterruptionCoordinator } from '@core/voice-assistant/InterruptionCoordinator';
import { AccessibilityPacingController } from '@core/voice-assistant/AccessibilityPacingController';
import { TTSIntegrationLayer } from '@core/voice-assistant/TTSIntegrationLayer';
import { CommandHistoryRegistry } from '@core/voice-assistant/CommandHistoryRegistry';
import { PushToTalkLayer } from '@core/voice-assistant/PushToTalkLayer';
import { WaveformPipeline } from '@core/voice-assistant/WaveformPipeline';
import { HapticSynchronizer } from '@core/voice-assistant/HapticSynchronizer';
import { VoiceMetricsCollector } from '@core/voice-assistant/VoiceMetricsCollector';
import { VOICE_EVENTS, subscribeToSpeechLifecycle } from '@core/voice-assistant/VoiceEventBus';
import { logger } from '@core/debug';
import type { SpeechMessage, VoiceCommand, PushToTalkState, VoiceMetrics, VoicePriority } from '@core/voice-assistant/types';
import type { VoiceAssistantViewState, UseVoiceAssistantResult } from '../types';

const initialState: VoiceAssistantViewState = {
  lifecycle: 'idle',
  currentSpeech: null,
  queueDepth: 0,
  queue: [],
  isSpeaking: false,
  isPaused: false,
  isMuted: false,
  quietHours: false,
  metrics: null,
  lastCommand: null,
  waveformFrames: [],
  pttActive: false,
  pttLevel: 0,
  error: null,
};

export const useVoiceAssistant = (): UseVoiceAssistantResult => {
  const dispatch = useAppDispatch();
  const voiceState = useAppSelector(state => state.voice);
  const mountedRef = useRef(true);
  const [viewState, setViewState] = useState<VoiceAssistantViewState>(initialState);

  const config = { maxQueueSize: 100, staleMessageTtlMs: 30000 };

  const priorityEngineRef = useRef(new SpeechPriorityEngine(config));
  const queueRef = useRef(new SpeechQueueManager(config, priorityEngineRef.current));
  const dedupRef = useRef(new SpeechDeduplicationEngine(config));
  const interruptionRef = useRef(new InterruptionCoordinator(config, queueRef.current));
  const pacingRef = useRef(new AccessibilityPacingController(config));
  const lifecycleRef = useRef(new SpeechLifecycleManager(
    config, queueRef.current, dedupRef.current, interruptionRef.current, pacingRef.current,
  ));
  const ttsBridgeRef = useRef(new TTSIntegrationLayer(config));
  const historyRef = useRef(new CommandHistoryRegistry(config));
  const pttRef = useRef(new PushToTalkLayer(config));
  const waveformRef = useRef(new WaveformPipeline(config));
  const hapticRef = useRef(new HapticSynchronizer(config));
  const metricsRef = useRef(new VoiceMetricsCollector());

  useEffect(() => {
    mountedRef.current = true;
    ttsBridgeRef.current.initialize();
    metricsRef.current.startAutoReporting(60000);

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current) return () => {};

    const unsub = subscribeToSpeechLifecycle(
      (payload: unknown) => {
        const { item } = payload as { item: any };
        if (mountedRef.current) dispatch(voiceActions.speechQueued({ item }));
      },
      (payload: unknown) => {
        const { item } = payload as { item: any };
        if (mountedRef.current) {
          dispatch(voiceActions.speechStarted({ item }));
          ttsBridgeRef.current.deliver(item);
          hapticRef.current.syncWithSpeech(item);
          waveformRef.current.startSegment(item.id);
        }
      },
      (payload: unknown) => {
        const { item } = payload as { item: any };
        if (mountedRef.current) {
          dispatch(voiceActions.speechCompleted({ item }));
          waveformRef.current.endSegment();
          metricsRef.current.updateFrom(lifecycleRef.current.getMetrics());
        }
      },
      (payload: unknown) => {
        const { item } = payload as { item: any };
        if (mountedRef.current) dispatch(voiceActions.speechFailed({ item }));
      },
      (payload: unknown) => {
        if (mountedRef.current) {
          const raw = payload as { interruptedId: string; incomingId: string; incomingPriority: string };
          const p = { interruptedId: raw.interruptedId, incomingId: raw.incomingId, incomingPriority: raw.incomingPriority as VoicePriority };
          dispatch(voiceActions.speechInterrupted(p));
        }
      },
    );

    return () => { try { unsub(); } catch {} };
  }, [dispatch]);

  useEffect(() => {
    if (!mountedRef.current) return;
    const metrics = lifecycleRef.current.getMetrics();
    const ptt = pttRef.current.getState();
    const lastCmd = historyRef.current.getLastCommand();

    setViewState({
      lifecycle: voiceState.lifecycle,
      currentSpeech: voiceState.current,
      queueDepth: voiceState.queueDepth,
      queue: voiceState.queue,
      isSpeaking: voiceState.lifecycle === 'speaking',
      isPaused: voiceState.lifecycle === 'paused',
      isMuted: voiceState.isMuted,
      quietHours: voiceState.quietHours,
      metrics: voiceState.metrics,
      lastCommand: voiceState.lastCommand,
      waveformFrames: voiceState.waveformFrames,
      pttActive: ptt.active,
      pttLevel: ptt.level,
      error: voiceState.error,
    });
  }, [voiceState]);

  const speak = useCallback((
    text: string,
    priority: string = 'normal',
    category: string = 'system',
  ): boolean => {
    if (!mountedRef.current) return false;

    if (voiceState.isMuted) return false;

    const message: SpeechMessage = {
      id: `speech_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text,
      priority: priority as any,
      category: category as any,
      source: 'tts',
      timestamp: Date.now(),
      ttlMs: 30000,
      expiresAt: Date.now() + 30000,
      spoken: false,
      interrupted: false,
      retryCount: 0,
      maxRetries: 3,
    };

    const result = lifecycleRef.current.speak(message);
    if (!result) {
      queueRef.current.recordDuplicateSuppressed();
    }
    return result;
  }, [voiceState.isMuted]);

  const pause = useCallback(() => {
    lifecycleRef.current.pause();
    dispatch(voiceActions.speechPaused());
  }, [dispatch]);

  const resume = useCallback(() => {
    lifecycleRef.current.resume();
    dispatch(voiceActions.speechResumed());
  }, [dispatch]);

  const cancelCurrent = useCallback(() => {
    lifecycleRef.current.cancelCurrent();
    dispatch(voiceActions.speechCancelled());
  }, [dispatch]);

  const cancelAll = useCallback(() => {
    lifecycleRef.current.cancelAll();
    dispatch(voiceActions.queueCleared());
    dispatch(voiceActions.speechCancelled());
  }, [dispatch]);

  const clearQueue = useCallback(() => {
    lifecycleRef.current.getQueueManager().clear();
    dispatch(voiceActions.queueCleared());
  }, [dispatch]);

  const setMuted = useCallback((muted: boolean) => {
    dispatch(voiceActions.setMuted(muted));
  }, [dispatch]);

  const setQuietHours = useCallback((enabled: boolean) => {
    dispatch(voiceActions.setQuietHours(enabled));
  }, [dispatch]);

  const activatePTT = useCallback(() => {
    pttRef.current.activate();
  }, []);

  const deactivatePTT = useCallback((): PushToTalkState => {
    return pttRef.current.deactivate();
  }, []);

  const getCommandHistory = useCallback((): VoiceCommand[] => {
    return historyRef.current.getHistory(50);
  }, []);

  const getMetrics = useCallback((): VoiceMetrics => {
    return lifecycleRef.current.getMetrics();
  }, []);

  return {
    viewState,
    speak,
    pause,
    resume,
    cancelCurrent,
    cancelAll,
    clearQueue,
    setMuted,
    setQuietHours,
    activatePTT,
    deactivatePTT,
    getCommandHistory,
    getMetrics,
  };
};
