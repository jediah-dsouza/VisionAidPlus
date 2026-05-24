import { useEffect, useMemo, useRef, useState } from 'react';
import { eventBus } from '@core/events/EventBus';
import type { SensorHealthStatus } from '../types';

const SENSOR_STALE_TIMEOUT = 30000;

export interface UseDeviceSensorHealthResult {
  sensors: SensorHealthStatus[];
  allHealthy: boolean;
  activeCount: number;
  staleCount: number;
  warningCount: number;
}

function createInitialSensors(): SensorHealthStatus[] {
  return [
    {
      sensorType: 'obstacle',
      label: 'Obstacle Detection',
      isActive: false,
      lastUpdate: null,
      status: 'inactive',
      message: 'Waiting for data',
    },
    {
      sensorType: 'battery',
      label: 'Battery Sensor',
      isActive: false,
      lastUpdate: null,
      status: 'inactive',
      message: 'Waiting for data',
    },
    {
      sensorType: 'signal',
      label: 'Signal Monitor',
      isActive: false,
      lastUpdate: null,
      status: 'inactive',
      message: 'Waiting for data',
    },
    {
      sensorType: 'status',
      label: 'Device Status',
      isActive: false,
      lastUpdate: null,
      status: 'inactive',
      message: 'Waiting for data',
    },
    {
      sensorType: 'navigation',
      label: 'Navigation',
      isActive: false,
      lastUpdate: null,
      status: 'inactive',
      message: 'Waiting for data',
    },
  ];
}

export const useDeviceSensorHealth = (): UseDeviceSensorHealthResult => {
  const [sensors, setSensors] = useState<SensorHealthStatus[]>(createInitialSensors);
  const mountedRef = useRef(true);
  const sensorTimestamps = useRef<Record<string, number | null>>({
    obstacle: null,
    battery: null,
    signal: null,
    status: null,
    navigation: null,
  });

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const unsubPacket = eventBus.subscribe('ble:packetReceived' as any, (result: any) => {
      if (!mountedRef.current) return;
      const packet = result.packet;
      const now = Date.now();
      sensorTimestamps.current[packet.type] = now;

      setSensors(prev =>
        prev.map(s => {
          if (s.sensorType !== packet.type) return s;
          return {
            ...s,
            isActive: true,
            lastUpdate: now,
            status: 'healthy' as const,
            message: `Active - last data ${new Date(now).toLocaleTimeString()}`,
          };
        }),
      );
    });

    const unsubError = eventBus.subscribe('ble:parseError' as any, () => {
      if (!mountedRef.current) return;
    });

    const interval = setInterval(() => {
      if (!mountedRef.current) return;
      const now = Date.now();
      setSensors(prev =>
        prev.map(s => {
          const last = sensorTimestamps.current[s.sensorType];
          if (last === null) return s;
          const elapsed = now - last;
          if (elapsed > SENSOR_STALE_TIMEOUT) {
            return {
              ...s,
              status: 'stale' as const,
              message: `No data for ${Math.floor(elapsed / 1000)}s`,
            };
          }
          return {
            ...s,
            status: 'healthy' as const,
            message: `Active - last data ${new Date(last).toLocaleTimeString()}`,
          };
        }),
      );
    }, 5000);

    return () => {
      unsubPacket();
      unsubError();
      clearInterval(interval);
    };
  }, []);

  const { allHealthy, activeCount, staleCount, warningCount } = useMemo(() => {
    let active = 0,
      stale = 0,
      warning = 0;
    for (const s of sensors) {
      if (s.isActive) active++;
      if (s.status === 'stale') stale++;
      if (s.status === 'warning') warning++;
    }
    return {
      allHealthy: sensors.every(s => s.status === 'healthy'),
      activeCount: active,
      staleCount: stale,
      warningCount: warning,
    };
  }, [sensors]);

  return { sensors, allHealthy, activeCount, staleCount, warningCount };
};
