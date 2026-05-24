import { logger } from '@core/debug';
import { eventBus } from '@core/events/EventBus';
import { AI_EVENTS } from '@core/events/AI_EVENTS';
import type { DetectionContract, CameraSessionState } from '@core/camera/types';

type MiddlewareEvent = {
  event: string;
  payload: unknown;
};

export class DetectionEventMiddleware {
  private destroyed = false;
  private unsubscribers: (() => void)[] = [];
  private initialized = false;

  constructor() {
    this.initialized = false;
  }

  initialize(): void {
    if (this.initialized || this.destroyed) return;

    this.unsubscribers.push(
      eventBus.subscribe(AI_EVENTS.DETECTION_CLASSIFIED, (payload: unknown) => {
        if (this.destroyed) return;
        const { detection } = payload as { detection: DetectionContract };
        logger.info(`[DetectionEventMiddleware] Classified: ${detection.type} (${detection.priority})`);
      }),
    );

    this.unsubscribers.push(
      eventBus.subscribe(AI_EVENTS.SESSION_STATE_CHANGE, (payload: unknown) => {
        if (this.destroyed) return;
        const { state } = payload as { state: CameraSessionState };
        logger.info(`[DetectionEventMiddleware] Session: ${state}`);
      }),
    );

    this.unsubscribers.push(
      eventBus.subscribe(AI_EVENTS.PIPELINE_ERROR, (payload: unknown) => {
        if (this.destroyed) return;
        const { message } = payload as { message: string };
        logger.error(`[DetectionEventMiddleware] Error: ${message}`);
      }),
    );

    this.initialized = true;
    logger.info('[DetectionEventMiddleware] Initialized');
  }

  handleEvent(event: MiddlewareEvent): void {
    if (this.destroyed) return;

    switch (event.event) {
      case AI_EVENTS.DETECTION_RECEIVED:
        logger.debug(`[DetectionEventMiddleware] Detection received`);
        break;
      case AI_EVENTS.QUEUE_OVERFLOW:
        logger.warn('[DetectionEventMiddleware] Queue overflow');
        break;
      default:
        break;
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    this.initialized = false;
    logger.info('[DetectionEventMiddleware] Destroyed');
  }
}
