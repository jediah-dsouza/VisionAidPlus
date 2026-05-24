import type {
  SpeechMessage,
  SpeechQueueItem,
  VoiceLifecycleState,
  VoiceCommand,
  WaveformFrame,
  VoiceMetrics,
  PushToTalkState,
} from '@core/voice-assistant/types';

export interface VoiceAssistantViewState {
  lifecycle: VoiceLifecycleState;
  currentSpeech: SpeechQueueItem | null;
  queueDepth: number;
  queue: SpeechQueueItem[];
  isSpeaking: boolean;
  isPaused: boolean;
  isMuted: boolean;
  quietHours: boolean;
  metrics: VoiceMetrics | null;
  lastCommand: VoiceCommand | null;
  waveformFrames: WaveformFrame[];
  pttActive: boolean;
  pttLevel: number;
  error: string | null;
}

export interface UseVoiceAssistantResult {
  viewState: VoiceAssistantViewState;
  speak: (text: string, priority?: string, category?: string) => boolean;
  pause: () => void;
  resume: () => void;
  cancelCurrent: () => void;
  cancelAll: () => void;
  clearQueue: () => void;
  setMuted: (muted: boolean) => void;
  setQuietHours: (enabled: boolean) => void;
  activatePTT: () => void;
  deactivatePTT: () => PushToTalkState;
  getCommandHistory: () => VoiceCommand[];
  getMetrics: () => VoiceMetrics;
}
