import { eventBus, EVENTS, EventPriority } from '@core/events/EventBus';
import { store } from '@app/store';
import { bleActions } from '@app/store/slices/bleSlice';
import { aiActions } from '@app/store/slices/aiSlice';
import { emergencyActions } from '@app/store/slices/emergencySlice';
import { EMERGENCY_EVENTS } from '@core/emergency';
import type { BLEDevice } from '@core/ble';

interface DashboardEventMap {
  [EVENTS.BLE_DEVICE_CONNECTED]: { deviceId: string; deviceName: string; rssi?: number };
  [EVENTS.BLE_DEVICE_DISCONNECTED]: Record<string, never>;
  [EVENTS.BLE_DEVICE_RECONNECTING]: { deviceId: string; attempt: number; maxAttempts: number };
  [EVENTS.BLE_SIGNAL_WEAK]: { rssi: number };
  [EVENTS.BLE_ERROR]: { error: string; deviceId?: string; code?: number };
  [EVENTS.LOW_BATTERY_WARNING]: { level?: number; chargingStatus?: string; state?: string };
  [EVENTS.AI_OBSTACLE_DETECTED]: {
    type: string;
    distance: number;
    direction: string;
    severity: string;
    voiceInstruction: string;
    timestamp: string;
  };
  [EVENTS.AI_DANGER_DETECTED]: {
    type: string;
    distance: number;
    direction: string;
    severity: string;
    voiceInstruction: string;
    timestamp: string;
  };
  [EVENTS.AI_ERROR]: { error: string };
  [EVENTS.EMERGENCY_TRIGGERED]: Record<string, never>;
  [EVENTS.EMERGENCY_CANCELLED]: Record<string, never>;
  [EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_STARTED]: { duration: number; startedAt: number };
  [EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_TICK]: { remaining: number; elapsed: number };
  [EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_CANCELLED]: { remaining: number; cancelledAt: number };
  [EMERGENCY_EVENTS.EMERGENCY_SENDING]: { contactCount: number; timestamp: number };
  [EMERGENCY_EVENTS.EMERGENCY_SEND_SUCCESS]: { contactId: string; method: string };
  [EMERGENCY_EVENTS.EMERGENCY_SEND_FAILED]: { contactId: string; error: string; method: string };
  [EMERGENCY_EVENTS.EMERGENCY_ESCALATED]: { attempt: number; timestamp: number };
  [EMERGENCY_EVENTS.EMERGENCY_RESOLVED]: { resolvedAt: number; duration: number };
  [EMERGENCY_EVENTS.EMERGENCY_RECOVERY]: { timestamp: number };
}

type EventKey = keyof DashboardEventMap;

class DashboardEventMiddleware {
  private subscriptions: Map<string, () => void> = new Map();
  private isInitialized = false;

  initialize(): void {
    if (this.isInitialized) {
      if (__DEV__) console.log('[DashboardMiddleware] Already initialized, skipping');
      return;
    }

    if (__DEV__) {
      const mwStoreId = (store as any).__REDUX_STORE_ID__;
      const mwGlobalStore = (globalThis as any).__VISIONAID_STORE__;
      console.log('[DashboardMiddleware] 🌟 Initializing Dashboard Event Middleware');
      console.log(`[DashboardMiddleware] 🔑 Store ID: ${mwStoreId}`);
      console.log(`[DashboardMiddleware]   store === globalThis.__VISIONAID_STORE__: ${store === mwGlobalStore}`);
      console.log(`[DashboardMiddleware]   Current EventBus subscriptions before init:`, Array.from(eventBus['subscriptions'].keys()));
    }

    this.subscribeToBLEEvents();
    this.subscribeToAIEvents();
    this.subscribeToEmergencyEvents();

    if (__DEV__) {
      console.log('[DashboardMiddleware] Current EventBus subscriptions after init:', Array.from(eventBus['subscriptions'].keys()));
    }
    this.isInitialized = true;
  }

  private subscribeToBLEEvents(): void {
    if (__DEV__) console.log('[DashboardMiddleware] Initializing BLE event subscriptions');

    const bleHandlers: Array<{
      event: string;
      handler: (payload: unknown) => void;
      priority: EventPriority;
    }> = [
      {
        event: EVENTS.BLE_DEVICE_CONNECTED,
        handler: payload => {
          if (__DEV__) console.log('[DashboardMiddleware] 📡 BLE_DEVICE_CONNECTED received:', payload);
          const data = payload as DashboardEventMap[typeof EVENTS.BLE_DEVICE_CONNECTED];
          if (data.deviceId) {
            store.dispatch(bleActions.setConnected({ id: data.deviceId, name: data.deviceName || data.deviceId, rssi: data.rssi }));
          }
        },
        priority: 'high',
      },
      {
        event: EVENTS.BLE_DEVICE_DISCONNECTED,
        handler: () => {
          if (__DEV__) console.log('[DashboardMiddleware] 📡 BLE_DEVICE_DISCONNECTED received');
          store.dispatch(bleActions.setConnected(null));
        },
        priority: 'high',
      },
      {
        event: EVENTS.BLE_SIGNAL_WEAK,
        handler: payload => {
          if (__DEV__) console.log('[DashboardMiddleware] 📡 BLE_SIGNAL_WEAK received:', payload);
          const data = payload as DashboardEventMap[typeof EVENTS.BLE_SIGNAL_WEAK];
          store.dispatch(bleActions.setSignalStrength(data.rssi));
        },
        priority: 'normal',
      },
      {
        event: EVENTS.BLE_ERROR,
        handler: payload => {
          const data = payload as DashboardEventMap[typeof EVENTS.BLE_ERROR];
          store.dispatch(bleActions.setConnectionState('error'));
          store.dispatch(bleActions.setError(data.error));
        },
        priority: 'high',
      },
      {
        event: EVENTS.LOW_BATTERY_WARNING,
        handler: payload => {
          const data = payload as DashboardEventMap[typeof EVENTS.LOW_BATTERY_WARNING];
          if (data.level !== undefined) {
            store.dispatch(bleActions.setBatteryLevel(data.level));
          }
          if (data.chargingStatus) {
            store.dispatch(bleActions.setChargingStatus(data.chargingStatus as 'charging' | 'discharging' | 'full'));
          }
          if (__DEV__) console.log('[DashboardMiddleware] 📡 LOW_BATTERY_WARNING received:', payload);
        },
        priority: 'high',
      },
      {
        event: EVENTS.BLE_DEVICE_RECONNECTING,
        handler: payload => {
          const data = payload as DashboardEventMap[typeof EVENTS.BLE_DEVICE_RECONNECTING];
          store.dispatch(bleActions.setConnectionState('reconnecting'));
          store.dispatch(bleActions.setReconnectAttempts(data.attempt));
          if (__DEV__) console.log('[DashboardMiddleware] 📡 BLE_DEVICE_RECONNECTING received:', payload);
        },
        priority: 'high',
      },
    ];

    bleHandlers.forEach(({ event, handler, priority }) => {
      if (__DEV__) console.log(`[DashboardMiddleware] Subscribing to ${event}`);
      const unsubscribe = eventBus.subscribe(event, handler, priority);
      this.subscriptions.set(event, unsubscribe);
    });
  }

  private subscribeToAIEvents(): void {
    if (__DEV__) console.log('[DashboardMiddleware] Initializing AI event subscriptions');

    const aiHandlers: Array<{
      event: string;
      handler: (payload: unknown) => void;
      priority: EventPriority;
    }> = [
      {
        event: EVENTS.AI_OBSTACLE_DETECTED,
        handler: payload => {
          if (__DEV__) console.log('[DashboardMiddleware] 📡 AI_OBSTACLE_DETECTED received:', payload);
          const data = payload as DashboardEventMap[typeof EVENTS.AI_OBSTACLE_DETECTED];
          store.dispatch(aiActions.setStatus('detecting'));
          store.dispatch(
            aiActions.setCurrentObstacle({
              type: data.type,
              distance: data.distance,
              direction: data.direction as 'left' | 'center' | 'right',
              severity: data.severity as 'safe' | 'caution' | 'danger',
              voiceInstruction: data.voiceInstruction,
              timestamp: data.timestamp,
            }),
          );
        },
        priority: 'normal',
      },
      {
        event: EVENTS.AI_DANGER_DETECTED,
        handler: payload => {
          if (__DEV__) console.log('[DashboardMiddleware] 📡 AI_DANGER_DETECTED received:', payload);
          const data = payload as DashboardEventMap[typeof EVENTS.AI_DANGER_DETECTED];
          store.dispatch(aiActions.setStatus('danger'));
          store.dispatch(
            aiActions.setCurrentObstacle({
              type: data.type,
              distance: data.distance,
              direction: data.direction as 'left' | 'center' | 'right',
              severity: data.severity as 'safe' | 'caution' | 'danger',
              voiceInstruction: data.voiceInstruction,
              timestamp: data.timestamp,
            }),
          );
        },
        priority: 'critical',
      },
      {
        event: EVENTS.AI_ERROR,
        handler: payload => {
          const data = payload as DashboardEventMap[typeof EVENTS.AI_ERROR];
          store.dispatch(aiActions.setError(data.error));
        },
        priority: 'high',
      },
    ];

    aiHandlers.forEach(({ event, handler, priority }) => {
      if (__DEV__) console.log(`[DashboardMiddleware] Subscribing to ${event}`);
      const unsubscribe = eventBus.subscribe(event, handler, priority);
      this.subscriptions.set(event, unsubscribe);
    });
  }

  private subscribeToEmergencyEvents(): void {
    if (__DEV__) console.log('[DashboardMiddleware] Initializing Emergency event subscriptions');

    const emergencyHandlers: Array<{
      event: string;
      handler: (payload: unknown) => void;
      priority: EventPriority;
    }> = [
      {
        event: EVENTS.EMERGENCY_TRIGGERED,
        handler: () => {
          store.dispatch(emergencyActions.triggerEmergency(undefined));
          store.dispatch(emergencyActions.setSending());
        },
        priority: 'critical',
      },
      {
        event: EVENTS.EMERGENCY_CANCELLED,
        handler: () => {
          store.dispatch(emergencyActions.cancelEmergency());
        },
        priority: 'high',
      },
      {
        event: EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_STARTED,
        handler: (payload: unknown) => {
          const data = payload as DashboardEventMap[typeof EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_STARTED];
          store.dispatch(emergencyActions.startCountdown(data.duration));
        },
        priority: 'critical',
      },
      {
        event: EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_TICK,
        handler: (payload: unknown) => {
          const data = payload as DashboardEventMap[typeof EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_TICK];
          store.dispatch(emergencyActions.updateCountdown(data.remaining));
        },
        priority: 'high',
      },
      {
        event: EMERGENCY_EVENTS.EMERGENCY_SENDING,
        handler: () => {
          store.dispatch(emergencyActions.setSending());
        },
        priority: 'critical',
      },
      {
        event: EMERGENCY_EVENTS.EMERGENCY_SEND_SUCCESS,
        handler: () => {
          store.dispatch(emergencyActions.incrementContactsNotified(1));
        },
        priority: 'normal',
      },
      {
        event: EMERGENCY_EVENTS.EMERGENCY_SEND_FAILED,
        handler: () => {
          store.dispatch(emergencyActions.incrementContactsFailed(1));
        },
        priority: 'high',
      },
      {
        event: EMERGENCY_EVENTS.EMERGENCY_ESCALATED,
        handler: (payload: unknown) => {
          const data = payload as DashboardEventMap[typeof EMERGENCY_EVENTS.EMERGENCY_ESCALATED];
          store.dispatch(emergencyActions.setEscalationAttempts(data.attempt));
        },
        priority: 'critical',
      },
      {
        event: EMERGENCY_EVENTS.EMERGENCY_RESOLVED,
        handler: () => {
          store.dispatch(emergencyActions.saveSessionToHistory());
          store.dispatch(emergencyActions.resolveEmergency());
          setTimeout(() => {
            store.dispatch(emergencyActions.resetEmergency());
          }, 5000);
        },
        priority: 'high',
      },
      {
        event: EMERGENCY_EVENTS.EMERGENCY_RECOVERY,
        handler: () => {
          store.dispatch(emergencyActions.resetEmergency());
        },
        priority: 'normal',
      },
    ];

    emergencyHandlers.forEach(({ event, handler, priority }) => {
      if (__DEV__) console.log(`[DashboardMiddleware] Subscribing to ${event}`);
      const unsubscribe = eventBus.subscribe(event, handler, priority);
      this.subscriptions.set(event, unsubscribe);
    });
  }

  destroy(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
    this.isInitialized = false;
  }
}

export const dashboardEventMiddleware = new DashboardEventMiddleware();
