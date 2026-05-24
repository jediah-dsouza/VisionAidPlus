/**
 * DevSimulationEngine - Phase 6 Dashboard Validation Harness
 *
 * TEMPORARY DEVELOPMENT TESTING SYSTEM
 * - ONLY ACTIVE IN __DEV__ MODE
 * - NEVER INCLUDED IN PRODUCTION BUILDS
 */

import { eventBus, EVENTS, EventPriority } from '@core/events/EventBus';
import { store } from '@app/store';
import { bleActions } from '@app/store/slices/bleSlice';
import { aiActions } from '@app/store/slices/aiSlice';
import { emergencyActions } from '@app/store/slices/emergencySlice';
import {
  emergencyManager,
  emergencyCountdownManager,
  emergencyContactManager,
  emergencyGPSPipeline,
  emergencySMSPipeline,
  EMERGENCY_EVENTS,
} from '@core/emergency';
import { accessibilityEngine } from '@core/accessibility';
import { blePacketParser, BLE_CHARACTERISTIC_UUIDS } from '@core/ble';
import { devPacketMonitor } from './DevPacketMonitor';
import type { ObstacleDetection } from '@shared/types';

const IS_DEV = __DEV__;

// ============================================================================
// INTERFACES
// ============================================================================
export interface SimulationEvent {
  id: string;
  timestamp: Date;
  eventName: string;
  eventBusPublish: 'pending' | 'success' | 'failed';
  middlewareProcessed: 'pending' | 'success' | 'failed' | 'skipped';
  reduxUpdated: 'pending' | 'success' | 'failed' | 'skipped';
  accessibilityAnnounced: 'pending' | 'success' | 'failed' | 'skipped';
  uiRendered: boolean;
  payload: unknown;
}

export interface SimulationMetrics {
  totalEvents: number;
  droppedEvents: number;
  averageLatency: number;
  activeListeners: number;
  renderCount: number;
  lastEventTime: Date | null;
}

// ============================================================================
// SIMULATION ENGINE
// ============================================================================
class DevSimulationEngine {
  private eventLog: SimulationEvent[] = [];
  private maxLogSize = 100;
  private metrics: SimulationMetrics = {
    totalEvents: 0,
    droppedEvents: 0,
    averageLatency: 0,
    activeListeners: 0,
    renderCount: 0,
    lastEventTime: null,
  };
  private stressTestInterval: ReturnType<typeof setInterval> | null = null;
  private isStressTesting = false;

  // ========================================================================
  // METRICS
  // ========================================================================
  getMetrics(): SimulationMetrics {
    return { ...this.metrics, activeListeners: eventBus.getQueue().length };
  }

  incrementRenderCount(): void {
    this.metrics.renderCount++;
  }

  private updateLatency(latency: number): void {
    if (this.metrics.totalEvents === 0) {
      this.metrics.averageLatency = latency;
    } else {
      this.metrics.averageLatency =
        (this.metrics.averageLatency * (this.metrics.totalEvents - 1) + latency) / this.metrics.totalEvents;
    }
  }

  // ========================================================================
  // EVENT LOGGING
  // ========================================================================
  private createEventLogEntry(eventName: string, payload: unknown): SimulationEvent {
    return {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
      eventName,
      eventBusPublish: 'pending',
      middlewareProcessed: 'pending',
      reduxUpdated: 'pending',
      accessibilityAnnounced: 'pending',
      uiRendered: false,
      payload,
    };
  }

  private logEvent(entry: SimulationEvent): void {
    this.eventLog.unshift(entry);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.pop();
    }
    this.metrics.totalEvents++;
    this.metrics.lastEventTime = new Date();
  }

  private updateLogEntry(id: string, updates: Partial<SimulationEvent>): void {
    const index = this.eventLog.findIndex(e => e.id === id);
    if (index !== -1) {
      this.eventLog[index] = { ...this.eventLog[index], ...updates };
    }
  }

  getEventLog(): SimulationEvent[] {
    return [...this.eventLog];
  }

  clearEventLog(): void {
    this.eventLog = [];
    console.log('[DevSim] Event log cleared');
  }

  // ========================================================================
  // CORE SIMULATION - Single point of entry
  // ========================================================================
  private async simulate(
    eventName: string,
    payload: unknown,
    priority: EventPriority = 'normal',
    accessibilityMessage?: string,
    dispatchRedux?: () => void,
  ): Promise<void> {
    if (!IS_DEV) return;

    const startTime = Date.now();
    const entry = this.createEventLogEntry(eventName, payload);
    this.logEvent(entry);

    console.log(`[DevSim] 📡 Simulating: ${eventName}`);
    console.log(`[DevSim]   Payload:`, JSON.stringify(payload));

    // Step 0: Verify EventBus
    console.log(`[DevSim]   EventBus subscriptions:`, Array.from(eventBus['subscriptions'].keys()));

    // Step 1: Publish to EventBus
    try {
      console.log(`[DevSim]   → Publishing to EventBus: ${eventName}`);
      eventBus.publish(eventName, payload, priority);
      this.updateLogEntry(entry.id, { eventBusPublish: 'success' });
      console.log(`[DevSim]   ✅ EventBus published`);
    } catch (error) {
      this.updateLogEntry(entry.id, { eventBusPublish: 'failed' });
      console.error(`[DevSim]   ❌ EventBus failed:`, error);
      return;
    }

    // Step 2: Dispatch to Redux (middleware handles most, but simulation may need direct dispatch for non-standard events)
    try {
      if (dispatchRedux) {
        console.log(`[DevSim]   → Dispatching Redux actions`);
        dispatchRedux();
      }
      this.updateLogEntry(entry.id, { reduxUpdated: 'success' });
      console.log(`[DevSim]   ✅ Redux dispatched`);
      console.log(`[DevSim]   → Current Redux state ble.status:`, store.getState().ble.status);
    } catch (error) {
      this.updateLogEntry(entry.id, { reduxUpdated: 'failed' });
      console.error(`[DevSim]   ❌ Redux dispatch failed:`, error);
    }

    // Step 3: Accessibility announcement
    if (accessibilityMessage) {
      try {
        console.log(`[DevSim]   → Accessibility announce: ${accessibilityMessage}`);
        await accessibilityEngine.announce(accessibilityMessage, priority);
        this.updateLogEntry(entry.id, { accessibilityAnnounced: 'success' });
        console.log(`[DevSim]   ✅ Accessibility announced`);
      } catch (error) {
        this.updateLogEntry(entry.id, { accessibilityAnnounced: 'failed' });
        console.error(`[DevSim]   ❌ Accessibility failed:`, error);
      }
    } else {
      this.updateLogEntry(entry.id, { accessibilityAnnounced: 'skipped' });
    }

    // Step 4: UI Render confirmation (set to success after short delay)
    setTimeout(() => {
      this.updateLogEntry(entry.id, { uiRendered: true });
    }, 50);

    // Update metrics
    const latency = Date.now() - startTime;
    this.updateLatency(latency);
    console.log(`[DevSim]   ⏱️ Latency: ${latency}ms`);
  }

  // ========================================================================
  // BLE SIMULATIONS
  // ========================================================================
  simulateBLEConnect(): void {
    console.log('[DevSim] simulateBLEConnect() called');
    // [DIAGNOSTIC] Store identity in simulation
    const simStoreId = (store as any).__REDUX_STORE_ID__;
    const simGlobalStore = (globalThis as any).__VISIONAID_STORE__;
    console.log(`[DevSim] 🔑 Store ID: ${simStoreId}`);
    console.log(`[DevSim]   store === globalThis.__VISIONAID_STORE__: ${store === simGlobalStore}`);
    this.simulate(
      EVENTS.BLE_DEVICE_CONNECTED,
      { deviceId: 'vision-aid-001', deviceName: 'VisionAid Pro', rssi: -45 },
      'high',
      'Device connected: VisionAid Pro',
      () => {
        console.log('[DevSim] Redux dispatch callback executing...');
        store.dispatch(bleActions.setStatus('connected'));
        store.dispatch(bleActions.setConnectedDevice({ id: 'vision-aid-001', name: 'VisionAid Pro' }));
        store.dispatch(bleActions.setSignalStrength(-45));
        store.dispatch(bleActions.setBatteryLevel(85));
        console.log('[DevSim] Redux dispatch callback complete. State:', store.getState().ble.status);
      },
    );
  }

  simulateBLEDisconnect(): void {
    this.simulate(
      EVENTS.BLE_DEVICE_DISCONNECTED,
      { reason: 'user_initiated' },
      'high',
      'Device disconnected',
      () => {
        store.dispatch(bleActions.setStatus('disconnected'));
        store.dispatch(bleActions.setConnectedDevice(null));
      },
    );
  }

  simulateBLELowBattery(): void {
    this.simulate(
      'BLE_LOW_BATTERY',
      { batteryLevel: 15, deviceId: 'vision-aid-001' },
      'normal',
      'Warning: Device battery low',
      () => {
        store.dispatch(bleActions.setBatteryLevel(15));
        store.dispatch(bleActions.setSignalStrength(-75));
      },
    );
  }

  simulateBLEReconnecting(): void {
    this.simulate(
      'BLE_RECONNECTING',
      { deviceId: 'vision-aid-001', attempt: 1 },
      'normal',
      'Device reconnecting',
      () => {
        store.dispatch(bleActions.setStatus('reconnecting'));
      },
    );
  }

  simulateBLESignalWeak(): void {
    this.simulate(
      EVENTS.BLE_SIGNAL_WEAK,
      { rssi: -80, deviceId: 'vision-aid-001' },
      'normal',
      'Signal weak',
      () => {
        store.dispatch(bleActions.setSignalStrength(-80));
      },
    );
  }

  simulateBLEPacket(): void {
    const packetTypes = [
      { uuid: BLE_CHARACTERISTIC_UUIDS.OBSTACLE, raw: 't=person,d=150,dir=center,sev=caution' },
      { uuid: BLE_CHARACTERISTIC_UUIDS.BATTERY, raw: 'lvl=85,chg=discharging,v=3.7,temp=28' },
      { uuid: BLE_CHARACTERISTIC_UUIDS.SIGNAL, raw: 'r=-45,tx=-60,nf=-90,snr=15' },
      { uuid: BLE_CHARACTERISTIC_UUIDS.STATUS, raw: 'st=normal,ec=0,up=3600,fw=2.1.0,hw=1.0' },
      { uuid: BLE_CHARACTERISTIC_UUIDS.NAVIGATION, raw: 'dir=straight,inst=Walk forward,d=500' },
    ];

    const pick = packetTypes[Math.floor(Math.random() * packetTypes.length)];
    const result = blePacketParser.parse(pick.uuid, pick.raw);

    devPacketMonitor.push({
      direction: 'incoming',
      characteristicUUID: pick.uuid,
      payloadType: 'packet:' + ('packet' in result ? result.packet.type : 'parse_error'),
      raw: pick.raw,
      parseStatus: 'error' in result ? 'error' : 'success',
      packet: 'packet' in result ? result.packet : undefined,
    });

    this.simulate(
      'BLE_PACKET_RECEIVED',
      { characteristicUUID: pick.uuid, raw: pick.raw, parsed: result },
      'normal',
      undefined,
    );
  }

  // ========================================================================
  // AI SIMULATIONS
  // ========================================================================
  simulateAIObstacle(
    direction: 'left' | 'center' | 'right' = 'center',
    distance: number = 150,
    severity: 'safe' | 'caution' | 'danger' = 'caution',
  ): void {
    const obstacle: ObstacleDetection = {
      type: 'person',
      distance,
      direction,
      severity,
      voiceInstruction: this.generateObstacleInstruction(direction, distance, severity),
      timestamp: new Date().toISOString(),
    };

    this.simulate(
      EVENTS.AI_OBSTACLE_DETECTED,
      obstacle,
      severity === 'danger' ? 'critical' : 'normal',
      obstacle.voiceInstruction,
      () => {
        store.dispatch(aiActions.setStatus(severity === 'danger' ? 'danger' : 'detecting'));
        store.dispatch(aiActions.setCurrentObstacle(obstacle));
      },
    );
  }

  simulateAIDanger(): void {
    this.simulateAIObstacle('center', 30, 'danger');
  }

  simulateAISafe(): void {
    this.simulate(
      'AI_CLEAR',
      { clearedAt: new Date().toISOString() },
      'normal',
      'Path clear',
      () => {
        store.dispatch(aiActions.setStatus('idle'));
        store.dispatch(aiActions.clearObstacle());
      },
    );
  }

  simulateAIWarning(): void {
    this.simulateAIObstacle('left', 80, 'caution');
  }

  private generateObstacleInstruction(
    direction: string,
    distance: number,
    severity: string,
  ): string {
    const distanceText =
      distance >= 100 ? `${(distance / 100).toFixed(1)} meters` : `${distance} centimeters`;
    const directionText = direction === 'center' ? 'ahead' : `to your ${direction}`;

    if (severity === 'danger') {
      return `Warning! Obstacle detected very close ${directionText}. Stop immediately.`;
    } else if (severity === 'caution') {
      return `Caution: Obstacle detected ${directionText}, ${distanceText} away.`;
    }
    return `Obstacle detected ${directionText}.`;
  }

  // ========================================================================
  // EMERGENCY SIMULATIONS
  // ========================================================================
  simulateEmergencyTriggered(): void {
    this.simulate(
      EVENTS.EMERGENCY_TRIGGERED,
      { triggeredAt: new Date().toISOString() },
      'critical',
      'Emergency triggered. Sending alerts.',
      () => {
        store.dispatch(emergencyActions.startCountdown(5));
      },
    );
  }

  simulateEmergencyCancelled(): void {
    this.simulate(
      EVENTS.EMERGENCY_CANCELLED,
      { cancelledAt: new Date().toISOString() },
      'high',
      'Emergency cancelled',
      () => {
        store.dispatch(emergencyActions.cancelEmergency());
      },
    );
  }

  simulateFullEmergencyLifecycle(): void {
    const sessionId = `sim_${Date.now()}`;

    this.simulate(
      EMERGENCY_EVENTS.EMERGENCY_COUNTDOWN_STARTED,
      { duration: 5, startedAt: Date.now() },
      'critical',
      'Emergency countdown started',
      () => {
        store.dispatch(emergencyActions.startCountdown(5));
        store.dispatch(emergencyActions.triggerEmergency({ sessionId }));
      },
    );

    setTimeout(() => {
      store.dispatch(emergencyActions.setSending());
      store.dispatch(emergencyActions.setGpsCoordinates({ latitude: 40.7128, longitude: -74.006 }));
      store.dispatch(emergencyActions.setSmsSent(3));
      store.dispatch(emergencyActions.incrementContactsNotified(3));

      this.simulate(
        EMERGENCY_EVENTS.EMERGENCY_SENDING,
        { contactCount: 3, timestamp: Date.now() },
        'critical',
        'Sending emergency alerts',
      );
    }, 2000);

    setTimeout(() => {
      store.dispatch(emergencyActions.saveSessionToHistory());
      store.dispatch(emergencyActions.resolveEmergency());
      store.dispatch(emergencyActions.setEscalationAttempts(0));
    }, 4000);

    setTimeout(() => {
      store.dispatch(emergencyActions.resetEmergency());
    }, 6000);
  }

  simulateEmergencyEscalation(): void {
    store.dispatch(emergencyActions.triggerEmergency(undefined));
    store.dispatch(emergencyActions.setSending());
    store.dispatch(emergencyActions.setEscalationAttempts(1));

    this.simulate(
      EMERGENCY_EVENTS.EMERGENCY_ESCALATED,
      { attempt: 1, timestamp: Date.now() },
      'critical',
      'Emergency escalated',
    );
  }

  simulateEmergencyResolve(): void {
    store.dispatch(emergencyActions.saveSessionToHistory());
    store.dispatch(emergencyActions.resolveEmergency());
    this.simulate(
      EMERGENCY_EVENTS.EMERGENCY_RESOLVED,
      { resolvedAt: Date.now(), duration: 30000 },
      'high',
      'Emergency resolved',
      () => {
        setTimeout(() => store.dispatch(emergencyActions.resetEmergency()), 5000);
      },
    );
  }

  simulateEmergencyContactNotification(): void {
    const contactId = `contact_sim_${Date.now()}`;
    emergencyContactManager.addContact({
      name: 'Jane Doe',
      phone: '+1-555-0100',
      relationship: 'Spouse',
      isPrimary: true,
      notifyOnEmergency: true,
    }).then(contact => {
      store.dispatch(emergencyActions.addContact(contact));
      this.simulate(
        EMERGENCY_EVENTS.EMERGENCY_SEND_SUCCESS,
        { contactId: contact.id, method: 'sms' },
        'normal',
        `Contact notified: ${contact.name}`,
        () => store.dispatch(emergencyActions.incrementContactsNotified(1)),
      );
    });
  }

  simulateEmergencyGPS(): void {
    const location = { latitude: 40.7128, longitude: -74.006 };
    emergencyGPSPipeline.setMockLocation(location.latitude, location.longitude);
    store.dispatch(emergencyActions.setGpsCoordinates(location));

    this.simulate(
      EMERGENCY_EVENTS.EMERGENCY_GPS_PREPARED,
      { ...location, accuracy: 10 },
      'normal',
      'GPS location acquired',
    );
  }

  // ========================================================================
  // NAVIGATION SIMULATIONS
  // ========================================================================
  simulateNavigationStarted(): void {
    this.simulate(
      EVENTS.NAVIGATION_STARTED,
      { startedAt: new Date().toISOString(), destination: 'Home' },
      'normal',
      'Navigation started',
      () => {
        store.dispatch(emergencyActions.resolveEmergency());
      },
    );
  }

  simulateNavigationStopped(): void {
    this.simulate(
      EVENTS.NAVIGATION_STOPPED,
      { stoppedAt: new Date().toISOString() },
      'normal',
      'Navigation stopped',
      undefined,
    );
  }

  // ========================================================================
  // STRESS TEST
  // ========================================================================
  startStressTest(durationMs: number = 10000): void {
    if (!IS_DEV) return;

    console.log(`[DevSim] 🚀 Starting stress test for ${durationMs}ms`);
    this.isStressTesting = true;

    const simulations = [
      () => this.simulateBLEConnect(),
      () => this.simulateBLEDisconnect(),
      () => this.simulateAIObstacle('left', Math.random() * 200),
      () => this.simulateAIObstacle('right', Math.random() * 200),
      () => this.simulateAIObstacle('center', Math.random() * 200, 'danger'),
      () => this.simulateAISafe(),
      () => this.simulateBLELowBattery(),
      () => this.simulateBLESignalWeak(),
    ];

    let count = 0;
    this.stressTestInterval = setInterval(() => {
      const randomSim = simulations[Math.floor(Math.random() * simulations.length)];
      randomSim();
      count++;
      if (count % 10 === 0) {
        console.log(`[DevSim] 📊 Stress test: ${count} events`);
      }
    }, 100);

    setTimeout(() => this.stopStressTest(), durationMs);
  }

  startLifecycleStressTest(durationMs: number = 15000): void {
    if (!IS_DEV) return;

    console.log(`[DevSim] 🔄 Starting LIFECYCLE stress test for ${durationMs}ms`);
    this.isStressTesting = true;

    let cycleCount = 0;
    let isConnected = false;

    this.stressTestInterval = setInterval(() => {
      if (!isConnected) {
        this.simulateBLEConnect();
        isConnected = true;
      } else {
        this.simulateBLEDisconnect();
        isConnected = false;
      }
      cycleCount++;
      if (cycleCount % 5 === 0) {
        console.log(`[DevSim] 🔄 Lifecycle cycles: ${cycleCount}`);
      }
    }, 200);

    setTimeout(() => this.stopStressTest(), durationMs);
  }

  startEmergencyStressTest(durationMs: number = 20000): void {
    if (!IS_DEV) return;

    console.log(`[DevSim] 🚨 Starting EMERGENCY stress test for ${durationMs}ms`);
    this.isStressTesting = true;

    let phase = 0;

    this.stressTestInterval = setInterval(() => {
      switch (phase % 4) {
        case 0:
          this.simulateEmergencyTriggered();
          break;
        case 1:
          this.simulateFullEmergencyLifecycle();
          break;
        case 2:
          this.simulateEmergencyContactNotification();
          break;
        case 3:
          this.simulateEmergencyCancelled();
          break;
      }
      phase++;
    }, 3000);

    setTimeout(() => this.stopStressTest(), durationMs);
  }

  startPacketFloodTest(durationMs: number = 5000, packetsPerSecond: number = 50): void {
    if (!IS_DEV) return;

    console.log(`[DevSim] 🌊 Starting PACKET FLOOD: ${packetsPerSecond}/sec for ${durationMs}ms`);
    this.isStressTesting = true;

    const interval = Math.max(10, Math.floor(1000 / packetsPerSecond));
    let count = 0;

    this.stressTestInterval = setInterval(() => {
      this.simulateBLEPacket();
      count++;
      if (count % packetsPerSecond === 0) {
        console.log(`[DevSim] 🌊 Packet flood: ${count} packets sent`);
      }
    }, interval);

    setTimeout(() => this.stopStressTest(), durationMs);
  }

  stopStressTest(): void {
    if (this.stressTestInterval) {
      clearInterval(this.stressTestInterval);
      this.stressTestInterval = null;
    }
    this.isStressTesting = false;
    console.log(`[DevSim] 🛑 Stress test stopped. Total: ${this.metrics.totalEvents}`);
  }

  isStressTestRunning(): boolean {
    return this.isStressTesting;
  }

  // ========================================================================
  // VALIDATION
  // ========================================================================
  validateEmergencyState(): { valid: boolean; issues: string[] } {
    const emergency = store.getState().emergency;
    const issues: string[] = [];

    if (emergency.status === 'countdown' && emergency.countdownRemaining <= 0) {
      issues.push('Countdown reached zero without triggering');
    }

    if (emergency.status === 'triggered' && !emergency.triggeredAt) {
      issues.push('Triggered state without triggeredAt timestamp');
    }

    if (emergency.status === 'sending' && !emergency.triggeredAt) {
      issues.push('Sending state without triggeredAt timestamp');
    }

    if (emergency.status === 'sending' && emergency.contacts.length === 0) {
      issues.push('Sending alerts but no contacts configured');
    }

    if (emergency.triggeredAt && emergency.resolvedAt) {
      const triggered = new Date(emergency.triggeredAt).getTime();
      const resolved = new Date(emergency.resolvedAt).getTime();
      if (resolved < triggered) {
        issues.push('resolvedAt before triggeredAt');
      }
    }

    if (emergency.countdownRemaining < 0) {
      issues.push('Negative countdown remaining');
    }

    return { valid: issues.length === 0, issues };
  }

  validateBLEConnection(): { valid: boolean; issues: string[] } {
    const ble = store.getState().ble;
    const issues: string[] = [];

    if (ble.status === 'connected' && !ble.connectedDeviceId) {
      issues.push('Connected state but no device ID');
    }

    if (ble.connectionState === 'connected' && ble.status !== 'connected') {
      issues.push(`State mismatch: connectionState=${ble.connectionState} status=${ble.status}`);
    }

    if (ble.isScanning && ble.connectionState === 'connected') {
      issues.push('Scanning while connected');
    }

    if (ble.connectionState === 'connected' && !ble.connectedDeviceId) {
      issues.push('connectionState=connected but no device ID');
    }

    return { valid: issues.length === 0, issues };
  }

  validateAllStates(): { valid: boolean; issues: string[] } {
    const state = store.getState();
    const issues: string[] = [];

    const bleResult = this.validateBLEConnection();
    issues.push(...bleResult.issues.map(i => `[BLE] ${i}`));

    const emResult = this.validateEmergencyState();
    issues.push(...emResult.issues.map(i => `[EM] ${i}`));

    if (state.ble.connectionState === 'reconnecting' && state.ble.connectedDeviceId) {
      issues.push(`Reconnecting but deviceId still set: ${state.ble.connectedDeviceId}`);
    }

    if (state.ble.batteryLevel !== null && (state.ble.batteryLevel < 0 || state.ble.batteryLevel > 100)) {
      issues.push(`Battery level out of range: ${state.ble.batteryLevel}`);
    }

    return { valid: issues.length === 0, issues };
  }

  // ========================================================================
  // CLEANUP
  // ========================================================================
  destroy(): void {
    this.stopStressTest();
    this.clearEventLog();
    console.log('[DevSim] Engine destroyed');
  }
}

export const devSimulationEngine = new DevSimulationEngine();