export { obstacleRegistry } from './ObstacleRegistry';
export type { ObstacleRegistry } from './ObstacleRegistry';

export { obstacleLifecycleManager } from './ObstacleLifecycleManager';
export type { ObstacleLifecycleManager } from './ObstacleLifecycleManager';

export { obstaclePrioritizationEngine } from './ObstaclePrioritizationEngine';
export type { ObstaclePrioritizationEngine } from './ObstaclePrioritizationEngine';

export { directionalGuidanceEngine } from './DirectionalGuidanceEngine';
export type { DirectionalGuidanceEngine } from './DirectionalGuidanceEngine';

export { radarSyncSystem } from './RadarSyncSystem';
export type { RadarSyncSystem } from './RadarSyncSystem';

export { navigationManager } from './NavigationManager';
export type { NavigationManager } from './NavigationManager';

export {
  NAVIGATION_EVENTS,
  subscribeToObstacleEvents,
  subscribeToGuidanceEvents,
  subscribeToDangerEvents,
  subscribeToNavigationLifecycle,
} from './NavigationEventBus';

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
  HapticPattern,
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
} from './types';

export { DEFAULT_NAVIGATION_CONFIG } from './types';
