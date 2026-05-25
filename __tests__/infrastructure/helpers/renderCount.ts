export class RenderCounter {
  private counters = new Map<string, number>();
  private active = false;

  enable(): void {
    this.active = true;
  }

  disable(): void {
    this.active = false;
  }

  increment(key: string): void {
    if (!this.active) return;
    this.counters.set(key, (this.counters.get(key) ?? 0) + 1);
  }

  getCount(key: string): number {
    return this.counters.get(key) ?? 0;
  }

  reset(key?: string): void {
    if (key) {
      this.counters.delete(key);
    } else {
      this.counters.clear();
    }
  }

  snapshot(): Record<string, number> {
    return Object.fromEntries(this.counters);
  }
}

export const renderCounter = new RenderCounter();

export function createRenderCounterHook<TProps = Record<string, unknown>>(
  componentName: string,
): (props: TProps) => void {
  return () => {
    renderCounter.increment(componentName);
  };
}
