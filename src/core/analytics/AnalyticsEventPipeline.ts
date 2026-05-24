import type { AnalyticsEvent } from './types';

type PipelineHandler = (event: AnalyticsEvent) => void;

let pipelineIdCounter = 0;

export class AnalyticsEventPipeline {
  private handlers: Set<PipelineHandler> = new Set();
  private sequence = 0;
  private destroyed = false;
  private id: number;

  constructor() {
    pipelineIdCounter++;
    this.id = pipelineIdCounter;
    console.log(`[AnalyticsPipeline] Pipeline ${this.id} created`);
  }

  ingest(event: Omit<AnalyticsEvent, 'id' | 'sequence'>): void {
    if (this.destroyed) {
      console.warn('[AnalyticsPipeline] Cannot ingest on destroyed pipeline');
      return;
    }

    const id = `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    this.sequence++;

    const enriched: AnalyticsEvent = {
      ...event,
      id,
      sequence: this.sequence,
    };

    console.log(
      `[AnalyticsPipeline] Ingesting event #${this.sequence} type=${enriched.eventType} cat=${enriched.category}`,
    );

    this.handlers.forEach(handler => {
      try {
        handler(enriched);
      } catch (error) {
        console.error('[AnalyticsPipeline] Handler error:', error);
      }
    });
  }

  subscribe(handler: PipelineHandler): () => void {
    this.handlers.add(handler);
    console.log(`[AnalyticsPipeline] Handler subscribed (${this.handlers.size} total)`);

    return () => {
      this.handlers.delete(handler);
      console.log(`[AnalyticsPipeline] Handler unsubscribed (${this.handlers.size} remaining)`);
    };
  }

  get currentSequence(): number {
    return this.sequence;
  }

  destroy(): void {
    this.destroyed = true;
    this.handlers.clear();
    this.sequence = 0;
    console.log(`[AnalyticsPipeline] Pipeline ${this.id} destroyed`);
  }
}

export const analyticsEventPipeline = new AnalyticsEventPipeline();
