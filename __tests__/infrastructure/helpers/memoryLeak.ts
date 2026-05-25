export interface LeakReport {
  leakedTimers: number;
  leakedIntervals: number;
  leakedSubscriptions: number;
  hasLeaks: boolean;
}

const timerRegistry = new Map<string, ReturnType<typeof setTimeout>>();
const intervalRegistry = new Map<string, ReturnType<typeof setInterval>>();

export function trackTimer(key: string, timer: ReturnType<typeof setTimeout>): void {
  timerRegistry.set(key, timer);
}

export function trackInterval(key: string, interval: ReturnType<typeof setInterval>): void {
  intervalRegistry.set(key, interval);
}

export function clearTrackedTimer(key: string): void {
  const timer = timerRegistry.get(key);
  if (timer) {
    clearTimeout(timer);
    timerRegistry.delete(key);
  }
}

export function clearTrackedInterval(key: string): void {
  const interval = intervalRegistry.get(key);
  if (interval) {
    clearInterval(interval);
    intervalRegistry.delete(key);
  }
}

export function clearAllTracked(): void {
  timerRegistry.forEach(t => clearTimeout(t));
  intervalRegistry.forEach(i => clearInterval(i));
  timerRegistry.clear();
  intervalRegistry.clear();
}

export function detectLeaks(): LeakReport {
  return {
    leakedTimers: timerRegistry.size,
    leakedIntervals: intervalRegistry.size,
    leakedSubscriptions: 0,
    hasLeaks: timerRegistry.size > 0 || intervalRegistry.size > 0,
  };
}

export function assertNoLeaks(): void {
  const report = detectLeaks();
  if (report.hasLeaks) {
    throw new Error(
      `Memory leak detected: ${report.leakedTimers} timers, ${report.leakedIntervals} intervals, ` +
      `${report.leakedSubscriptions} subscriptions`,
    );
  }
}
