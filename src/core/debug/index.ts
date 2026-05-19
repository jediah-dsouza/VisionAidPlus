import { Platform } from 'react-native';
import env from '../../env';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLogLevel = LOG_LEVELS[env.LOG_LEVEL] ?? LOG_LEVELS.info;

export const logger = {
  error: (message: string, ...args: unknown[]) => {
    if (currentLogLevel >= LOG_LEVELS.error) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (currentLogLevel >= LOG_LEVELS.warn) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: unknown[]) => {
    if (currentLogLevel >= LOG_LEVELS.info) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  debug: (message: string, ...args: unknown[]) => {
    if (currentLogLevel >= LOG_LEVELS.debug && (env.DEBUG_MODE || __DEV__)) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  group: (label: string) => {
    if (env.DEBUG_MODE || __DEV__) {
      console.group(label);
    }
  },
  groupEnd: () => {
    if (env.DEBUG_MODE || __DEV__) {
      console.groupEnd();
    }
  },
  time: (label: string) => {
    if (env.DEBUG_MODE || __DEV__) {
      console.time(label);
    }
  },
  timeEnd: (label: string) => {
    if (env.DEBUG_MODE || __DEV__) {
      console.timeEnd(label);
    }
  },
};

export const debugHelpers = {
  showDevMenu: () => {
    if (__DEV__) {
      console.log('Dev menu available in development');
    }
  },
  reloadApp: () => {
    console.log('App restart requires native module');
  },
  isEmulator: async (): Promise<boolean> => {
    return Platform.OS !== 'android';
  },
  getDeviceInfo: () => ({
    platform: Platform.OS,
    platformVersion: Platform.Version,
    isDevelopment: __DEV__,
    environment: env.ENVIRONMENT,
  }),
};

export default logger;
