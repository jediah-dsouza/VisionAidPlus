type TimerMap = Map<string, ReturnType<typeof setTimeout>>;

export class FakeTimerStrategy {
  private timers: TimerMap = new Map();
  private originalSetTimeout: typeof global.setTimeout | null = null;
  private originalSetInterval: typeof global.setInterval | null = null;
  private originalClearTimeout: typeof global.clearTimeout | null = null;
  private originalClearInterval: typeof global.clearInterval | null = null;
  private active = false;

  install(): void {
    if (this.active) return;
    jest.useFakeTimers();
    this.active = true;
  }

  uninstall(): void {
    if (!this.active) return;
    jest.useRealTimers();
    this.active = false;
    this.timers.clear();
  }

  get isActive(): boolean {
    return this.active;
  }

  track(key: string, timer: ReturnType<typeof setTimeout>): void {
    const existing = this.timers.get(key);
    if (existing) clearTimeout(existing);
    this.timers.set(key, timer);
  }

  clear(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  clearAll(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  advanceTime(ms: number): void {
    jest.advanceTimersByTime(ms);
  }

  runAllTimers(): void {
    jest.runAllTimers();
  }

  get trackedCount(): number {
    return this.timers.size;
  }

  hasPendingTimers(): boolean {
    return this.timers.size > 0;
  }

  reset(): void {
    this.clearAll();
    if (this.active) {
      jest.clearAllTimers();
    }
  }
}

export const fakeTimerStrategy = new FakeTimerStrategy();
