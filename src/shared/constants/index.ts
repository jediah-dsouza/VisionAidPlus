export const APP_NAME = 'VisionAid+';
export const APP_VERSION = '1.0.0';

export const BLE_STATES = {
  IDLE: 'idle',
  SCANNING: 'scanning',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
} as const;

export const AI_STATES = {
  IDLE: 'idle',
  PROCESSING: 'processing',
  DETECTING: 'detecting',
  WARNING: 'warning',
  DANGER: 'danger',
  OFFLINE: 'offline',
} as const;

export const TTS_STATES = {
  IDLE: 'idle',
  SPEAKING: 'speaking',
  PAUSED: 'paused',
  MUTED: 'muted',
  ERROR: 'error',
} as const;

export const EMERGENCY_STATES = {
  IDLE: 'idle',
  COUNTDOWN: 'countdown',
  TRIGGERED: 'triggered',
  SENDING: 'sending',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
} as const;

export const EVENT_PRIORITIES = {
  CRITICAL: ['EMERGENCY_TRIGGERED', 'AI_DANGER_DETECTED'],
  HIGH: ['BLE_DEVICE_DISCONNECTED', 'LOW_BATTERY_WARNING'],
  NORMAL: ['AI_OBSTACLE_DETECTED', 'NAVIGATION_STARTED'],
  LOW: ['ANALYTICS_SYNC', 'BACKGROUND_REFRESH'],
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  SETTINGS: 'app_settings',
  DEVICE_PAIRED: 'device_paired',
  LAST_SYNC: 'last_sync',
  CACHE: 'cache',
} as const;

export const API_ENDPOINTS = {
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  EMERGENCY_CONTACTS: '/emergency/contacts',
  ANALYTICS: '/analytics',
  USER_PROFILE: '/user/profile',
} as const;

export const TIMEouts = {
  BLE_SCAN: 10000,
  BLE_CONNECT: 15000,
  API_REQUEST: 30000,
  CACHE_EXPIRY: 24 * 60 * 60 * 1000,
  DEBOUNCE_DELAY: 300,
} as const;
