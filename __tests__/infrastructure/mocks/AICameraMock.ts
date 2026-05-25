import { eventBus, EVENTS } from '../../../src/core/events/EventBus';
import { AI_EVENTS } from '../../../src/core/events/AI_EVENTS';

export interface MockCameraFrame {
  id: string;
  timestamp: number;
  width: number;
  height: number;
  data: string;
}

export class AICameraMock {
  private frameCount = 0;

  generateFrame(overrides?: Partial<MockCameraFrame>): MockCameraFrame {
    this.frameCount++;
    return {
      id: `frame_${this.frameCount}`,
      timestamp: Date.now(),
      width: 640,
      height: 480,
      data: `mock_frame_data_${this.frameCount}`,
      ...overrides,
    };
  }

  simulateFrameCapture(frame?: MockCameraFrame): void {
    const f = frame || this.generateFrame();
    eventBus.publish(AI_EVENTS.FRAME_CAPTURED, {
      frameId: f.id,
      timestamp: f.timestamp,
      width: f.width,
      height: f.height,
    });
  }

  simulateDetectionResult(overrides?: {
    obstacleType?: string;
    confidence?: number;
    distance?: number;
    direction?: string;
  }): void {
    const { obstacleType = 'person', confidence = 0.92, distance = 150, direction = 'center' } = overrides || {};
    eventBus.publish(EVENTS.AI_OBSTACLE_DETECTED, {
      type: obstacleType,
      confidence,
      distanceCm: distance,
      direction,
      timestamp: new Date().toISOString(),
    });
  }

  simulateSessionState(state: string): void {
    eventBus.publish(AI_EVENTS.SESSION_STATE_CHANGE, { state });
  }

  simulatePipelineError(message: string): void {
    eventBus.publish(AI_EVENTS.PIPELINE_ERROR, { message });
  }

  get framesGenerated(): number {
    return this.frameCount;
  }

  reset(): void {
    this.frameCount = 0;
  }
}
