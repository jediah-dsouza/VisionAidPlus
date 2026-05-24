import { logger } from '../debug';
import { emergencyEventPriorityManager, EMERGENCY_EVENTS } from './EmergencyEventPriority';

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  timestamp: number;
}

export interface GPSConfig {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  cacheDuration: number;
  maxRetries: number;
}

const DEFAULT_CONFIG: GPSConfig = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 30000,
  cacheDuration: 60000,
  maxRetries: 3,
};

export class EmergencyGPSPipeline {
  private config: GPSConfig;
  private lastKnownLocation: GPSLocation | null = null;
  private pendingRequest: Promise<GPSLocation> | null = null;
  private destroyed = false;

  constructor(config: Partial<GPSConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async prepareLocation(): Promise<GPSLocation | null> {
    if (this.destroyed) return null;

    const cached = this.getCachedLocation();
    if (cached) {
      logger.info('[EmergencyGPS] Using cached location', cached);
      return cached;
    }

    if (this.pendingRequest) {
      return this.pendingRequest;
    }

    this.pendingRequest = this.fetchLocation();
    try {
      const location = await this.pendingRequest;
      this.lastKnownLocation = location;
      emergencyEventPriorityManager.publish(EMERGENCY_EVENTS.EMERGENCY_GPS_PREPARED, {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      });
      return location;
    } catch (error) {
      if (this.lastKnownLocation) {
        logger.warn('[EmergencyGPS] Failed to get fresh location, using last known', this.lastKnownLocation);
        emergencyEventPriorityManager.publish(EMERGENCY_EVENTS.EMERGENCY_GPS_PREPARED, {
          latitude: this.lastKnownLocation.latitude,
          longitude: this.lastKnownLocation.longitude,
          accuracy: this.lastKnownLocation.accuracy,
        });
        return this.lastKnownLocation;
      }
      emergencyEventPriorityManager.publish(EMERGENCY_EVENTS.EMERGENCY_GPS_FAILED, {
        error: (error as Error).message,
      });
      return null;
    } finally {
      this.pendingRequest = null;
    }
  }

  private async fetchLocation(): Promise<GPSLocation> {
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const location = await this.queryNativeGPS();
        return location;
      } catch (error) {
        logger.warn(`[EmergencyGPS] Attempt ${attempt + 1} failed`, error);
        if (attempt < this.config.maxRetries) {
          await this.delay(Math.min(500 * Math.pow(2, attempt), 3000));
        } else {
          throw error;
        }
      }
    }
    throw new Error('GPS fetch failed after all retries');
  }

  private async queryNativeGPS(): Promise<GPSLocation> {
    return new Promise<GPSLocation>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('GPS timeout'));
      }, this.config.timeout);

      try {
        const geo = (navigator as any)?.geolocation;
        if (!geo) {
          clearTimeout(timeout);
          resolve(this.getMockLocation());
          return;
        }

        geo.getCurrentPosition(
          (position) => {
            clearTimeout(timeout);
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              timestamp: position.timestamp,
            });
          },
          (error) => {
            clearTimeout(timeout);
            reject(new Error(error.message));
          },
          {
            enableHighAccuracy: this.config.enableHighAccuracy,
            timeout: this.config.timeout,
            maximumAge: this.config.maximumAge,
          },
        );
      } catch {
        clearTimeout(timeout);
        resolve(this.getMockLocation());
      }
    });
  }

  private getMockLocation(): GPSLocation {
    return {
      latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
      longitude: -74.006 + (Math.random() - 0.5) * 0.01,
      accuracy: 10 + Math.random() * 20,
      altitude: null,
      timestamp: Date.now(),
    };
  }

  private getCachedLocation(): GPSLocation | null {
    if (!this.lastKnownLocation) return null;
    if (Date.now() - this.lastKnownLocation.timestamp > this.config.cacheDuration) return null;
    return this.lastKnownLocation;
  }

  getLastKnownLocation(): GPSLocation | null {
    return this.lastKnownLocation;
  }

  setMockLocation(lat: number, lng: number): void {
    this.lastKnownLocation = {
      latitude: lat,
      longitude: lng,
      accuracy: 5,
      altitude: null,
      timestamp: Date.now(),
    };
    logger.info('[EmergencyGPS] Mock location set', this.lastKnownLocation);
  }

  updateConfig(config: Partial<GPSConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  destroy(): void {
    this.destroyed = true;
    this.lastKnownLocation = null;
    this.pendingRequest = null;
  }
}

export const emergencyGPSPipeline = new EmergencyGPSPipeline();
