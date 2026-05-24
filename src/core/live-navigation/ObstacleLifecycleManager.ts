import { logger } from '../debug';
import { obstacleRegistry } from './ObstacleRegistry';
import { eventBus } from '../events/EventBus';
import { NAVIGATION_EVENTS } from './NavigationEventBus';
import type { NavigationConfig } from './types';
import { DEFAULT_NAVIGATION_CONFIG } from './types';

export class ObstacleLifecycleManager {
  private config: NavigationConfig;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;
  private cycles = 0;
  private registry: typeof obstacleRegistry;

  constructor(config: Partial<NavigationConfig> = {}, registry?: typeof obstacleRegistry) {
    this.config = { ...DEFAULT_NAVIGATION_CONFIG, ...config };
    this.registry = registry ?? obstacleRegistry;
  }

  start(): void {
    if (this.destroyed || this.cleanupTimer) return;
    logger.info('[ObstacleLifecycleManager] Started cleanup scheduler');

    this.cleanupTimer = setInterval(() => {
      this.runCleanupCycle();
    }, this.config.staleCleanupIntervalMs);
  }

  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private runCleanupCycle(): void {
    if (this.destroyed) return;
    this.cycles++;

    const expired = this.registry.getExpired();
    const stale: Array<{ id: string; since: number }> = [];

    for (const obstacle of this.registry.getAll()) {
      if (obstacle.status === 'active' || obstacle.status === 'detected') {
        const age = Date.now() - obstacle.lastUpdatedAt;
        if (age >= this.config.staleObstacleTtlMs * 0.8) {
          this.registry.markStale(obstacle.id);
          stale.push({ id: obstacle.id, since: age });
        }
      }
    }

    const pruned = this.registry.pruneExpired();

    if (expired.length > 0 || stale.length > 0) {
      logger.info(
        `[ObstacleLifecycleManager] Cycle ${this.cycles}: ${stale.length} stale, ${pruned} pruned`,
      );
    }
  }

  forceCleanup(): { stale: number; pruned: number } {
    const allObstacles = this.registry.getAll();
    let stale = 0;

    for (const obstacle of allObstacles) {
      if (obstacle.status === 'active' || obstacle.status === 'detected') {
        const age = Date.now() - obstacle.lastUpdatedAt;
        if (age >= this.config.staleObstacleTtlMs * 0.8) {
          this.registry.markStale(obstacle.id);
          stale++;
        }
      }
    }

    const pruned = this.registry.pruneExpired();
    return { stale, pruned };
  }

  getCycles(): number {
    return this.cycles;
  }

  isRunning(): boolean {
    return this.cleanupTimer !== null;
  }

  updateConfig(config: Partial<NavigationConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.cleanupTimer) {
      this.stop();
      this.start();
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.stop();
    logger.info('[ObstacleLifecycleManager] Destroyed');
  }
}

export const obstacleLifecycleManager = new ObstacleLifecycleManager();
