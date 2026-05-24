import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@app/store';
import { bleActions } from '@app/store/slices/bleSlice';
import { BLE_LIMITS } from '@core/ble';
import type { DeviceSignalViewState } from '../types';

function computeSignalQuality(rssi: number): DeviceSignalViewState['signalQuality'] {
  if (rssi >= -50) return 'excellent';
  if (rssi >= -65) return 'good';
  if (rssi >= -80) return 'fair';
  if (rssi >= -90) return 'weak';
  if (rssi > -127) return 'poor';
  return 'unknown';
}

export interface UseDeviceSignalResult extends DeviceSignalViewState {
  updateRSSI: (rssi: number) => void;
}

export const useDeviceSignal = (): UseDeviceSignalResult => {
  const dispatch = useAppDispatch();
  const signalStrength = useAppSelector(state => state.ble.signalStrength);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const viewState: DeviceSignalViewState = useMemo(() => {
    const quality = computeSignalQuality(signalStrength);
    return {
      rssi: signalStrength,
      signalQuality: quality,
      isWeakSignal:
        signalStrength <= BLE_LIMITS.SIGNAL_WEAK_THRESHOLD &&
        signalStrength > BLE_LIMITS.SIGNAL_CRITICAL_THRESHOLD,
      isCriticalSignal: signalStrength <= BLE_LIMITS.SIGNAL_CRITICAL_THRESHOLD,
    };
  }, [signalStrength]);

  const updateRSSI = useCallback(
    (rssi: number) => {
      dispatch(bleActions.setSignalStrength(rssi));
    },
    [dispatch],
  );

  return {
    ...viewState,
    updateRSSI,
  };
};
