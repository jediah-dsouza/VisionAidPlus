import { logger } from '../debug';
import { eventBus } from '../events/EventBus';
import { AI_EVENTS } from '../events/AI_EVENTS';
import { FrameThrottleController } from './FrameThrottleController';
import { FrameMetricsCollector } from './FrameMetricsCollector';
import type { CameraFrame, FrameBundle } from './types';
import { DEFAULT_AI_CONFIG } from './types';

export class FramePipelineCoordinator {
  private config = DEFAULT_AI_CONFIG;
  private throttle: FrameThrottleController;
  private metrics: FrameMetricsCollector;
  private destroyed = false;
  private frameNumber = 0;
  private active = false;

  constructor(
    config: Partial<typeof DEFAULT_AI_CONFIG> = {},
    throttle?: FrameThrottleController,
    metrics?: FrameMetricsCollector,
  ) {
    this.config = { ...this.config, ...config };
    this.throttle = throttle ?? new FrameThrottleController(this.config.targetFps);
    this.metrics = metrics ?? new FrameMetricsCollector();
  }

  getThrottleController(): FrameThrottleController {
    return this.throttle;
  }

  getMetricsCollector(): FrameMetricsCollector {
    return this.metrics;
  }

  start(): void {
    this.active = true;
    this.throttle.reset();
    this.metrics.reset();
    this.frameNumber = 0;
    logger.info('[FramePipeline] Started');
  }

  stop(): void {
    this.active = false;
    logger.info('[FramePipeline] Stopped');
  }

  processFrame(frame: CameraFrame): FrameBundle | null {
    if (this.destroyed || !this.active) return null;

    this.frameNumber++;

    if (!this.throttle.shouldProcess()) {
      this.metrics.recordDrop('throttle');
      const bundle: FrameBundle = { frame, capturedAt: Date.now(), frameNumber: this.frameNumber, processed: false, dropped: true };
      eventBus.publish(AI_EVENTS.FRAME_DROPPED, { reason: 'throttle', frameId: frame.id }, 'low');
      return bundle;
    }

    this.throttle.recordProcessed();
    this.metrics.recordFrame(frame);

    const bundle: FrameBundle = { frame, capturedAt: Date.now(), frameNumber: this.frameNumber, processed: true, dropped: false };
    eventBus.publish(AI_EVENTS.FRAME_CAPTURED, { frame }, 'low');
    return bundle;
  }

  getMetrics(): ReturnType<FrameMetricsCollector['getSnapshot']> {
    return this.metrics.getSnapshot();
  }

  isActive(): boolean {
    return this.active;
  }

  getFrameNumber(): number {
    return this.frameNumber;
  }

  destroy(): void {
    this.destroyed = true;
    this.active = false;
    this.throttle.destroy();
    this.metrics.destroy();
    logger.info('[FramePipeline] Destroyed');
  }
}
