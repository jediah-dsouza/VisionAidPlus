import { logger } from '../debug';
import { obstacleRegistry } from './ObstacleRegistry';
import { eventBus } from '../events/EventBus';
import { NAVIGATION_EVENTS } from './NavigationEventBus';
import type {
  Obstacle, RadarSnapshot, RadarSector, NavigationConfig,
} from './types';
import { DEFAULT_NAVIGATION_CONFIG } from './types';

export class RadarSyncSystem {
  private config: NavigationConfig;
  private destroyed = false;
  private lastSnapshot: RadarSnapshot | null = null;
  private updateCount = 0;
  private lastSyncTime = 0;

  constructor(config: Partial<NavigationConfig> = {}) {
    this.config = { ...DEFAULT_NAVIGATION_CONFIG, ...config };
  }

  private now(): number {
    return Date.now();
  }

  computeSectors(obstacles: Obstacle[]): RadarSector[] {
    const sectors: RadarSector[] = [];
    const angleStep = 360 / this.config.radarSectorCount;

    for (let i = 0; i < this.config.radarSectorCount; i++) {
      const startAngle = i * angleStep;
      const endAngle = startAngle + angleStep;

      const sectorObstacles = obstacles.filter(o => {
        const angle = directionToAngle(o.direction);
        return angle >= startAngle && angle < endAngle;
      });

      const nearest = sectorObstacles.reduce<Obstacle | null>(
        (min, o) => (!min || o.distanceCm < min.distanceCm) ? o : min,
        null,
      );

      sectors.push({
        angle: startAngle + angleStep / 2,
        distanceCm: nearest?.distanceCm ?? this.config.radarMaxDistanceCm,
        severity: nearest?.severity ?? 'safe',
        obstacleCount: sectorObstacles.length,
        nearestObstacleId: nearest?.id ?? null,
      });
    }

    return sectors;
  }

  computeSnapshot(obstacles: Obstacle[]): RadarSnapshot {
    const sectors = this.computeSectors(obstacles);

    const nearestObstacle = obstacles.reduce<Obstacle | null>(
      (min, o) => (!min || o.distanceCm < min.distanceCm) ? o : min,
      null,
    );

    return {
      sectors,
      nearestObstacle,
      totalObstacles: obstacles.length,
      maxDistanceCm: this.config.radarMaxDistanceCm,
      updatedAt: this.now(),
    };
  }

  syncAndPublish(): RadarSnapshot | null {
    if (this.destroyed) return null;

    const now = this.now();
    if (now - this.lastSyncTime < this.config.renderThrottleMs) return null;

    this.lastSyncTime = now;
    const obstacles = obstacleRegistry.getActive();
    const snapshot = this.computeSnapshot(obstacles);
    this.lastSnapshot = snapshot;
    this.updateCount++;

    eventBus.publish(NAVIGATION_EVENTS.RADAR_SYNC, { snapshot }, 'normal');
    return snapshot;
  }

  getLastSnapshot(): RadarSnapshot | null {
    return this.lastSnapshot;
  }

  getUpdateCount(): number {
    return this.updateCount;
  }

  updateConfig(config: Partial<NavigationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  destroy(): void {
    this.destroyed = true;
    this.lastSnapshot = null;
  }
}

const DIRECTION_ANGLES: Record<string, number> = {
  'front': 0,
  'front-left': 315,
  'left': 270,
  'front-right': 45,
  'right': 90,
  'center': 0,
  'behind': 180,
  'unknown': 0,
};

function directionToAngle(direction: string): number {
  return DIRECTION_ANGLES[direction] ?? 0;
}

export const radarSyncSystem = new RadarSyncSystem();
