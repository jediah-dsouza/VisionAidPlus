import type { ObstacleDetection } from '@shared/types';
import { BLE_STATES, AI_STATES } from '@shared/constants';

export type WidgetStatus = 'loading' | 'connected' | 'disconnected' | 'error';

export interface BLEStatusData {
  status: (typeof BLE_STATES)[keyof typeof BLE_STATES];
  deviceId: string | null;
  deviceName: string | null;
  signalStrength: number;
  batteryLevel: number | null;
}

export interface AIStatusData {
  status: (typeof AI_STATES)[keyof typeof AI_STATES];
  currentObstacle: ObstacleDetection | null;
  detectionCount: number;
  lastDetectionTime: string | null;
}

export interface EmergencyStatusData {
  isActive: boolean;
  countdownRemaining: number | null;
  contactsCount: number;
}

export interface DashboardState {
  ble: BLEStatusData;
  ai: AIStatusData;
  emergency: EmergencyStatusData;
  isInitialized: boolean;
  lastUpdateTime: string | null;
}

export interface ObstacleCardProps {
  obstacle: ObstacleDetection;
  isNew?: boolean;
  onDismiss?: () => void;
}

export interface StatusWidgetProps {
  title: string;
  icon: string;
  status: WidgetStatus;
  data?: Record<string, unknown>;
  onRetry?: () => void;
  accessibilityLabel?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface DashboardConfig {
  refreshInterval: number;
  maxObstacleHistory: number;
  alertTimeout: number;
  reconnectAttempts: number;
}

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  refreshInterval: 1000,
  maxObstacleHistory: 10,
  alertTimeout: 5000,
  reconnectAttempts: 3,
};
