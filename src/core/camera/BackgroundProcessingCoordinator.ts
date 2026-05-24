import { logger } from '../debug';

type AppState = 'active' | 'background' | 'inactive';

export class BackgroundProcessingCoordinator {
  private destroyed = false;
  private appState: AppState = 'active';
  private suspended = false;
  private onSuspend: (() => void) | null = null;
  private onResume: (() => void) | null = null;

  setHandlers(onSuspend: () => void, onResume: () => void): void {
    this.onSuspend = onSuspend;
    this.onResume = onResume;
  }

  handleAppStateChange(nextState: AppState): void {
    if (this.destroyed) return;
    const prev = this.appState;
    this.appState = nextState;

    if (prev === 'active' && nextState !== 'active') {
      this.suspended = true;
      this.onSuspend?.();
      logger.info('[BackgroundCoordinator] Suspended');
    } else if (prev !== 'active' && nextState === 'active') {
      this.suspended = false;
      this.onResume?.();
      logger.info('[BackgroundCoordinator] Resumed');
    }
  }

  isSuspended(): boolean {
    return this.suspended;
  }

  getAppState(): AppState {
    return this.appState;
  }

  destroy(): void {
    this.destroyed = true;
    this.onSuspend = null;
    this.onResume = null;
    logger.info('[BackgroundCoordinator] Destroyed');
  }
}
