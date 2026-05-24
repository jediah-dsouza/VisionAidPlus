import { logger } from '../debug';
import type { CameraSessionState } from './types';

export class DetectionVisibilityController {
  private destroyed = false;
  private visible = true;

  isVisible(): boolean {
    return this.visible;
  }

  show(): void {
    if (this.destroyed) return;
    this.visible = true;
  }

  hide(): void {
    if (this.destroyed) return;
    this.visible = false;
  }

  setVisibility(visible: boolean): void {
    if (this.destroyed) return;
    this.visible = visible;
  }

  destroy(): void {
    this.destroyed = true;
    this.visible = false;
    logger.info('[DetectionVisibility] Destroyed');
  }
}
