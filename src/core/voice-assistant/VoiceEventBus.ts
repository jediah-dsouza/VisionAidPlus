import { eventBus } from '../events/EventBus';

export const VOICE_EVENTS = {
  SPEECH_QUEUED: 'VOICE_SPEECH_QUEUED',
  SPEECH_STARTED: 'VOICE_SPEECH_STARTED',
  SPEECH_COMPLETED: 'VOICE_SPEECH_COMPLETED',
  SPEECH_FAILED: 'VOICE_SPEECH_FAILED',
  SPEECH_INTERRUPTED: 'VOICE_SPEECH_INTERRUPTED',
  SPEECH_CANCELLED: 'VOICE_SPEECH_CANCELLED',
  SPEECH_PAUSED: 'VOICE_SPEECH_PAUSED',
  SPEECH_RESUMED: 'VOICE_SPEECH_RESUMED',
  PRIORITY_ESCALATED: 'VOICE_PRIORITY_ESCALATED',
  PRIORITY_DEESCALATED: 'VOICE_PRIORITY_DEESCALATED',
  QUEUE_OVERFLOW: 'VOICE_QUEUE_OVERFLOW',
  QUEUE_DRAINED: 'VOICE_QUEUE_DRAINED',
  DUPLICATE_SUPPRESSED: 'VOICE_DUPLICATE_SUPPRESSED',
  STARVATION_PREVENTED: 'VOICE_STARVATION_PREVENTED',
  COMMAND_RECEIVED: 'VOICE_COMMAND_RECEIVED',
  COMMAND_EXECUTED: 'VOICE_COMMAND_EXECUTED',
  PTT_ACTIVATED: 'VOICE_PTT_ACTIVATED',
  PTT_DEACTIVATED: 'VOICE_PTT_DEACTIVATED',
  WAVEFORM_UPDATE: 'VOICE_WAVEFORM_UPDATE',
  WAVEFORM_SEGMENT_COMPLETE: 'VOICE_WAVEFORM_SEGMENT_COMPLETE',
  METRICS_UPDATE: 'VOICE_METRICS_UPDATE',
  PACING_ADJUSTED: 'VOICE_PACING_ADJUSTED',
  HAPTIC_SYNC: 'VOICE_HAPTIC_SYNC',
  ERRATA: 'VOICE_ERRATA',
} as const;

export function subscribeToSpeechLifecycle(
  onQueued?: (payload: unknown) => void,
  onStarted?: (payload: unknown) => void,
  onCompleted?: (payload: unknown) => void,
  onFailed?: (payload: unknown) => void,
  onInterrupted?: (payload: unknown) => void,
): () => void {
  const unsubs: Array<() => void> = [];
  if (onQueued) unsubs.push(eventBus.subscribe(VOICE_EVENTS.SPEECH_QUEUED, onQueued, 'normal'));
  if (onStarted) unsubs.push(eventBus.subscribe(VOICE_EVENTS.SPEECH_STARTED, onStarted, 'high'));
  if (onCompleted) unsubs.push(eventBus.subscribe(VOICE_EVENTS.SPEECH_COMPLETED, onCompleted, 'normal'));
  if (onFailed) unsubs.push(eventBus.subscribe(VOICE_EVENTS.SPEECH_FAILED, onFailed, 'high'));
  if (onInterrupted) unsubs.push(eventBus.subscribe(VOICE_EVENTS.SPEECH_INTERRUPTED, onInterrupted, 'high'));
  return () => { for (const u of unsubs) { try { u(); } catch {} } };
}

export function subscribeToVoiceCommandEvents(
  onCommand?: (payload: unknown) => void,
  onExecuted?: (payload: unknown) => void,
): () => void {
  const unsubs: Array<() => void> = [];
  if (onCommand) unsubs.push(eventBus.subscribe(VOICE_EVENTS.COMMAND_RECEIVED, onCommand, 'high'));
  if (onExecuted) unsubs.push(eventBus.subscribe(VOICE_EVENTS.COMMAND_EXECUTED, onExecuted, 'normal'));
  return () => { for (const u of unsubs) { try { u(); } catch {} } };
}
