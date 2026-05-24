import { eventBus, EVENTS } from '../events/EventBus';

export const NAVIGATION_EVENTS = {
  OBSTACLE_DETECTED: 'LIVE_NAV_OBSTACLE_DETECTED',
  OBSTACLE_UPDATED: 'LIVE_NAV_OBSTACLE_UPDATED',
  OBSTACLE_REMOVED: 'LIVE_NAV_OBSTACLE_REMOVED',
  OBSTACLE_STALE: 'LIVE_NAV_OBSTACLE_STALE',
  GUIDANCE_ISSUED: 'LIVE_NAV_GUIDANCE_ISSUED',
  DANGER_ESCALATED: 'LIVE_NAV_DANGER_ESCALATED',
  DANGER_DEESCALATED: 'LIVE_NAV_DANGER_DEESCALATED',
  RADAR_SYNC: 'LIVE_NAV_RADAR_SYNC',
  NAVIGATION_STARTED: 'LIVE_NAV_STARTED',
  NAVIGATION_PAUSED: 'LIVE_NAV_PAUSED',
  NAVIGATION_RESUMED: 'LIVE_NAV_RESUMED',
  NAVIGATION_STOPPED: 'LIVE_NAV_STOPPED',
  ENVIRONMENT_CHANGED: 'LIVE_NAV_ENVIRONMENT_CHANGED',
  SENSITIVITY_CHANGED: 'LIVE_NAV_SENSITIVITY_CHANGED',
  POSITION_UPDATED: 'LIVE_NAV_POSITION_UPDATED',
  PERFORMANCE_REPORT: 'LIVE_NAV_PERFORMANCE_REPORT',
} as const;

export function subscribeToObstacleEvents(
  onDetected?: (payload: unknown) => void,
  onUpdated?: (payload: unknown) => void,
  onRemoved?: (payload: unknown) => void,
): () => void {
  const unsubscribes: Array<() => void> = [];

  if (onDetected) {
    unsubscribes.push(
      eventBus.subscribe(NAVIGATION_EVENTS.OBSTACLE_DETECTED, onDetected, 'high'),
    );
  }

  if (onUpdated) {
    unsubscribes.push(
      eventBus.subscribe(NAVIGATION_EVENTS.OBSTACLE_UPDATED, onUpdated, 'high'),
    );
  }

  if (onRemoved) {
    unsubscribes.push(
      eventBus.subscribe(NAVIGATION_EVENTS.OBSTACLE_REMOVED, onRemoved, 'normal'),
    );
  }

  return () => {
    for (const unsub of unsubscribes) {
      try { unsub(); } catch { }
    }
  };
}

export function subscribeToGuidanceEvents(
  onInstruction?: (payload: unknown) => void,
): () => void {
  if (!onInstruction) return () => {};

  return eventBus.subscribe(NAVIGATION_EVENTS.GUIDANCE_ISSUED, onInstruction, 'high');
}

export function subscribeToDangerEvents(
  onEscalated?: (payload: unknown) => void,
  onDeescalated?: (payload: unknown) => void,
): () => void {
  const unsubscribes: Array<() => void> = [];

  if (onEscalated) {
    unsubscribes.push(
      eventBus.subscribe(NAVIGATION_EVENTS.DANGER_ESCALATED, onEscalated, 'critical'),
    );
  }

  if (onDeescalated) {
    unsubscribes.push(
      eventBus.subscribe(NAVIGATION_EVENTS.DANGER_DEESCALATED, onDeescalated, 'high'),
    );
  }

  return () => {
    for (const unsub of unsubscribes) {
      try { unsub(); } catch { }
    }
  };
}

export function subscribeToNavigationLifecycle(
  onStarted?: (payload: unknown) => void,
  onPaused?: (payload: unknown) => void,
  onResumed?: (payload: unknown) => void,
  onStopped?: (payload: unknown) => void,
): () => void {
  const unsubscribes: Array<() => void> = [];

  if (onStarted) {
    unsubscribes.push(
      eventBus.subscribe(NAVIGATION_EVENTS.NAVIGATION_STARTED, onStarted, 'high'),
    );
  }

  if (onPaused) {
    unsubscribes.push(
      eventBus.subscribe(NAVIGATION_EVENTS.NAVIGATION_PAUSED, onPaused, 'normal'),
    );
  }

  if (onResumed) {
    unsubscribes.push(
      eventBus.subscribe(NAVIGATION_EVENTS.NAVIGATION_RESUMED, onResumed, 'normal'),
    );
  }

  if (onStopped) {
    unsubscribes.push(
      eventBus.subscribe(NAVIGATION_EVENTS.NAVIGATION_STOPPED, onStopped, 'high'),
    );
  }

  return () => {
    for (const unsub of unsubscribes) {
      try { unsub(); } catch { }
    }
  };
}
