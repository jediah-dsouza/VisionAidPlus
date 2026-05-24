export { SpeechPriorityEngine } from './SpeechPriorityEngine';
export { SpeechQueueManager } from './SpeechQueueManager';
export { SpeechLifecycleManager } from './SpeechLifecycleManager';
export { InterruptionCoordinator } from './InterruptionCoordinator';
export { SpeechDeduplicationEngine } from './SpeechDeduplicationEngine';
export { AccessibilityPacingController } from './AccessibilityPacingController';
export { TTSIntegrationLayer } from './TTSIntegrationLayer';
export { CommandHistoryRegistry } from './CommandHistoryRegistry';
export { PushToTalkLayer } from './PushToTalkLayer';
export { WaveformPipeline } from './WaveformPipeline';
export { HapticSynchronizer } from './HapticSynchronizer';
export { VoiceMetricsCollector } from './VoiceMetricsCollector';
export { VOICE_EVENTS, subscribeToSpeechLifecycle, subscribeToVoiceCommandEvents } from './VoiceEventBus';

export type {
  SpeechMessage, SpeechQueueItem, VoicePriority, VoiceCategory,
  VoiceLifecycleState, PlaybackState, VoiceSource,
  VoiceCommand, WaveformFrame, WaveformSegment, PushToTalkState,
  VoiceMetrics, VoiceAssistantConfig,
} from './types';

export { DEFAULT_VOICE_CONFIG, PRIORITY_ORDER, PRIORITY_WEIGHTS } from './types';
