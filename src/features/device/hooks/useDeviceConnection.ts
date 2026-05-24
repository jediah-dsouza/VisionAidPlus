import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@app/store';
import { bleActions } from '@app/store/slices/bleSlice';
import { bleManager } from '@core/ble';
import type { BLEDevice } from '@core/ble';
import { logger } from '@core/debug';

export interface UseDeviceConnectionResult {
  connectionState: import('@core/ble').BLEConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  isReconnecting: boolean;
  isError: boolean;
  connectedDeviceId: string | null;
  connectedDeviceName: string | null;
  connectedAt: number | null;
  reconnectAttempts: number;
  lastError: string | null;
  connectToDevice: (device: BLEDevice) => Promise<void>;
  disconnect: () => Promise<void>;
  attemptReconnect: () => Promise<void>;
  retryAfterError: () => void;
}

export const useDeviceConnection = (): UseDeviceConnectionResult => {
  const dispatch = useAppDispatch();
  const bleState = useAppSelector(state => state.ble);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const connectToDevice = useCallback(
    async (device: BLEDevice) => {
      dispatch(bleActions.setConnectionState('connecting'));
      dispatch(bleActions.setStatus('connecting' as any));
      try {
        const success = await bleManager.connectToDevice(device);
        if (mountedRef.current && success) {
          dispatch(bleActions.setConnectionState('connected'));
          dispatch(bleActions.setStatus('connected' as any));
          dispatch(bleActions.setConnectedDevice({ id: device.id, name: device.name }));
        }
      } catch (error) {
        const message = (error as Error).message;
        if (mountedRef.current) {
          dispatch(bleActions.setError(message));
          dispatch(bleActions.setConnectionState('error'));
          dispatch(bleActions.setStatus('error' as any));
        }
      }
    },
    [dispatch],
  );

  const disconnect = useCallback(async () => {
    dispatch(bleActions.setConnectionState('disconnecting'));
    try {
      await bleManager.disconnect('user_initiated');
      if (mountedRef.current) {
        dispatch(bleActions.setConnectionState('disconnected'));
        dispatch(bleActions.setStatus('disconnected' as any));
        dispatch(bleActions.setConnectedDevice(null));
        dispatch(bleActions.setReconnectAttempts(0));
      }
    } catch (error) {
      logger.error('[useDeviceConnection] Disconnect failed:', error);
    }
  }, [dispatch]);

  const attemptReconnect = useCallback(async () => {
    dispatch(bleActions.setConnectionState('reconnecting'));
    dispatch(bleActions.setStatus('reconnecting' as any));
    try {
      const success = await bleManager.attemptReconnect();
      if (!mountedRef.current) return;
      if (success) {
        const info = bleManager.deviceInfo;
        dispatch(bleActions.setConnectionState('connected'));
        dispatch(bleActions.setStatus('connected' as any));
        dispatch(
          bleActions.setConnectedDevice({
            id: info.deviceId ?? 'unknown',
            name: info.deviceName ?? 'Device',
          }),
        );
      } else {
        const currentAttempts = bleState.reconnectAttempts + 1;
        dispatch(bleActions.setReconnectAttempts(currentAttempts));
        if (currentAttempts >= 5) {
          dispatch(bleActions.setConnectionState('error'));
          dispatch(bleActions.setStatus('error' as any));
          dispatch(bleActions.setError('Max reconnection attempts reached'));
        }
      }
    } catch (error) {
      if (mountedRef.current) {
        dispatch(bleActions.setError((error as Error).message));
      }
    }
  }, [dispatch, bleState.reconnectAttempts]);

  const retryAfterError = useCallback(() => {
    dispatch(bleActions.setConnectionState('idle'));
    dispatch(bleActions.setStatus('idle' as any));
    dispatch(bleActions.setError(null));
    dispatch(bleActions.setReconnectAttempts(0));
  }, [dispatch]);

  return {
    connectionState: bleState.connectionState,
    isConnected: bleState.connectionState === 'connected',
    isConnecting: bleState.connectionState === 'connecting',
    isDisconnecting: bleState.connectionState === 'disconnecting',
    isReconnecting: bleState.connectionState === 'reconnecting',
    isError: bleState.connectionState === 'error',
    connectedDeviceId: bleState.connectedDeviceId,
    connectedDeviceName: bleState.connectedDeviceName,
    connectedAt: bleState.connectedAt,
    reconnectAttempts: bleState.reconnectAttempts,
    lastError: bleState.lastError,
    connectToDevice,
    disconnect,
    attemptReconnect,
    retryAfterError,
  };
};
