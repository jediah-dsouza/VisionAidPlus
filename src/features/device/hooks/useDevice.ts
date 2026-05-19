import { useAppDispatch, useAppSelector, store } from '@app/store';
import { bleActions } from '@app/store/slices/bleSlice';
import { bleService, eventBus, EVENTS } from '../../../core';
import type { BLEDevice } from '../../../core';
import { useCallback, useEffect } from 'react';

export const useDevice = () => {
  const dispatch = useAppDispatch();
  const bleState = useAppSelector(state => state.ble);

  const startScan = useCallback(async () => {
    dispatch(bleActions.setStatus('scanning'));
    try {
      await bleService.startScan();
    } catch (error) {
      dispatch(bleActions.setError((error as Error).message));
    }
  }, [dispatch]);

  const stopScan = useCallback(async () => {
    try {
      await bleService.stopScan();
      dispatch(bleActions.setStatus('idle'));
    } catch (error) {
      console.error('Stop scan failed:', error);
    }
  }, [dispatch]);

  const connect = useCallback(
    async (deviceId: string) => {
      dispatch(bleActions.setStatus('connecting'));
      try {
        await bleService.connect(deviceId);
        dispatch(bleActions.setConnectedDevice(deviceId));
        dispatch(bleActions.setStatus('connected'));
      } catch (error) {
        dispatch(bleActions.setError((error as Error).message));
      }
    },
    [dispatch],
  );

  const disconnect = useCallback(async () => {
    try {
      await bleService.disconnect();
      dispatch(bleActions.setConnectedDevice(null));
      dispatch(bleActions.setStatus('disconnected'));
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    const unsubDeviceFound = eventBus.subscribe('BLE_DEVICE_FOUND', (device: BLEDevice) => {
      const currentDevices = store.getState()?.ble?.devices ?? [];
      dispatch(bleActions.setDevices([...currentDevices, device]));
    });

    const unsubConnected = eventBus.subscribe(EVENTS.BLE_DEVICE_CONNECTED, (device: BLEDevice) => {
      dispatch(bleActions.setConnectedDevice(device.id));
      dispatch(bleActions.setStatus('connected'));
    });

    const unsubDisconnected = eventBus.subscribe(EVENTS.BLE_DEVICE_DISCONNECTED, () => {
      dispatch(bleActions.setConnectedDevice(null));
      dispatch(bleActions.setStatus('disconnected'));
    });

    return () => {
      unsubDeviceFound();
      unsubConnected();
      unsubDisconnected();
    };
  }, [dispatch]);

  return {
    ...bleState,
    startScan,
    stopScan,
    connect,
    disconnect,
  };
};
