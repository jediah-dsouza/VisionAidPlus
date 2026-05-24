import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@app/store';
import { bleActions } from '@app/store/slices/bleSlice';
import { bleManager } from '@core/ble';
import type { BLEDevice } from '@core/ble';
import { logger } from '@core/debug';

export interface UseDeviceScanResult {
  isScanning: boolean;
  discoveredDevices: BLEDevice[];
  scanError: string | null;
  lastScanAt: number | null;
  startScan: () => Promise<void>;
  stopScan: () => Promise<void>;
  clearDevices: () => void;
}

export const useDeviceScan = (): UseDeviceScanResult => {
  const dispatch = useAppDispatch();
  const bleState = useAppSelector(state => state.ble);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastScanAt, setLastScanAt] = useState<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const startScan = useCallback(async () => {
    setScanError(null);
    dispatch(bleActions.setScanning(true));
    try {
      await bleManager.startScan();
      if (!mountedRef.current) return;
      setLastScanAt(Date.now());
    } catch (error) {
      if (!mountedRef.current) return;
      const message = (error as Error).message;
      setScanError(message);
      dispatch(bleActions.setError(message));
      logger.error('[useDeviceScan] Scan failed:', message);
    }
  }, [dispatch]);

  const stopScan = useCallback(async () => {
    try {
      await bleManager.stopScan();
      dispatch(bleActions.setScanning(false));
    } catch (error) {
      logger.error('[useDeviceScan] Stop scan failed:', error);
    }
  }, [dispatch]);

  const clearDevices = useCallback(() => {
    dispatch(bleActions.setDevices([]));
  }, [dispatch]);

  return {
    isScanning: bleState.isScanning,
    discoveredDevices: bleState.devices,
    scanError,
    lastScanAt,
    startScan,
    stopScan,
    clearDevices,
  };
};
