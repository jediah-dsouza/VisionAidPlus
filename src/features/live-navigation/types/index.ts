import type {
  Obstacle, GuidanceInstruction, RadarSnapshot, DangerLevel,
  EnvironmentMode, NavigationStatus, NavigationSession as CoreNavigationSession,
} from '@core/live-navigation/types';

export interface LiveNavigationViewState {
  status: NavigationStatus;
  environment: EnvironmentMode;
  dangerLevel: DangerLevel;
  obstacleCount: number;
  nearestObstacle: Obstacle | null;
  currentInstruction: GuidanceInstruction | null;
  radarSnapshot: RadarSnapshot | null;
  isNavigating: boolean;
  isPaused: boolean;
  canResume: boolean;
  sessionId: string | null;
  sensitivity: number;
}

export interface UseLiveNavigationResult {
  viewState: LiveNavigationViewState;
  obstacles: Obstacle[];
  start: () => boolean;
  stop: () => void;
  pause: () => boolean;
  resume: () => boolean;
  setEnvironment: (mode: EnvironmentMode) => void;
  setSensitivity: (level: number) => void;
}

export type {
  Obstacle, GuidanceInstruction, RadarSnapshot, DangerLevel,
  EnvironmentMode, NavigationStatus,
};
