const activeSubscriptions = new Set<() => void>();

export function trackUnsubscribe(unsubscribe: () => void): void {
  activeSubscriptions.add(unsubscribe);
}

export function runAllCleanups(): void {
  activeSubscriptions.forEach(cleanup => {
    try {
      cleanup();
    } catch {
      // Silently handle cleanup errors in tests
    }
  });
  activeSubscriptions.clear();
}

export function getActiveSubscriptionCount(): number {
  return activeSubscriptions.size;
}

export function assertAllSubscriptionsCleaned(): void {
  const count = getActiveSubscriptionCount();
  if (count > 0) {
    throw new Error(`${count} subscription(s) were not cleaned up`);
  }
}
