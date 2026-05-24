import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@app/store';
import { bleActions } from '@app/store/slices/bleSlice';
import { BLE_RECONNECT_BACKOFFS } from '@core/ble';
import { accessibilityEngine } from '@core/accessibility';
import type { DeviceReconnectionViewState } from '../types';

export interface UseDeviceReconnectionResult extends DeviceReconnectionViewState {
  dismissReconnection: () => void;
  showReconnectionUI: boolean;
}

export const useDeviceReconnection = (): UseDeviceReconnectionResult => {
  const dispatch = useAppDispatch();
  const reconnectAttempts = useAppSelector(state => state.ble.reconnectAttempts);
  const connectionState = useAppSelector(state => state.ble.connectionState);
  const mountedRef = useRef(true);
  const [dismissed, setDismissed] = useState(false);
  const lastAnnouncedAttempt = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (connectionState === 'reconnecting' && reconnectAttempts !== lastAnnouncedAttempt.current) {
      lastAnnouncedAttempt.current = reconnectAttempts;
      setDismissed(false);
      if (!mountedRef.current) return;
      accessibilityEngine.announce(
        `Reconnection attempt ${reconnectAttempts + 1} of ${BLE_RECONNECT_BACKOFFS.length}`,
        'high',
        false,
      );
    }
  }, [connectionState, reconnectAttempts]);

  const dismissReconnection = useCallback(() => {
    setDismissed(true);
    dispatch(bleActions.setError(null));
    dispatch(bleActions.setConnectionState('disconnected'));
    dispatch(bleActions.setStatus('disconnected' as any));
  }, [dispatch]);

  const isReconnecting = connectionState === 'reconnecting';
  const showReconnectionUI = isReconnecting && !dismissed;

  const timeUntilNextAttempt = useMemo(() => {
    if (!isReconnecting) return null;
    const backoffIndex = Math.min(reconnectAttempts, BLE_RECONNECT_BACKOFFS.length - 1);
    return BLE_RECONNECT_BACKOFFS[backoffIndex];
  }, [isReconnecting, reconnectAttempts]);

  return {
    isReconnecting,
    currentAttempt: reconnectAttempts + 1,
    maxAttempts: BLE_RECONNECT_BACKOFFS.length,
    timeUntilNextAttempt,
    dismissReconnection,
    showReconnectionUI,
  };
};
