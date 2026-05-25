type MockFactory<T> = () => T;
type MockEntry = { instance: unknown; factory: MockFactory<unknown> };

const registry = new Map<string, MockEntry>();

export const MockRegistry = {
  register<T>(key: string, factory: MockFactory<T>): T {
    if (registry.has(key)) {
      return registry.get(key)!.instance as T;
    }
    const instance = factory();
    registry.set(key, { instance, factory });
    return instance;
  },

  get<T>(key: string): T | undefined {
    return registry.get(key)?.instance as T | undefined;
  },

  reset(key?: string): void {
    if (key) {
      registry.delete(key);
    } else {
      registry.clear();
    }
  },

  resetAll(): void {
    registry.clear();
  },

  entries(): Map<string, MockEntry> {
    return new Map(registry);
  },
};
