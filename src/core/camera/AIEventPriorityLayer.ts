import { logger } from '../debug';
import { eventBus } from '../events/EventBus';
import { AI_EVENTS } from '../events/AI_EVENTS';
import type { DetectionContract, DetectionPriority, AIPipelineEvent } from './types';
import { DETECTION_TYPE_PRIORITY } from './types';

export class AIEventPriorityLayer {
  private destroyed = false;

  classify(detection: DetectionContract): DetectionContract {
    if (this.destroyed) return detection;

    const assignedPriority = DETECTION_TYPE_PRIORITY[detection.type] ?? 'normal';
    const updated: DetectionContract = {
      ...detection,
      priority: assignedPriority,
    };

    eventBus.publish(AI_EVENTS.DETECTION_CLASSIFIED, { detection: updated }, assignedPriority === 'critical' ? 'high' : 'normal');
    return updated;
  }

  getPriorityForType(type: string): DetectionPriority {
    return DETECTION_TYPE_PRIORITY[type as keyof typeof DETECTION_TYPE_PRIORITY] ?? 'normal';
  }

  destroy(): void {
    this.destroyed = true;
    logger.info('[AIEventPriority] Destroyed');
  }
}
