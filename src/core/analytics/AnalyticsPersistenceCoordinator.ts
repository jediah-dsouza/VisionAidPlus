const DEBOUNCE_WRITE_MS = 5000;

interface PendingWrite {
  key: string;
  data: unknown;
  timestamp: number;
}

export class AnalyticsPersistenceCoordinator {
  private storage: Map<string, string> = new Map();
  private pendingWrites: Map<string, PendingWrite> = new Map();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  constructor() {
    console.log('[AnalyticsPersistence] Coordinator initialized');
  }

  async saveSnapshot(key: string, data: unknown): Promise<void> {
    if (this.destroyed) return;

    this.pendingWrites.set(key, { key, data, timestamp: Date.now() });
    this.scheduleFlush();
  }

  async loadSnapshot<T>(key: string): Promise<T | null> {
    if (this.destroyed) return null;

    const raw = this.storage.get(key);
    if (raw === undefined) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      console.warn(`[AnalyticsPersistence] Failed to parse snapshot for key: ${key}`);
      return null;
    }
  }

  async deleteSnapshot(key: string): Promise<void> {
    if (this.destroyed) return;
    this.storage.delete(key);
    this.pendingWrites.delete(key);
  }

  async clearAll(): Promise<void> {
    if (this.destroyed) return;
    this.storage.clear();
    this.pendingWrites.clear();
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    console.log('[AnalyticsPersistence] All data cleared');
  }

  private scheduleFlush(): void {
    if (this.debounceTimer !== null) return;

    this.debounceTimer = setTimeout(() => {
      this.flushPending();
    }, DEBOUNCE_WRITE_MS);
  }

  private flushPending(): void {
    if (this.destroyed) return;

    this.debounceTimer = null;

    for (const [key, write] of this.pendingWrites) {
      try {
        const serialized = JSON.stringify(write.data);
        this.storage.set(key, serialized);
        console.log(`[AnalyticsPersistence] Saved snapshot: ${key} (${serialized.length} bytes)`);
      } catch (error) {
        console.error(`[AnalyticsPersistence] Failed to serialize snapshot for key: ${key}`, error);
      }
    }

    this.pendingWrites.clear();
  }

  async flushNow(): Promise<void> {
    this.flushPending();
  }

  get storageSize(): number {
    let total = 0;
    for (const [, value] of this.storage) {
      total += value.length;
    }
    return total;
  }

  destroy(): void {
    this.destroyed = true;
    this.flushPending();
    this.storage.clear();
    this.pendingWrites.clear();
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    console.log('[AnalyticsPersistence] Destroyed');
  }
}
