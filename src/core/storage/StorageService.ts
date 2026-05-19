import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@core/debug';

export interface StorageAdapter {
  get<T = string>(key: string): Promise<T | null>;
  set<T = string>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

class AsyncStorageAdapter implements StorageAdapter {
  async get<T = string>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      logger.error(`Storage get error for key: ${key}`, error);
      return null;
    }
  }

  async set<T = string>(key: string, value: T): Promise<void> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, serialized);
    } catch (error) {
      logger.error(`Storage set error for key: ${key}`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      logger.error(`Storage remove error for key: ${key}`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      logger.error('Storage clear error', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return [...(await AsyncStorage.getAllKeys())];
    } catch (error) {
      logger.error('Storage getAllKeys error', error);
      return [];
    }
  }
}

export const storage = new AsyncStorageAdapter();

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
  SETTINGS: '@app_settings',
  DEVICE_PAIRED: '@device_paired',
  LAST_SYNC: '@last_sync',
  EMERGENCY_CONTACTS: '@emergency_contacts',
  ONBOARDING_COMPLETE: '@onboarding_complete',
  BLE_LAST_DEVICE: '@ble_last_device',
} as const;
