import { eventBus, EVENTS, EventPriority } from '@core/events/EventBus';
import { store } from '@app/store';
import { bleActions } from '@app/store/slices/bleSlice';
import { aiActions } from '@app/store/slices/aiSlice';
import { emergencyActions } from '@app/store/slices/emergencySlice';
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
}

type EventKey = keyof DashboardEventMap;

class DashboardEventMiddleware {
  private subscriptions: Map<string, () => void> = new Map();
  private isInitialized = false;

  initialize(): void {
    if (this.isInitialized) {
      console.log('[DashboardMiddleware] Already initialized, skipping');
      return;
    }

    // [DIAGNOSTIC] Store identity at middleware init
    const mwStoreId = (store as any).__REDUX_STORE_ID__;
    const mwGlobalStore = (globalThis as any).__VISIONAID_STORE__;
    console.log('[DashboardMiddleware] 🌟 Initializing Dashboard Event Middleware');
    console.log(`[DashboardMiddleware] 🔑 Store ID: ${mwStoreId}`);
    console.log(`[DashboardMiddleware]   store === globalThis.__VISIONAID_STORE__: ${store === mwGlobalStore}`);
    console.log(`[DashboardMiddleware]   store.dispatch: ${typeof store.dispatch}`);
    console.log(`[DashboardMiddleware]   store.subscribe: ${typeof store.subscribe}`);
    console.log('[DashboardMiddleware] Current EventBus subscriptions before init:', Array.from(eventBus['subscriptions'].keys()));

    this.subscribeToBLEEvents();
    this.subscribeToAIEvents();
    this.subscribeToEmergencyEvents();

    console.log('[DashboardMiddleware] Current EventBus subscriptions after init:', Array.from(eventBus['subscriptions'].keys()));
    this.isInitialized = true;
  }

  private subscribeToBLEEvents(): void {
    console.log('[DashboardMiddleware] Initializing BLE event subscriptions');

    const bleHandlers: Array<{
      event: string;
      handler: (payload: unknown) => void;
      priority: EventPriority;
    }> = [
      {
        event: EVENTS.BLE_DEVICE_CONNECTED,
        handler: payload => {
          console.log('[DashboardMiddleware] 📡 BLE_DEVICE_CONNECTED received:', payload);
          const data = payload as DashboardEventMap[typeof EVENTS.BLE_DEVICE_CONNECTED];
          if (data.deviceId) {
            store.dispatch(bleActions.setConnectionState('connected'));
            store.dispatch(bleActions.setStatus('connected'));
            store.dispatch(bleActions.setConnectedDevice({ id: data.deviceId, name: data.deviceName || data.deviceId }));
            if (data.rssi) {
              store.dispatch(bleActions.setSignalStrength(data.rssi));
            }
            store.dispatch(bleActions.setScanning(false));
          }
          console.log('[DashboardMiddleware] ✅ Dispatched BLE connected actions');
        },
        priority: 'high',
      },
      {
        event: EVENTS.BLE_DEVICE_DISCONNECTED,
        handler: () => {
          console.log('[DashboardMiddleware] 📡 BLE_DEVICE_DISCONNECTED received');
          store.dispatch(bleActions.setConnectionState('disconnected'));
          store.dispatch(bleActions.setStatus('disconnected'));
          store.dispatch(bleActions.setConnectedDevice(null));
          store.dispatch(bleActions.setSignalStrength(-127));
          store.dispatch(bleActions.setScanning(false));
          console.log('[DashboardMiddleware] ✅ Dispatched BLE disconnected actions');
        },
        priority: 'high',
      },
      {
        event: EVENTS.BLE_SIGNAL_WEAK,
        handler: payload => {
          console.log('[DashboardMiddleware] 📡 BLE_SIGNAL_WEAK received:', payload);
          const data = payload as DashboardEventMap[typeof EVENTS.BLE_SIGNAL_WEAK];
          store.dispatch(bleActions.setSignalStrength(data.rssi));
          console.log('[DashboardMiddleware] ✅ Dispatched BLE signal actions');
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
          console.log('[DashboardMiddleware] 📡 LOW_BATTERY_WARNING received:', payload);
        },
        priority: 'high',
      },
      {
        event: EVENTS.BLE_DEVICE_RECONNECTING,
        handler: payload => {
          const data = payload as DashboardEventMap[typeof EVENTS.BLE_DEVICE_RECONNECTING];
          store.dispatch(bleActions.setConnectionState('reconnecting'));
          store.dispatch(bleActions.setReconnectAttempts(data.attempt));
          store.dispatch(bleActions.setStatus('reconnecting'));
          console.log('[DashboardMiddleware] 📡 BLE_DEVICE_RECONNECTING received:', payload);
        },
        priority: 'high',
      },
    ];

    bleHandlers.forEach(({ event, handler, priority }) => {
      console.log(`[DashboardMiddleware] Subscribing to ${event}`);
      const unsubscribe = eventBus.subscribe(event, handler, priority);
      this.subscriptions.set(event, unsubscribe);
    });
  }

  private subscribeToAIEvents(): void {
    console.log('[DashboardMiddleware] Initializing AI event subscriptions');

    const aiHandlers: Array<{
      event: string;
      handler: (payload: unknown) => void;
      priority: EventPriority;
    }> = [
      {
        event: EVENTS.AI_OBSTACLE_DETECTED,
        handler: payload => {
          console.log('[DashboardMiddleware] 📡 AI_OBSTACLE_DETECTED received:', payload);
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
          console.log('[DashboardMiddleware] ✅ Dispatched AI obstacle actions');
        },
        priority: 'normal',
      },
      {
        event: EVENTS.AI_DANGER_DETECTED,
        handler: payload => {
          console.log('[DashboardMiddleware] 📡 AI_DANGER_DETECTED received:', payload);
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
          console.log('[DashboardMiddleware] ✅ Dispatched AI danger actions');
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
      console.log(`[DashboardMiddleware] Subscribing to ${event}`);
      const unsubscribe = eventBus.subscribe(event, handler, priority);
      this.subscriptions.set(event, unsubscribe);
    });
  }

  private subscribeToEmergencyEvents(): void {
    console.log('[DashboardMiddleware] Initializing Emergency event subscriptions');

    const emergencyHandlers: Array<{
      event: string;
      handler: (payload: unknown) => void;
      priority: EventPriority;
    }> = [
      {
        event: EVENTS.EMERGENCY_TRIGGERED,
        handler: () => {
          console.log('[DashboardMiddleware] 📡 EMERGENCY_TRIGGERED received');
          store.dispatch(emergencyActions.startCountdown(5));
          console.log('[DashboardMiddleware] ✅ Dispatched emergency trigger actions');
        },
        priority: 'critical',
      },
      {
        event: EVENTS.EMERGENCY_CANCELLED,
        handler: () => {
          console.log('[DashboardMiddleware] 📡 EMERGENCY_CANCELLED received');
          store.dispatch(emergencyActions.cancelEmergency());
          console.log('[DashboardMiddleware] ✅ Dispatched emergency cancel actions');
        },
        priority: 'high',
      },
    ];

    emergencyHandlers.forEach(({ event, handler, priority }) => {
      console.log(`[DashboardMiddleware] Subscribing to ${event}`);
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
