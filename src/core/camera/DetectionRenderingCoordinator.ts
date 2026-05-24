import { logger } from '../debug';
import { eventBus } from '../events/EventBus';
import { AI_EVENTS } from '../events/AI_EVENTS';
import type { DetectionContract, DetectionVisibilityState } from './types';
import { DEFAULT_AI_CONFIG, AIConfig } from './types';

export class DetectionRenderingCoordinator {
  private config: AIConfig;
  private destroyed = false;
  private pendingDetections: DetectionContract[] = [];
  private renderTimer: ReturnType<typeof setInterval> | null = null;
  private renderCount = 0;

  constructor(config: Partial<AIConfig> = {}) {
    this.config = { ...DEFAULT_AI_CONFIG, ...config };
  }

  start(): void {
    if (this.destroyed) return;

    this.renderTimer = setInterval(() => {
      if (this.destroyed || this.pendingDetections.length === 0) return;
      const batch = this.pendingDetections.splice(0);
      this.renderCount++;
      eventBus.publish(AI_EVENTS.DETECTIONS_RENDER, { detections: batch }, 'low');
    }, this.config.renderBatchIntervalMs);
  }

  queueForRender(detection: DetectionContract): void {
    if (this.destroyed) return;
    this.pendingDetections.push(detection);

    if (this.pendingDetections.length > 50) {
      this.pendingDetections = this.pendingDetections.slice(-50);
    }
  }

  getRenderCount(): number {
    return this.renderCount;
  }

  stop(): void {
    if (this.renderTimer) {
      clearInterval(this.renderTimer);
      this.renderTimer = null;
    }
    this.pendingDetections = [];
  }

  destroy(): void {
    this.destroyed = true;
    this.stop();
    logger.info('[DetectionRenderingCoordinator] Destroyed');
  }
}
