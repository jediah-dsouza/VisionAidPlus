import { logger } from '../debug';
import { eventBus } from '../events/EventBus';
import { AI_EVENTS } from '../events/AI_EVENTS';
import type { CameraSessionState, AISessionMetrics, AIConfig } from './types';
import { DEFAULT_AI_CONFIG } from './types';

export class DetectionSessionManager {
  private config: AIConfig;
  private destroyed = false;
  private sessionId: string;
  private startTime: number;
  private metrics: AISessionMetrics;
  private state: CameraSessionState = 'idle';

  constructor(config: Partial<AIConfig> = {}) {
    this.config = { ...DEFAULT_AI_CONFIG, ...config };
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.startTime = Date.now();
    this.metrics = this.emptyMetrics();
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getState(): CameraSessionState {
    return this.state;
  }

  start(): void {
    if (this.destroyed) return;
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.startTime = Date.now();
    this.metrics = this.emptyMetrics();
    this.state = 'active';
    eventBus.publish(AI_EVENTS.SESSION_STATE_CHANGE, { state: 'active', sessionId: this.sessionId }, 'normal');
    logger.info(`[DetectionSession] Started: ${this.sessionId}`);
  }

  stop(): void {
    if (this.destroyed) return;
    this.state = 'idle';
    eventBus.publish(AI_EVENTS.SESSION_STATE_CHANGE, { state: 'idle', sessionId: this.sessionId }, 'normal');
    this.publishMetrics();
    logger.info(`[DetectionSession] Stopped: ${this.sessionId}`);
  }

  updateMetrics(partial: Partial<AISessionMetrics>): void {
    if (this.destroyed) return;
    this.metrics = { ...this.metrics, ...partial, uptimeMs: Date.now() - this.startTime };
    if (partial.lastDetectionAt) this.metrics.lastDetectionAt = partial.lastDetectionAt;
  }

  getMetrics(): AISessionMetrics {
    return { ...this.metrics, uptimeMs: Date.now() - this.startTime };
  }

  publishMetrics(): void {
    const snapshot = this.getMetrics();
    eventBus.publish(AI_EVENTS.METRICS_UPDATE, { metrics: snapshot, sessionId: this.sessionId }, 'low');
  }

  private emptyMetrics(): AISessionMetrics {
    return {
      totalFrames: 0, processedFrames: 0, droppedFrames: 0,
      totalDetections: 0, classifiedDetections: 0,
      suppressedDuplicates: 0, stalePruned: 0, queueOverflows: 0,
      averageProcessingLatencyMs: 0, peakProcessingLatencyMs: 0,
      currentFps: 0, targetFps: this.config.targetFps, dropRate: 0,
      uptimeMs: 0, sessionStartTime: this.startTime, lastDetectionAt: null,
    };
  }

  destroy(): void {
    this.destroyed = true;
    this.state = 'idle';
    eventBus.publish(AI_EVENTS.SESSION_STATE_CHANGE, { state: 'idle', sessionId: this.sessionId }, 'normal');
    logger.info('[DetectionSession] Destroyed');
  }
}
