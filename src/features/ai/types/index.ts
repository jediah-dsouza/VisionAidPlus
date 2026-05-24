import type { DetectionContract, CameraSessionState } from '@core/camera/types';

export interface AIViewState {
  sessionState: CameraSessionState;
  detections: DetectionContract[];
  frameRate: number;
  error: string | null;
  overlayVisible: boolean;
}

export interface UseCameraResult {
  viewState: AIViewState;
  startCamera: () => void;
  stopCamera: () => void;
  suspendCamera: () => void;
  resumeCamera: () => void;
  toggleOverlay: () => void;
}

export interface UseDetectionStreamResult {
  detections: DetectionContract[];
  isVisible: boolean;
  clear: () => void;
}

export interface UseAIOverlayResult {
  detections: DetectionContract[];
  visible: boolean;
  show: () => void;
  hide: () => void;
}
