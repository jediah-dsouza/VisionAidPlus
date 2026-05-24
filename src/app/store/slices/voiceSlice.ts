import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  SpeechMessage,
  SpeechQueueItem,
  VoiceLifecycleState,
  VoicePriority,
  VoiceCategory,
  VoiceMetrics,
  VoiceCommand,
  WaveformFrame,
  PushToTalkState,
} from '@core/voice-assistant/types';

interface VoiceState {
  lifecycle: VoiceLifecycleState;
  current: SpeechQueueItem | null;
  queue: SpeechQueueItem[];
  queueDepth: number;
  metrics: VoiceMetrics | null;
  lastCommand: VoiceCommand | null;
  commandHistory: VoiceCommand[];
  waveformFrames: WaveformFrame[];
  pttState: PushToTalkState | null;
  isMuted: boolean;
  quietHours: boolean;
  error: string | null;
}

const emptyPttState: PushToTalkState = {
  active: false,
  startedAt: null,
  durationMs: 0,
  buffer: null,
  level: 0,
};

const initialState: VoiceState = {
  lifecycle: 'idle',
  current: null,
  queue: [],
  queueDepth: 0,
  metrics: null,
  lastCommand: null,
  commandHistory: [],
  waveformFrames: [],
  pttState: emptyPttState,
  isMuted: false,
  quietHours: false,
  error: null,
};

export const voiceSlice = createSlice({
  name: 'voice',
  initialState,
  reducers: {
    speechStarted: (state, action: PayloadAction<{ item: SpeechQueueItem }>) => {
      state.lifecycle = 'speaking';
      state.current = action.payload.item;
      state.error = null;
    },
    speechCompleted: (state, action: PayloadAction<{ item: SpeechQueueItem }>) => {
      state.lifecycle = 'idle';
      state.current = null;
    },
    speechQueued: (state, action: PayloadAction<{ item: SpeechQueueItem }>) => {
      state.queue = [...state.queue, action.payload.item];
      state.queueDepth = state.queue.length;
    },
    speechDequeued: (state, action: PayloadAction<{ item: SpeechQueueItem }>) => {
      state.queue = state.queue.filter(i => i.id !== action.payload.item.id);
      state.queueDepth = state.queue.length;
    },
    speechInterrupted: (state, action: PayloadAction<{
      interruptedId: string; incomingId: string; incomingPriority: VoicePriority;
    }>) => {
      state.lifecycle = 'interrupted';
    },
    speechPaused: (state) => {
      state.lifecycle = 'paused';
    },
    speechResumed: (state) => {
      state.lifecycle = 'speaking';
    },
    speechFailed: (state, action: PayloadAction<{ item: SpeechQueueItem }>) => {
      state.error = `Speech failed: ${action.payload.item.id}`;
    },
    speechCancelled: (state) => {
      state.lifecycle = 'idle';
      state.current = null;
    },
    queueCleared: (state) => {
      state.queue = [];
      state.queueDepth = 0;
    },
    metricsUpdated: (state, action: PayloadAction<{ metrics: VoiceMetrics }>) => {
      state.metrics = action.payload.metrics;
      state.queueDepth = action.payload.metrics.currentQueueDepth;
    },
    commandReceived: (state, action: PayloadAction<{ command: VoiceCommand }>) => {
      state.lastCommand = action.payload.command;
      state.commandHistory = [action.payload.command, ...state.commandHistory].slice(0, 100);
    },
    commandExecuted: (state, action: PayloadAction<{ command: VoiceCommand }>) => {
      const idx = state.commandHistory.findIndex(c => c.id === action.payload.command.id);
      if (idx >= 0) state.commandHistory[idx] = action.payload.command;
    },
    waveformUpdated: (state, action: PayloadAction<{
      latestAmplitude: number; peak: number; frameCount: number;
    }>) => {
      state.waveformFrames = [
        ...state.waveformFrames.slice(-59),
        { amplitude: action.payload.latestAmplitude, frequency: 0, timestamp: Date.now() },
      ];
    },
    pttActivated: (state, action: PayloadAction<{ startedAt: number }>) => {
      state.pttState = { ...emptyPttState, active: true, startedAt: action.payload.startedAt };
    },
    pttDeactivated: (state, action: PayloadAction<{ durationMs: number; level: number }>) => {
      state.pttState = {
        ...emptyPttState, active: false,
        durationMs: action.payload.durationMs,
        level: action.payload.level,
      };
    },
    setMuted: (state, action: PayloadAction<boolean>) => {
      state.isMuted = action.payload;
    },
    setQuietHours: (state, action: PayloadAction<boolean>) => {
      state.quietHours = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    reset: () => initialState,
  },
});

export const voiceActions = voiceSlice.actions;
export default voiceSlice.reducer;
