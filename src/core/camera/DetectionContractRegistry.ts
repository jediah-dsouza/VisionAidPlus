import { logger } from '../debug';
import type { DetectionType, DetectionContract } from './types';

interface ContractEntry {
  type: DetectionType;
  contract: DetectionContract;
  registeredAt: number;
  version: number;
}

export class DetectionContractRegistry {
  private contracts: Map<string, ContractEntry> = new Map();
  private destroyed = false;
  private version = 0;

  register(detection: DetectionContract): boolean {
    if (this.destroyed) return false;
    const key = `${detection.type}:${detection.id}`;
    if (this.contracts.has(key)) return false;
    this.version++;
    this.contracts.set(key, {
      type: detection.type,
      contract: detection,
      registeredAt: Date.now(),
      version: this.version,
    });
    return true;
  }

  lookup(id: string): DetectionContract | null {
    if (this.destroyed) return null;
    for (const entry of this.contracts.values()) {
      if (entry.contract.id === id) return entry.contract;
    }
    return null;
  }

  lookupByType(type: DetectionType): DetectionContract[] {
    if (this.destroyed) return [];
    return Array.from(this.contracts.values())
      .filter(e => e.type === type)
      .map(e => e.contract);
  }

  remove(id: string): boolean {
    if (this.destroyed) return false;
    for (const [key, entry] of this.contracts.entries()) {
      if (entry.contract.id === id) {
        this.contracts.delete(key);
        return true;
      }
    }
    return false;
  }

  getRecent(limit: number = 20): DetectionContract[] {
    if (this.destroyed) return [];
    return Array.from(this.contracts.values())
      .sort((a, b) => b.registeredAt - a.registeredAt)
      .slice(0, limit)
      .map(e => e.contract);
  }

  getCount(): number {
    return this.contracts.size;
  }

  clear(): void {
    this.contracts.clear();
  }

  destroy(): void {
    this.destroyed = true;
    this.clear();
    logger.info('[DetectionContractRegistry] Destroyed');
  }
}
