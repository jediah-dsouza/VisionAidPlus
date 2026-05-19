export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface Result<T, E = Error> {
  data?: T;
  error?: E;
  success: boolean;
}

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ObstacleDetection {
  type: string;
  distance: number;
  direction: 'left' | 'center' | 'right';
  severity: 'safe' | 'caution' | 'danger';
  boundingBox?: BoundingBox;
  timestamp: string;
  voiceInstruction: string;
}

export interface BLEDevice {
  id: string;
  name: string;
  rssi: number;
  isConnected: boolean;
  batteryLevel?: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
  notifyOnEmergency: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  emergencyContacts: EmergencyContact[];
}

export interface Settings {
  ttsEnabled: boolean;
  ttsLanguage: string;
  ttsSpeechRate: number;
  highContrastMode: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  hapticFeedback: boolean;
  emergencyCountdown: number;
  autoReconnect: boolean;
  analyticsEnabled: boolean;
  hasCompletedOnboarding: boolean;
}
