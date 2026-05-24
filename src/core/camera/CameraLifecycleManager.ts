import { logger } from '../debug';
import { eventBus } from '../events/EventBus';
import { AI_EVENTS } from '../events/AI_EVENTS';
import type { CameraSessionState, CameraDeviceInfo, CameraSessionConfig, FrameResolution, CameraDevicePosition } from './types';
import { DEFAULT_AI_CONFIG } from './types';

export class CameraLifecycleManager {
  private state: CameraSessionState = 'idle';
  private config = DEFAULT_AI_CONFIG;
  private device: CameraDeviceInfo | null = null;
  private destroyed = false;
  private active = false;
  private frameCount = 0;

  constructor(config: Partial<typeof DEFAULT_AI_CONFIG> = {}) {
    this.config = { ...this.config, ...config };
  }

  getState(): CameraSessionState {
    return this.state;
  }

  isActive(): boolean {
    return this.active;
  }

  getDevice(): CameraDeviceInfo | null {
    return this.device;
  }

  async requestPermission(): Promise<boolean> {
    if (this.destroyed) return false;
    this.state = 'requesting';
    this.publishState();
    return true;
  }

  async prepare(device: CameraDeviceInfo, sessionConfig?: Partial<CameraSessionConfig>): Promise<void> {
    if (this.destroyed) return;
    this.state = 'preparing';
    this.device = device;
    this.publishState();
    logger.info('[CameraLifecycle] Prepared', device.id);
  }

  async start(): Promise<void> {
    if (this.destroyed || !this.device) return;
    this.state = 'active';
    this.active = true;
    this.frameCount = 0;
    this.publishState();
    logger.info('[CameraLifecycle] Started');
  }

  async stop(): Promise<void> {
    if (this.destroyed) return;
    this.state = 'idle';
    this.active = false;
    this.publishState();
    logger.info('[CameraLifecycle] Stopped');
  }

  suspend(): void {
    if (this.destroyed || this.state !== 'active') return;
    this.state = 'suspended';
    this.active = false;
    this.publishState();
    logger.info('[CameraLifecycle] Suspended');
  }

  resume(): void {
    if (this.destroyed || this.state !== 'suspended') return;
    this.state = 'active';
    this.active = true;
    this.publishState();
    logger.info('[CameraLifecycle] Resumed');
  }

  setError(error: string): void {
    if (this.destroyed) return;
    this.state = 'error';
    this.active = false;
    eventBus.publish(AI_EVENTS.PIPELINE_ERROR, { error, context: 'camera_lifecycle' }, 'high');
    this.publishState();
    logger.error('[CameraLifecycle] Error:', error);
  }

  getFrameCount(): number {
    return this.frameCount;
  }

  incrementFrameCount(): void {
    this.frameCount++;
  }

  private publishState(): void {
    eventBus.publish(AI_EVENTS.SESSION_STATE_CHANGE, { state: this.state }, 'normal');
  }

  destroy(): void {
    this.destroyed = true;
    this.active = false;
    this.device = null;
    this.state = 'idle';
    logger.info('[CameraLifecycle] Destroyed');
  }
}
