import { logger } from '../debug';
import { eventBus } from '../events/EventBus';
import { NAVIGATION_EVENTS } from './NavigationEventBus';
import type { Obstacle, ObstacleSeverity, ObstacleDirection, DangerLevel, NavigationConfig } from './types';
import { DEFAULT_NAVIGATION_CONFIG } from './types';

const DIRECTION_WEIGHTS: Record<ObstacleDirection, number> = {
  'front': 1.0,
  'front-left': 0.85,
  'front-right': 0.85,
  'center': 0.9,
  'left': 0.6,
  'right': 0.6,
  'behind': 0.2,
  'unknown': 0.3,
};

const SEVERITY_BASE: Record<ObstacleSeverity, number> = {
  'critical': 100,
  'danger': 60,
  'caution': 25,
  'safe': 5,
};

const SIZE_BONUS: Record<string, number> = {
  'large': 20,
  'medium': 10,
  'small': 0,
};

export class ObstaclePrioritizationEngine {
  private config: NavigationConfig;
  private currentDangerLevel: DangerLevel = 'none';
  private destroyed = false;

  constructor(config: Partial<NavigationConfig> = {}) {
    this.config = { ...DEFAULT_NAVIGATION_CONFIG, ...config };
  }

  computePriority(obstacle: Obstacle): number {
    if (this.destroyed) return 0;

    const directionWeight = DIRECTION_WEIGHTS[obstacle.direction] ?? 0.3;
    const severityBase = SEVERITY_BASE[obstacle.severity] ?? 5;
    const sizeBonus = SIZE_BONUS[obstacle.size] ?? 10;
    const confidenceFactor = obstacle.confidence;

    const distanceFactor = Math.max(0, 1 - obstacle.distanceCm / this.config.radarMaxDistanceCm);

    const velocityFactor = obstacle.velocity
      ? Math.min(1, Math.abs(obstacle.velocity) / 5)
      : 0.5;

    const priority = Math.round(
      (severityBase + sizeBonus) *
        directionWeight *
        (0.6 + 0.4 * distanceFactor) *
        (0.5 + 0.5 * confidenceFactor) *
        (0.7 + 0.3 * velocityFactor),
    );

    return Math.max(0, priority);
  }

  computeDangerLevel(obstacles: Obstacle[]): DangerLevel {
    if (obstacles.length === 0) return 'none';

    const maxPriority = obstacles.reduce(
      (max, o) => Math.max(max, this.computePriority(o)),
      0,
    );

    const frontCount = obstacles.filter(
      o => o.direction === 'front' || o.direction === 'center' || o.direction === 'front-left' || o.direction === 'front-right',
    ).length;

    const criticalCount = obstacles.filter(o => o.severity === 'critical' || o.severity === 'danger').length;

    const closeCount = obstacles.filter(o => o.distanceCm < 100).length;

    let level: DangerLevel;

    if (criticalCount > 0 || (frontCount > 0 && maxPriority > 80)) {
      level = 'critical';
    } else if (maxPriority > 50 || closeCount > 1 || (frontCount > 1 && maxPriority > 30)) {
      level = 'high';
    } else if (maxPriority > 20 || obstacles.length > 3 || closeCount > 0) {
      level = 'moderate';
    } else if (maxPriority > 5) {
      level = 'low';
    } else {
      level = 'none';
    }

    return level;
  }

  prioritize(obstacles: Obstacle[]): Obstacle[] {
    return obstacles
      .map(o => ({ ...o, priority: this.computePriority(o) }))
      .sort((a, b) => b.priority - a.priority);
  }

  getTopObstacles(obstacles: Obstacle[], count: number = 5): Obstacle[] {
    return this.prioritize(obstacles).slice(0, count);
  }

  evaluateAndPublishDanger(obstacles: Obstacle[]): DangerLevel {
    const newLevel = this.computeDangerLevel(obstacles);

    if (newLevel !== this.currentDangerLevel) {
      if (isHigherDanger(newLevel, this.currentDangerLevel)) {
        eventBus.publish(NAVIGATION_EVENTS.DANGER_ESCALATED,
          { from: this.currentDangerLevel, to: newLevel, obstacleCount: obstacles.length },
          'critical',
        );
      } else {
        eventBus.publish(NAVIGATION_EVENTS.DANGER_DEESCALATED,
          { from: this.currentDangerLevel, to: newLevel, obstacleCount: obstacles.length },
          'high',
        );
      }

      logger.info(
        `[ObstaclePrioritization] Danger: ${this.currentDangerLevel} → ${newLevel} (${obstacles.length} obstacles)`,
      );
      this.currentDangerLevel = newLevel;
    }

    return newLevel;
  }

  getCurrentDangerLevel(): DangerLevel {
    return this.currentDangerLevel;
  }

  updateConfig(config: Partial<NavigationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  destroy(): void {
    this.destroyed = true;
  }
}

function isHigherDanger(a: DangerLevel, b: DangerLevel): boolean {
  const order: Record<DangerLevel, number> = {
    'none': 0,
    'low': 1,
    'moderate': 2,
    'high': 3,
    'critical': 4,
  };
  return order[a] > order[b];
}

export const obstaclePrioritizationEngine = new ObstaclePrioritizationEngine();
