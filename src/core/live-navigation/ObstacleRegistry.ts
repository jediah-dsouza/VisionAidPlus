import { logger } from '../debug';
import type { Obstacle, ObstacleEvent, ObstacleDirection, ObstacleSeverity, ObstacleStatus, NavigationConfig } from './types';
import { DEFAULT_NAVIGATION_CONFIG } from './types';
import { NAVIGATION_EVENTS } from './NavigationEventBus';
import { eventBus } from '../events/EventBus';

function spatialHashKey(direction: ObstacleDirection, distanceCm: number, type: string): string {
  const bucket = Math.round(distanceCm / 10) * 10;
  return `${direction}:${bucket}:${type}`;
}

export class ObstacleRegistry {
  private obstacles = new Map<string, Obstacle>();
  private spatialIndex = new Map<string, string[]>();
  private config: NavigationConfig;
  private destroyed = false;
  private metrics = { totalInserted: 0, deduplicationHits: 0, stalePruned: 0 };

  constructor(config: Partial<NavigationConfig> = {}) {
    this.config = { ...DEFAULT_NAVIGATION_CONFIG, ...config };
  }

  private now(): number {
    return Date.now();
  }

  insertOrUpdate(event: ObstacleEvent): Obstacle | null {
    if (this.destroyed) return null;

    const existingById = this.obstacles.get(event.id);
    if (existingById) {
      this.metrics.deduplicationHits++;
      this.updateSpatialIndex(existingById, event);
      return this.updateExisting(existingById, event);
    }

    const key = spatialHashKey(event.direction, event.distanceCm, event.type);
    const existing = this.spatialIndex.get(key);

    if (existing && existing.length > 0) {
      const existingId = existing[0];
      if (existingId === event.id) {
        const obstacle = this.obstacles.get(existingId);
        if (obstacle) {
          this.metrics.deduplicationHits++;
          this.updateSpatialIndex(obstacle, event);
          return this.updateExisting(obstacle, event);
        }
      }
    }

    if (this.obstacles.size >= this.config.obstacleMaxCapacity) {
      this.evictOldest();
    }

    const obstacle = this.createFromEvent(event, key);
    this.obstacles.set(obstacle.id, obstacle);

    const hashKey = spatialHashKey(event.direction, event.distanceCm, event.type);
    const existingHashes = this.spatialIndex.get(hashKey) ?? [];
    existingHashes.push(obstacle.id);
    this.spatialIndex.set(hashKey, existingHashes);

    this.metrics.totalInserted++;
    eventBus.publish(NAVIGATION_EVENTS.OBSTACLE_DETECTED, { obstacle }, 'high');

    return obstacle;
  }

  private createFromEvent(event: ObstacleEvent, spatialKey: string): Obstacle {
    const now = this.now();
    return {
      id: event.id,
      type: event.type,
      distanceCm: event.distanceCm,
      direction: event.direction,
      severity: event.severity,
      status: 'detected' as ObstacleStatus,
      priority: 0,
      detectedAt: now,
      lastUpdatedAt: now,
      expiresAt: now + this.config.staleObstacleTtlMs,
      source: event.source,
      heading: event.heading,
      velocity: event.velocity,
      size: event.size ?? 'medium',
      confidence: event.confidence ?? 1,
      ttlMs: this.config.staleObstacleTtlMs,
      updateCount: 1,
    };
  }

  private updateSpatialIndex(obstacle: Obstacle, event: ObstacleEvent): void {
    const oldKey = spatialHashKey(obstacle.direction, obstacle.distanceCm, obstacle.type);
    const newKey = spatialHashKey(event.direction, event.distanceCm, event.type);
    if (oldKey !== newKey) {
      const oldList = this.spatialIndex.get(oldKey);
      if (oldList) {
        const filtered = oldList.filter(id => id !== obstacle.id);
        if (filtered.length === 0) {
          this.spatialIndex.delete(oldKey);
        } else {
          this.spatialIndex.set(oldKey, filtered);
        }
      }
      const newList = this.spatialIndex.get(newKey) ?? [];
      newList.push(obstacle.id);
      this.spatialIndex.set(newKey, newList);
    }
  }

  private updateExisting(obstacle: Obstacle, event: ObstacleEvent): Obstacle {
    const now = this.now();
    obstacle.distanceCm = event.distanceCm;
    obstacle.direction = event.direction;
    obstacle.severity = event.severity;
    obstacle.lastUpdatedAt = now;
    obstacle.expiresAt = now + obstacle.ttlMs;
    obstacle.status = 'active';
    obstacle.updateCount++;
    obstacle.heading = event.heading ?? obstacle.heading;
    obstacle.velocity = event.velocity ?? obstacle.velocity;
    obstacle.confidence = event.confidence ?? obstacle.confidence;

    eventBus.publish(NAVIGATION_EVENTS.OBSTACLE_UPDATED, { obstacle }, 'high');
    return obstacle;
  }

  private evictOldest(): void {
    let oldest: Obstacle | null = null;
    for (const obstacle of this.obstacles.values()) {
      if (!oldest || obstacle.lastUpdatedAt < oldest.lastUpdatedAt) {
        oldest = obstacle;
      }
    }
    if (oldest) {
      this.remove(oldest.id);
    }
  }

  remove(id: string): boolean {
    const obstacle = this.obstacles.get(id);
    if (!obstacle) return false;

    const hashKey = spatialHashKey(obstacle.direction, obstacle.distanceCm, obstacle.type);
    const hashList = this.spatialIndex.get(hashKey);
    if (hashList) {
      const filtered = hashList.filter(hid => hid !== id);
      if (filtered.length === 0) {
        this.spatialIndex.delete(hashKey);
      } else {
        this.spatialIndex.set(hashKey, filtered);
      }
    }

    this.obstacles.delete(id);
    eventBus.publish(NAVIGATION_EVENTS.OBSTACLE_REMOVED, { obstacleId: id }, 'normal');
    return true;
  }

  markStale(id: string): boolean {
    const obstacle = this.obstacles.get(id);
    if (!obstacle || obstacle.status === 'expired') return false;

    obstacle.status = 'stale';
    eventBus.publish(NAVIGATION_EVENTS.OBSTACLE_STALE, { obstacleId: id, obstacle }, 'low');
    return true;
  }

  getActive(): Obstacle[] {
    const result: Obstacle[] = [];
    for (const obstacle of this.obstacles.values()) {
      if (obstacle.status === 'active' || obstacle.status === 'detected') {
        result.push(obstacle);
      }
    }
    return result;
  }

  getAll(): Obstacle[] {
    return Array.from(this.obstacles.values());
  }

  getById(id: string): Obstacle | undefined {
    return this.obstacles.get(id);
  }

  getCount(): number {
    return this.obstacles.size;
  }

  getExpired(): Obstacle[] {
    const now = this.now();
    const result: Obstacle[] = [];
    for (const obstacle of this.obstacles.values()) {
      if (obstacle.expiresAt <= now && obstacle.status !== 'expired') {
        result.push(obstacle);
      }
    }
    return result;
  }

  pruneExpired(): number {
    const expired = this.getExpired();
    let count = 0;
    for (const obstacle of expired) {
      obstacle.status = 'expired';
      this.remove(obstacle.id);
      count++;
    }
    if (count > 0) {
      this.metrics.stalePruned += count;
      logger.info(`[ObstacleRegistry] Pruned ${count} expired obstacles`);
    }
    return count;
  }

  clear(): void {
    this.obstacles.clear();
    this.spatialIndex.clear();
    logger.info('[ObstacleRegistry] Cleared all obstacles');
  }

  getMetrics() {
    return { ...this.metrics };
  }

  updateConfig(config: Partial<NavigationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  destroy(): void {
    this.destroyed = true;
    this.clear();
  }
}

export const obstacleRegistry = new ObstacleRegistry();
