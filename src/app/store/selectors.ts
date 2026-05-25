import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index';

export const selectAuthIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthUser = (state: RootState) => state.auth.user;

export const selectSettingsHasCompletedOnboarding = (state: RootState) =>
  state.settings.hasCompletedOnboarding;
export const selectSettingsPreferences = (state: RootState) => state.settings.preferences;

export const selectBLEWidgetData = createSelector(
  [(state: RootState) => state.ble],
  ble => ({
    connectionState: ble.connectionState,
    status: ble.status,
    connectedDeviceId: ble.connectedDeviceId,
    signalStrength: ble.signalStrength,
    batteryLevel: ble.batteryLevel,
    chargingStatus: ble.chargingStatus,
    devices: ble.devices,
    reconnectAttempts: ble.reconnectAttempts,
    isScanning: ble.isScanning,
  }),
);

export const selectDeviceStatusData = createSelector(
  [(state: RootState) => state.ble],
  ble => ({
    connectionState: ble.connectionState,
    status: ble.status,
    connectedDeviceId: ble.connectedDeviceId,
    connectedDeviceName: ble.connectedDeviceName,
    signalStrength: ble.signalStrength,
    batteryLevel: ble.batteryLevel,
    chargingStatus: ble.chargingStatus,
    mtu: ble.mtu,
    reconnectAttempts: ble.reconnectAttempts,
    lastError: ble.lastError,
    connectedAt: ble.connectedAt,
    isScanning: ble.isScanning,
  }),
);

export const selectAIStatusData = createSelector(
  [(state: RootState) => state.ai],
  ai => ({
    status: ai.status,
    currentObstacle: ai.currentObstacle,
    detectionHistory: ai.detectionHistory,
    lastDetectionTime: ai.lastDetectionTime,
    error: ai.error,
  }),
);

export const selectEmergencyData = createSelector(
  [(state: RootState) => state.emergency],
  emergency => ({
    status: emergency.status,
    countdownRemaining: emergency.countdownRemaining,
    countdownTotal: emergency.countdownTotal,
    contacts: emergency.contacts,
    contactsNotified: emergency.contactsNotified,
    escalationAttempts: emergency.escalationAttempts,
  }),
);

export const selectHomeSummary = createSelector(
  [
    (state: RootState) => state.ble.connectionState,
    (state: RootState) => state.ai.status,
    (state: RootState) => state.ai.currentObstacle,
    (state: RootState) => state.ai.detectionHistory,
    (state: RootState) => state.emergency.status,
    (state: RootState) => state.auth.user,
  ],
  (connectionState, aiStatus, currentObstacle, detectionHistory, emergencyStatus, user) => ({
    deviceConnected: connectionState === 'connected',
    deviceReconnecting: connectionState === 'reconnecting',
    aiActive: aiStatus === 'detecting' || aiStatus === 'processing',
    emergencyActive: emergencyStatus !== 'idle',
    lastObstacle: currentObstacle,
    detectionCount: detectionHistory.length,
    hasUser: !!user,
    userName: user?.name ?? 'User',
  }),
);

export const selectBLEStatus = (state: RootState) => state.ble.status;
export const selectAIStatus = (state: RootState) => state.ai.status;
export const selectEmergencyStatus = (state: RootState) => state.emergency.status;
export const selectBLELastError = (state: RootState) => state.ble.lastError;
export const selectAIError = (state: RootState) => state.ai.error;
export const selectDetectionHistory = (state: RootState) => state.ai.detectionHistory;

export const selectAnalyticsIsActive = (state: RootState) => state.analytics?.isActive ?? false;
export const selectAnalyticsSessionId = (state: RootState) => state.analytics?.sessionId ?? null;
export const selectAlertHistory = (state: RootState) => state.analytics?.alertHistory ?? [];
export const selectExportProgress = (state: RootState) =>
  state.analytics?.exportProgress ?? {
    isExporting: false,
    progress: 0,
    totalRecords: 0,
    error: null,
  };
export const selectAnalyticsFilter = (state: RootState) =>
  state.analytics?.filter ?? { timeRange: { start: 0 }, categories: [], severity: [] };
export const selectAnalyticsMetrics = (state: RootState) =>
  state.analytics?.metrics ?? { safety: null, obstacles: null, usage: null, session: null };
export const selectSessionMetrics = (state: RootState) =>
  state.analytics?.metrics.session ?? null;
export const selectObstacleMetrics = (state: RootState) =>
  state.analytics?.metrics.obstacles ?? null;
export const selectSafetyMetrics = (state: RootState) =>
  state.analytics?.metrics.safety ?? null;
export const selectUsageMetrics = (state: RootState) =>
  state.analytics?.metrics.usage ?? null;
