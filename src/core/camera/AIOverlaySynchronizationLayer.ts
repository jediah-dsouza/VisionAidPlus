import { logger } from '../debug';
import type { DetectionContract } from './types';

export class AIOverlaySynchronizationLayer {
  private destroyed = false;
  private activeOverlays: Map<string, DetectionContract> = new Map();

  sync(detection: DetectionContract): void {
    if (this.destroyed) return;
    this.activeOverlays.set(detection.id, detection);
  }

  removeOverlay(id: string): void {
    if (this.destroyed) return;
    this.activeOverlays.delete(id);
  }

  getActiveOverlays(): DetectionContract[] {
    if (this.destroyed) return [];
    return Array.from(this.activeOverlays.values());
  }

  getOverlayCount(): number {
    return this.activeOverlays.size;
  }

  clear(): void {
    this.activeOverlays.clear();
  }

  destroy(): void {
    this.destroyed = true;
    this.clear();
    logger.info('[AIOverlaySync] Destroyed');
  }
}
