export { eventBus, EVENTS } from './events/EventBus';
export type { AppEvent, EventPriority, EventHandler } from './events/EventBus';

export { storage, STORAGE_KEYS } from './storage/StorageService';
export type { StorageAdapter } from './storage/StorageService';

export { bleService } from './native/BLEService';
export type { BLEDevice, BLEPacket } from './native/BLEService';

export { aiService } from './native/AIService';
export type { AIServiceConfig as AIConfig, DetectionResult } from './native/AIService';

export { ttsService } from './native/TTSService';
export type { TTSConfig, TTSQueueItem } from './native/TTSService';

export {
  accessibilityEngine,
  voiceQueue,
  speechController,
  hapticCoordinator,
  focusManager,
  eventPriorityMapper,
  accessibilityEventEmitter,
  SemanticUtils,
} from './accessibility';
export type {
  AccessibilityConfig,
  AnnounceConfig,
  VoiceMessage,
  SpeechState,
  HapticPattern,
  EventCategory,
  PriorityMapping,
  AccessibilityEvent,
  AccessibilityEventType,
} from './accessibility';

export { errorHandler, withErrorBoundary } from './error/ErrorHandler';
export type { ErrorContext, ErrorReport } from './error/ErrorHandler';

export { logger } from './debug/index';
export type { LogLevel } from './debug/index';

export {
  emergencyStateMachine,
  emergencyCountdownManager,
  emergencyEventPriorityManager,
  emergencyGPSPipeline,
  emergencySMSPipeline,
  emergencyContactManager,
  emergencyManager,
  EMERGENCY_EVENTS,
} from './emergency';
export type {
  EmergencyStatus,
  EmergencyEvent,
  CountdownConfig,
  CountdownState,
  EmergencyEventKey,
  EmergencyEventPayloads,
  GPSLocation,
  GPSConfig,
  SMSMessage,
  SMSConfig,
  EmergencySession,
  EmergencyManagerConfig,
} from './emergency';

export {
  SpeechPriorityEngine,
  SpeechQueueManager,
  SpeechLifecycleManager,
  InterruptionCoordinator,
  SpeechDeduplicationEngine,
  AccessibilityPacingController,
  TTSIntegrationLayer,
  CommandHistoryRegistry,
  PushToTalkLayer,
  WaveformPipeline,
  HapticSynchronizer,
  VoiceMetricsCollector,
  VOICE_EVENTS,
  subscribeToSpeechLifecycle,
  subscribeToVoiceCommandEvents,
  DEFAULT_VOICE_CONFIG,
  PRIORITY_ORDER,
  PRIORITY_WEIGHTS,
} from './voice-assistant';
export type {
  SpeechMessage,
  SpeechQueueItem,
  VoicePriority,
  VoiceCategory,
  VoiceLifecycleState,
  PlaybackState,
  VoiceSource,
  VoiceCommand,
  WaveformFrame,
  WaveformSegment,
  PushToTalkState,
  VoiceMetrics,
  VoiceAssistantConfig,
} from './voice-assistant';

export {
  obstacleRegistry,
  obstacleLifecycleManager,
  obstaclePrioritizationEngine,
  directionalGuidanceEngine,
  radarSyncSystem,
  navigationManager,
  NAVIGATION_EVENTS,
  subscribeToObstacleEvents,
  subscribeToGuidanceEvents,
  subscribeToDangerEvents,
  subscribeToNavigationLifecycle,
  DEFAULT_NAVIGATION_CONFIG,
} from './live-navigation';

export {
  DetectionContractRegistry,
  CameraLifecycleManager,
  CameraPermissionCoordinator,
  FramePipelineCoordinator,
  FrameThrottleController,
  FrameMetricsCollector,
  DetectionQueueController,
  DetectionDeduplicationLayer,
  DetectionStalenessManager,
  AIEventPriorityLayer,
  DetectionRenderingCoordinator,
  AIOverlaySynchronizationLayer,
  DetectionVisibilityController,
  BackgroundProcessingCoordinator,
  FrameDropProtection,
  RenderingPerformanceMonitor,
  DetectionSessionManager,
} from './camera';
export type {
  CameraFrame,
  CameraSessionConfig,
  CameraSessionState,
  DetectionContract,
  DetectionQueueItem,
  DetectionPriority,
  DetectionPosition,
  DetectionConfidence,
  AISessionMetrics,
  AIPipelineEvent,
  FrameBundle,
} from './camera';

export { AI_EVENTS } from './events/AI_EVENTS';
export type {
  ObstacleEvent,
  Obstacle,
  ObstacleDirection,
  ObstacleSeverity,
  ObstacleStatus,
  EnvironmentMode,
  NavigationStatus,
  GuidanceType,
  DangerLevel,
  GuidanceInstruction,
  RadarSector,
  RadarSnapshot,
  NavigationPosition,
  NavigationRoute,
  NavigationStep,
  NavigationConfig,
  NavigationSession,
  NavigationMetrics,
  NavigationPerformanceReport,
} from './live-navigation';
