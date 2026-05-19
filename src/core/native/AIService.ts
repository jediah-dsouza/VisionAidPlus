import { eventBus, EVENTS, EventPriority } from '../events/EventBus';
import { logger } from '../debug';
import env from '../../env';
import type { ObstacleDetection, BoundingBox } from '@shared/types';

export interface AIConfig {
  mockMode: boolean;
  modelPath: string;
  confidenceThreshold: number;
}

interface DetectionResult {
  type: string;
  confidence: number;
  boundingBox: BoundingBox;
}

abstract class AIServiceBase {
  abstract initialize(): Promise<void>;
  abstract processFrame(imageData: ArrayBuffer): Promise<DetectionResult[]>;
  abstract stop(): Promise<void>;
  abstract isReady(): boolean;
}

class MockAIService extends AIServiceBase {
  private ready = false;
  private processing = false;

  async initialize(): Promise<void> {
    logger.info('AI: Initializing mock service');
    await new Promise(resolve => setTimeout(resolve, 500));
    this.ready = true;
    eventBus.publish(EVENTS.CAMERA_INITIALIZED, { status: 'ready' }, 'normal');
  }

  async processFrame(_imageData: ArrayBuffer): Promise<DetectionResult[]> {
    if (!this.ready || this.processing) return [];

    this.processing = true;

    await new Promise(resolve => setTimeout(resolve, 100));

    const random = Math.random();
    if (random > 0.7) {
      const obstacle: ObstacleDetection = {
        type: 'person',
        distance: Math.floor(Math.random() * 300) + 50,
        direction: ['left', 'center', 'right'][Math.floor(Math.random() * 3)] as
          | 'left'
          | 'center'
          | 'right',
        severity: random > 0.9 ? 'danger' : 'caution',
        voiceInstruction: this.generateInstruction(random > 0.9),
        timestamp: new Date().toISOString(),
        boundingBox: {
          x: Math.random() * 0.5,
          y: Math.random() * 0.3,
          width: 0.2,
          height: 0.4,
        },
      };

      const priority: EventPriority = obstacle.severity === 'danger' ? 'critical' : 'normal';
      const event =
        obstacle.severity === 'danger' ? EVENTS.AI_DANGER_DETECTED : EVENTS.AI_OBSTACLE_DETECTED;
      eventBus.publish(event, obstacle, priority);
    }

    this.processing = false;
    return [];
  }

  private generateInstruction(isDanger: boolean): string {
    if (isDanger) {
      return 'Warning! Obstacle detected very close. Stop immediately.';
    }
    return 'Obstacle detected in your path. Please proceed with caution.';
  }

  async stop(): Promise<void> {
    this.ready = false;
    logger.info('AI: Mock service stopped');
  }

  isReady(): boolean {
    return this.ready;
  }
}

class RealAIService extends AIServiceBase {
  async initialize(): Promise<void> {
    logger.info('AI: Real implementation - initialize');
  }

  async processFrame(_imageData: ArrayBuffer): Promise<DetectionResult[]> {
    logger.debug('AI: Real implementation - processFrame');
    return [];
  }

  async stop(): Promise<void> {
    logger.info('AI: Real implementation - stop');
  }

  isReady(): boolean {
    return false;
  }
}

const config: AIConfig = {
  mockMode: env.MOCK_AI_DETECTION,
  modelPath: env.AI_MODEL_PATH,
  confidenceThreshold: 0.7,
};

export const aiService = config.mockMode ? new MockAIService() : new RealAIService();

export type { DetectionResult };
