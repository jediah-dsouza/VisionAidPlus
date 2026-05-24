import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@app/store';
import { bleActions } from '@app/store/slices/bleSlice';
import { BLE_LIMITS } from '@core/ble';
import type { BLEChargingStatus } from '@core/ble';
import type { DeviceBatteryViewState } from '../types';
import { accessibilityEngine } from '@core/accessibility';

export interface UseDeviceBatteryResult extends DeviceBatteryViewState {
  setBatteryLevel: (level: number, chargingStatus: BLEChargingStatus) => void;
}

export const useDeviceBattery = (): UseDeviceBatteryResult => {
  const dispatch = useAppDispatch();
  const bleState = useAppSelector(state => state.ble);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const batteryLevel = bleState.batteryLevel;
  const chargingStatus = bleState.chargingStatus;

  const viewState: DeviceBatteryViewState = useMemo(
    () => ({
      batteryLevel,
      chargingStatus,
      isLowBattery:
        batteryLevel !== null &&
        batteryLevel <= BLE_LIMITS.BATTERY_LOW_THRESHOLD &&
        batteryLevel > BLE_LIMITS.BATTERY_CRITICAL_THRESHOLD,
      isCriticalBattery:
        batteryLevel !== null && batteryLevel <= BLE_LIMITS.BATTERY_CRITICAL_THRESHOLD,
      isCharging: chargingStatus === 'charging',
      isBatteryFull: chargingStatus === 'full',
    }),
    [batteryLevel, chargingStatus],
  );

  const setBatteryLevel = useCallback(
    (level: number, status: BLEChargingStatus) => {
      dispatch(bleActions.setBatteryLevel(level));
      dispatch(bleActions.setChargingStatus(status));

      if (level <= BLE_LIMITS.BATTERY_CRITICAL_THRESHOLD) {
        accessibilityEngine.announce(
          `Critical battery: ${level} percent. Please charge your device immediately.`,
          'critical',
          true,
        );
      } else if (level <= BLE_LIMITS.BATTERY_LOW_THRESHOLD) {
        accessibilityEngine.announce(
          `Low battery: ${level} percent. Consider charging your device.`,
          'high',
          false,
        );
      }
    },
    [dispatch],
  );

  return {
    ...viewState,
    setBatteryLevel,
  };
};
