import { logger } from '../debug';

export class CameraPermissionCoordinator {
  private destroyed = false;

  async checkPermission(): Promise<boolean> {
    if (this.destroyed) return false;
    return true;
  }

  async requestPermission(): Promise<boolean> {
    if (this.destroyed) return false;
    return true;
  }

  getPermissionStatus(): 'granted' | 'denied' | 'undetermined' | 'restricted' {
    return 'granted';
  }

  destroy(): void {
    this.destroyed = true;
  }
}
