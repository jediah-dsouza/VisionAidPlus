import { AppState, type AppStateStatus } from 'react-native';
import { logger } from '../debug';

export type NetworkStatus = 'unknown' | 'online' | 'offline';

type NetworkListener = (status: NetworkStatus) => void;

export class NetworkMonitor {
  private status: NetworkStatus = 'unknown';
  private listeners: Set<NetworkListener> = new Set();
  private appStateSubscription: { remove: () => void } | null = null;
  private destroyed = false;

  get currentStatus(): NetworkStatus {
    return this.status;
  }

  get isOnline(): boolean {
    return this.status === 'online';
  }

  get isOffline(): boolean {
    return this.status === 'offline';
  }

  initialize(): void {
    if (this.destroyed) return;

    this.appStateSubscription = AppState.addEventListener('change', this.handleAppState);
    logger.debug('[NetworkMonitor] Initialized');
  }

  updateStatus(status: NetworkStatus): void {
    if (this.destroyed || status === this.status) return;

    const prev = this.status;
    this.status = status;
    logger.info(`[NetworkMonitor] Status: ${prev} → ${status}`);

    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        logger.error('[NetworkMonitor] Listener error:', error);
      }
    });
  }

  addListener(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private handleAppState = (nextState: AppStateStatus): void => {
    if (nextState === 'active') {
      this.updateStatus('online');
    }
  };

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    this.listeners.clear();
    logger.debug('[NetworkMonitor] Destroyed');
  }
}

export const networkMonitor = new NetworkMonitor();
