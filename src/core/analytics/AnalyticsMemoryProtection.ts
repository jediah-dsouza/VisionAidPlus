interface EngineBudget {
  budget: number;
  usage: number;
}

const DEFAULT_GLOBAL_BUDGET = 4 * 1024 * 1024;

export type PruneHandler = (engineName: string, overage: number) => void;

export class AnalyticsMemoryProtection {
  private engines: Map<string, EngineBudget> = new Map();
  private globalBudget: number;
  private destroyed = false;
  public onPrune: PruneHandler | null = null;

  constructor(globalBudget: number = DEFAULT_GLOBAL_BUDGET) {
    this.globalBudget = globalBudget;
    console.log(
      `[AnalyticsMemory] Created with global budget: ${this.formatBytes(globalBudget)}`,
    );
  }

  registerEngine(name: string, budget: number): void {
    if (this.destroyed) return;

    if (this.engines.has(name)) {
      console.warn(`[AnalyticsMemory] Engine "${name}" already registered, updating budget`);
    }

    this.engines.set(name, { budget, usage: 0 });
    console.log(
      `[AnalyticsMemory] Registered engine "${name}" with budget: ${this.formatBytes(budget)}`,
    );
  }

  updateUsage(name: string, bytes: number): void {
    if (this.destroyed) return;

    const entry = this.engines.get(name);
    if (!entry) {
      console.warn(`[AnalyticsMemory] Unknown engine "${name}", cannot update usage`);
      return;
    }

    entry.usage = bytes;

    if (entry.usage > entry.budget) {
      const overage = entry.usage - entry.budget;
      console.warn(
        `[AnalyticsMemory] Engine "${name}" over budget by ${this.formatBytes(overage)} ` +
          `(usage: ${this.formatBytes(entry.usage)} / budget: ${this.formatBytes(entry.budget)})`,
      );

      if (this.onPrune) {
        try {
          this.onPrune(name, overage);
        } catch (error) {
          console.error('[AnalyticsMemory] Prune handler error:', error);
        }
      }
    }
  }

  isOverBudget(name: string): boolean {
    if (this.destroyed) return false;

    const entry = this.engines.get(name);
    if (!entry) return false;

    return entry.usage > entry.budget;
  }

  getGlobalUsage(): number {
    let total = 0;
    this.engines.forEach(entry => {
      total += entry.usage;
    });
    return total;
  }

  getEnginesOverBudget(): string[] {
    const over: string[] = [];
    this.engines.forEach((entry, name) => {
      if (entry.usage > entry.budget) {
        over.push(name);
      }
    });
    return over;
  }

  prune(): void {
    if (this.destroyed) return;

    console.log('[AnalyticsMemory] Running global prune');

    const totalUsage = this.getGlobalUsage();
    if (totalUsage <= this.globalBudget) {
      console.log('[AnalyticsMemory] No pruning needed');
      return;
    }

    const overage = totalUsage - this.globalBudget;
    console.log(
      `[AnalyticsMemory] Over global budget by ${this.formatBytes(overage)} ` +
        `(usage: ${this.formatBytes(totalUsage)} / budget: ${this.formatBytes(this.globalBudget)})`,
    );

    this.engines.forEach((entry, name) => {
      if (this.onPrune && entry.usage > entry.budget) {
        try {
          this.onPrune(name, entry.usage - entry.budget);
        } catch (error) {
          console.error('[AnalyticsMemory] Prune handler error:', error);
        }
      }
    });
  }

  getBudget(name: string): number | undefined {
    return this.engines.get(name)?.budget;
  }

  getUsage(name: string): number | undefined {
    return this.engines.get(name)?.usage;
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  destroy(): void {
    this.destroyed = true;
    this.engines.clear();
    this.onPrune = null;
    console.log('[AnalyticsMemory] Destroyed');
  }
}

export const analyticsMemoryProtection = new AnalyticsMemoryProtection();
