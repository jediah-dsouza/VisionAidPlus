export type ObstacleDirection = 'left' | 'center' | 'right' | 'front' | 'front-left' | 'front-right' | 'behind' | 'unknown';

export type ObstacleSeverity = 'safe' | 'caution' | 'danger' | 'critical';

export type ObstacleStatus = 'detected' | 'active' | 'stale' | 'expired';

export type EnvironmentMode = 'indoor' | 'outdoor' | 'night' | 'tunnel';

export type NavigationStatus = 'idle' | 'navigating' | 'paused' | 'error';

export type GuidanceType = 'direction' | 'warning' | 'info' | 'danger_alert' | 'reroute' | 'arrival';

export type DangerLevel = 'none' | 'low' | 'moderate' | 'high' | 'critical';

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'emergency' | 'navigation_turn' | 'navigation_warning';

export interface ObstacleSource {
  type: 'ble' | 'ai' | 'simulation';
  id: string;
}

export interface ObstacleEvent {
  id: string;
  type: string;
  distanceCm: number;
  direction: ObstacleDirection;
  severity: ObstacleSeverity;
  detectedAt: number;
  source: ObstacleSource;
  heading?: number;
  velocity?: number;
  size?: 'small' | 'medium' | 'large';
  confidence?: number;
}

export interface Obstacle {
  id: string;
  type: string;
  distanceCm: number;
  direction: ObstacleDirection;
  severity: ObstacleSeverity;
  status: ObstacleStatus;
  priority: number;
  detectedAt: number;
  lastUpdatedAt: number;
  expiresAt: number;
  source: ObstacleSource;
  heading?: number;
  velocity?: number;
  size: 'small' | 'medium' | 'large';
  confidence: number;
  ttlMs: number;
  updateCount: number;
}

export interface GuidanceInstruction {
  id: string;
  type: GuidanceType;
  text: string;
  priority: 'critical' | 'high' | 'normal';
  direction?: ObstacleDirection;
  distanceCm?: number;
  severity?: ObstacleSeverity;
  issuedAt: number;
  expiresAt: number;
  hapticPattern?: HapticPattern;
  spoken: boolean;
}

export interface RadarSector {
  angle: number;
  distanceCm: number;
  severity: ObstacleSeverity;
  obstacleCount: number;
  nearestObstacleId: string | null;
}

export interface RadarSnapshot {
  sectors: RadarSector[];
  nearestObstacle: Obstacle | null;
  totalObstacles: number;
  maxDistanceCm: number;
  updatedAt: number;
}

export interface NavigationPosition {
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  accuracy: number;
  timestamp: number;
}

export interface NavigationRoute {
  id: string;
  steps: NavigationStep[];
  totalDistance: number;
  totalDuration: number;
  startedAt: number;
}

export interface NavigationStep {
  id: string;
  instruction: string;
  distanceCm: number;
  duration: number;
  direction: ObstacleDirection;
  completed: boolean;
}

export interface NavigationConfig {
  staleObstacleTtlMs: number;
  obstacleMaxCapacity: number;
  radarSectorCount: number;
  radarMaxDistanceCm: number;
  guidanceUpdateIntervalMs: number;
  renderThrottleMs: number;
  hapticCooldownMs: number;
  announcementCooldownMs: number;
  staleCleanupIntervalMs: number;
  confidenceThreshold: number;
  sensitivityLevel: number;
}

export const DEFAULT_NAVIGATION_CONFIG: NavigationConfig = {
  staleObstacleTtlMs: 3000,
  obstacleMaxCapacity: 200,
  radarSectorCount: 8,
  radarMaxDistanceCm: 500,
  guidanceUpdateIntervalMs: 150,
  renderThrottleMs: 50,
  hapticCooldownMs: 1000,
  announcementCooldownMs: 2000,
  staleCleanupIntervalMs: 1000,
  confidenceThreshold: 0.3,
  sensitivityLevel: 5,
};

export interface NavigationSession {
  id: string;
  status: NavigationStatus;
  environment: EnvironmentMode;
  position: NavigationPosition | null;
  route: NavigationRoute | null;
  startedAt: number;
  pausedAt: number | null;
  totalPausedDuration: number;
  obstacleCount: number;
  dangerLevel: DangerLevel;
  lastInstruction: GuidanceInstruction | null;
}

export interface NavigationMetrics {
  totalObstaclesDetected: number;
  totalInstructionsIssued: number;
  totalDangerAlerts: number;
  averageLatencyMs: number;
  peakLatencyMs: number;
  cleanupCycles: number;
  deduplicationHits: number;
  staleObstaclesPruned: number;
  renderCount: number;
  lastUpdatedAt: number;
}

export interface NavigationPerformanceReport {
  averageRenderTimeMs: number;
  averageGuidanceLatencyMs: number;
  averageRadarSyncMs: number;
  obstacleRegistrySize: number;
  eventBusQueueLength: number;
  droppedFrames: number;
  memoryEstimateBytes: number;
}
