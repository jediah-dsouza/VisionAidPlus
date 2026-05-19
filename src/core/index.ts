export { eventBus, EVENTS } from './events/EventBus';
export type { AppEvent, EventPriority, EventHandler } from './events/EventBus';

export { storage, STORAGE_KEYS } from './storage/StorageService';
export type { StorageAdapter } from './storage/StorageService';

export { bleService } from './native/BLEService';
export type { BLEDevice, BLEPacket } from './native/BLEService';

export { aiService } from './native/AIService';
export type { AIConfig, DetectionResult } from './native/AIService';

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
