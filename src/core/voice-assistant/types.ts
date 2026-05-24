export type VoicePriority = 'critical' | 'high' | 'normal' | 'low' | 'background';

export type VoiceCategory =
  | 'emergency'
  | 'navigation'
  | 'obstacle'
  | 'system'
  | 'command'
  | 'accessibility'
  | 'notification';

export type VoiceLifecycleState =
  | 'idle'
  | 'preparing'
  | 'queued'
  | 'speaking'
  | 'paused'
  | 'interrupted'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'error';

export type VoiceSource = 'tts' | 'accessibility' | 'user' | 'ai' | 'emergency' | 'navigation';

export interface SpeechMessage {
  id: string;
  text: string;
  priority: VoicePriority;
  category: VoiceCategory;
  source: VoiceSource;
  timestamp: number;
  ttlMs: number;
  expiresAt: number;
  spoken: boolean;
  interrupted: boolean;
  retryCount: number;
  maxRetries: number;
  hapticPattern?: string;
  metadata?: Record<string, unknown>;
}

export interface SpeechQueueItem extends SpeechMessage {
  enqueuedAt: number;
  queuePosition: number;
  priorityScore: number;
  starvationScore: number;
}

export interface VoiceCommand {
  id: string;
  text: string;
  timestamp: number;
  confidence: number;
  source: VoiceSource;
  processed: boolean;
  handler?: string;
  result?: 'success' | 'failed' | 'unknown';
  durationMs?: number;
}

export interface WaveformFrame {
  amplitude: number;
  frequency: number;
  timestamp: number;
}

export interface WaveformSegment {
  id: string;
  frames: WaveformFrame[];
  durationMs: number;
  startTime: number;
  endTime: number;
  peak: number;
  rms: number;
}

export interface PushToTalkState {
  active: boolean;
  startedAt: number | null;
  durationMs: number;
  buffer: Float32Array | null;
  level: number;
}

export interface VoiceMetrics {
  totalMessages: number;
  totalSpoken: number;
  totalInterrupted: number;
  totalFailed: number;
  totalDuplicatesSuppressed: number;
  totalStarvationPrevented: number;
  averageQueueWaitMs: number;
  peakQueueDepth: number;
  currentQueueDepth: number;
  uptimeMs: number;
  lastSpokenAt: number | null;
  errors: number;
}

export interface VoiceAssistantConfig {
  maxQueueSize: number;
  maxRetries: number;
  retryDelayMs: number;
  minGapBetweenMessages: number;
  throttleIntervalMs: number;
  dedupWindowMs: number;
  staleMessageTtlMs: number;
  starvationThresholdMs: number;
  starvationBoostFactor: number;
  pacingMinIntervalMs: number;
  pacingMaxBurst: number;
  hapticCooldownMs: number;
  commandHistoryMax: number;
  waveformSampleRate: number;
  pttTimeoutMs: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export const DEFAULT_VOICE_CONFIG: VoiceAssistantConfig = {
  maxQueueSize: 100,
  maxRetries: 3,
  retryDelayMs: 500,
  minGapBetweenMessages: 300,
  throttleIntervalMs: 200,
  dedupWindowMs: 5000,
  staleMessageTtlMs: 30000,
  starvationThresholdMs: 5000,
  starvationBoostFactor: 2,
  pacingMinIntervalMs: 1500,
  pacingMaxBurst: 3,
  hapticCooldownMs: 1000,
  commandHistoryMax: 100,
  waveformSampleRate: 44100,
  pttTimeoutMs: 30000,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

export const PRIORITY_ORDER: VoicePriority[] = [
  'critical',
  'high',
  'normal',
  'low',
  'background',
];

export const PRIORITY_WEIGHTS: Record<VoicePriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
  background: 4,
};
