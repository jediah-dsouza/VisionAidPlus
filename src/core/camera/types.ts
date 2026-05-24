export type CameraDevicePosition = 'back' | 'front' | 'external';
export type CameraSessionState = 'idle' | 'requesting' | 'preparing' | 'active' | 'error' | 'suspended';
export type CameraPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'restricted';
export type FrameResolution = { width: number; height: number };
export type FrameOrientation = 'portrait' | 'landscape' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right';

export interface CameraDeviceInfo {
  id: string;
  position: CameraDevicePosition;
  hasFlash: boolean;
  hasTorch: boolean;
  supportsDepth: boolean;
  supportsFocus: boolean;
  resolutions: FrameResolution[];
  physicalDevices: string[];
}

export interface CameraFrame {
  id: string;
  timestamp: number;
  sourceTimestamp: number;
  frameId: number;
  width: number;
  height: number;
  orientation: FrameOrientation;
  bytesPerRow: number;
  planesCount: number;
  isDepth: boolean;
}

export interface CameraSessionConfig {
  targetFps: number;
  processingFps: number;
  resolution: FrameResolution;
  position: CameraDevicePosition;
  enableDepth: boolean;
  enableAutoFocus: boolean;
  enableTorch: boolean;
  qualityBalance: 'speed' | 'balanced' | 'quality';
}

export type DetectionType = 'obstacle' | 'person' | 'vehicle' | 'staircase' | 'curb' | 'doorway' | 'sign' | 'hazard' | 'surface_change' | 'moving_object' | 'static_object' | 'text';

export type DetectionPriority = 'critical' | 'high' | 'normal' | 'low' | 'background';

export type DetectionSource = 'ai_model' | 'depth' | 'motion' | 'fusion';

export type DetectionLifecycleState = 'captured' | 'classified' | 'confirmed' | 'stale' | 'evicted';

export interface DetectionPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectionConfidence {
  overall: number;
  classification: number;
  spatial: number;
  temporal: number;
}

export interface TrackingMetadata {
  trackingId: string;
  firstSeenAt: number;
  lastSeenAt: number;
  appearanceCount: number;
  trajectory: DetectionPosition[];
}

export interface DetectionContract {
  id: string;
  type: DetectionType;
  priority: DetectionPriority;
  source: DetectionSource;
  lifecycleState: DetectionLifecycleState;
  position: DetectionPosition;
  confidence: DetectionConfidence;
  frameId: string;
  sourceTimestamp: number;
  processedAt: number;
  ttlMs: number;
  tracking: TrackingMetadata | null;
  metadata: Record<string, unknown>;
}

export interface FrameBundle {
  frame: CameraFrame;
  capturedAt: number;
  frameNumber: number;
  processed: boolean;
  dropped: boolean;
}

export interface DetectionQueueItem {
  detection: DetectionContract;
  enqueuedAt: number;
  queuePosition: number;
  priorityScore: number;
  starvationScore: number;
}

export interface AISessionMetrics {
  totalFrames: number;
  processedFrames: number;
  droppedFrames: number;
  totalDetections: number;
  classifiedDetections: number;
  suppressedDuplicates: number;
  stalePruned: number;
  queueOverflows: number;
  averageProcessingLatencyMs: number;
  peakProcessingLatencyMs: number;
  currentFps: number;
  targetFps: number;
  dropRate: number;
  uptimeMs: number;
  sessionStartTime: number;
  lastDetectionAt: number | null;
}

export interface AIConfig {
  maxQueueSize: number;
  targetFps: number;
  processingFps: number;
  dedupWindowMs: number;
  stalenessTtlMs: number;
  minConfidence: number;
  historyMaxDetections: number;
  renderBatchIntervalMs: number;
  frameTimeoutMs: number;
  starvationThresholdMs: number;
  starvationBoostFactor: number;
  maxConcurrentFrames: number;
  thermalThrottleThreshold: number;
  dropRateThreshold: number;
  throttleRecoveryStep: number;
  targetLatencyMs: number;
}

export interface DetectionVisibilityState {
  detectionId: string;
  visible: boolean;
  opacity: number;
  staleAt: number;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  maxQueueSize: 500,
  targetFps: 30,
  processingFps: 15,
  dedupWindowMs: 3000,
  stalenessTtlMs: 5000,
  minConfidence: 0.4,
  historyMaxDetections: 20,
  renderBatchIntervalMs: 100,
  frameTimeoutMs: 2000,
  starvationThresholdMs: 5000,
  starvationBoostFactor: 2,
  maxConcurrentFrames: 10,
  thermalThrottleThreshold: 0.3,
  dropRateThreshold: 0.3,
  throttleRecoveryStep: 0.7,
  targetLatencyMs: 100,
};

export const DETECTION_TYPE_PRIORITY: Record<DetectionType, DetectionPriority> = {
  hazard: 'critical',
  obstacle: 'high',
  staircase: 'high',
  curb: 'high',
  surface_change: 'high',
  moving_object: 'high',
  person: 'high',
  vehicle: 'high',
  doorway: 'normal',
  sign: 'normal',
  static_object: 'low',
  text: 'background',
};

export type AIPipelineEvent =
  | { type: 'FRAME_CAPTURED'; frame: CameraFrame }
  | { type: 'DETECTION_RECEIVED'; detection: DetectionContract }
  | { type: 'DETECTION_CLASSIFIED'; detection: DetectionContract }
  | { type: 'DETECTIONS_RENDER'; detections: DetectionContract[] }
  | { type: 'SESSION_STATE_CHANGE'; state: CameraSessionState }
  | { type: 'PIPELINE_ERROR'; error: string; context: unknown }
  | { type: 'FRAME_DROPPED'; reason: string; frameId: string }
  | { type: 'QUEUE_OVERFLOW'; droppedCount: number }
  | { type: 'THROTTLE_ADJUSTED'; targetFps: number }
  | { type: 'METRICS_UPDATE'; metrics: AISessionMetrics };
