import { eventBus, EVENTS } from '../../../src/core/events/EventBus';

type EventPayload = Record<string, unknown>;

export class EventBusTestHarness {
  private capturedEvents: Array<{ event: string; payload: unknown; timestamp: number }> = [];
  private unsubscribers: Array<() => void> = [];
  private recording = false;

  startRecording(): void {
    if (this.recording) return;
    this.recording = true;
    this.capturedEvents = [];

    for (const event of Object.values(EVENTS)) {
      const unsub = eventBus.subscribe(event, (payload: unknown) => {
        this.capturedEvents.push({ event, payload, timestamp: Date.now() });
      });
      this.unsubscribers.push(unsub);
    }
  }

  stopRecording(): void {
    this.recording = false;
    this.unsubscribers.forEach(unsub => {
      try { unsub(); } catch { /* already cleaned up */ }
    });
    this.unsubscribers = [];
  }

  getEvents(event?: string): Array<{ event: string; payload: unknown; timestamp: number }> {
    if (event) {
      return this.capturedEvents.filter(e => e.event === event);
    }
    return [...this.capturedEvents];
  }

  getEventCount(event?: string): number {
    return this.getEvents(event).length;
  }

  getLatestPayload<T = EventPayload>(event?: string): T | null {
    const events = this.getEvents(event);
    return events.length > 0 ? (events[events.length - 1].payload as T) : null;
  }

  wasEventPublished(event: string): boolean {
    return this.capturedEvents.some(e => e.event === event);
  }

  clearEvents(): void {
    this.capturedEvents = [];
  }

  destroy(): void {
    this.stopRecording();
    this.capturedEvents = [];
  }
}

export function createEventBusSpy(): {
  handler: jest.Mock;
  clear: () => void;
} {
  const handler = jest.fn();
  return {
    handler,
    clear: () => handler.mockClear(),
  };
}
