import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { bleManager } from '@core/ble';
import type { BLEMetrics } from '@core/ble';
import type { DeviceDiagnosticsViewState } from '../types';

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export interface UseDeviceDiagnosticsResult extends DeviceDiagnosticsViewState {
  refresh: () => void;
  hasActivity: boolean;
}

export const useDeviceDiagnostics = (): UseDeviceDiagnosticsResult => {
  const [metrics, setMetrics] = useState<BLEMetrics>(() => ({ ...bleManager.metricsSnapshot }));
  const mountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(() => {
    if (mountedRef.current) {
      setMetrics({ ...bleManager.metricsSnapshot });
    }
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(refresh, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  const viewState: DeviceDiagnosticsViewState = useMemo(
    () => ({
      totalPacketsReceived: metrics.totalPacketsReceived,
      totalPacketsParsed: metrics.totalPacketsParsed,
      totalParseErrors: metrics.totalParseErrors,
      averageParseTimeMs: metrics.averageParseTimeMs,
      totalReconnections: metrics.totalReconnections,
      totalDisconnections: metrics.totalDisconnections,
      uptime: metrics.uptime,
      uptimeFormatted: formatUptime(metrics.uptime),
      lastPacketAt: metrics.lastPacketAt,
    }),
    [metrics],
  );

  return {
    ...viewState,
    refresh,
    hasActivity: metrics.totalPacketsReceived > 0,
  };
};
