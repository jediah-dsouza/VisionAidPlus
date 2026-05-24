import { useCallback, useState } from 'react';
import { bleManager } from '@core/ble';
import { accessibilityEngine } from '@core/accessibility';
import { logger } from '@core/debug';
import type { CalibrationStatus } from '../types';

export interface UseDeviceCalibrationResult {
  status: CalibrationStatus;
  isCalibrating: boolean;
  lastCalibratedAt: number | null;
  startCalibration: () => Promise<void>;
  cancelCalibration: () => void;
  resetCalibration: () => void;
}

export const useDeviceCalibration = (): UseDeviceCalibrationResult => {
  const [status, setStatus] = useState<CalibrationStatus>('idle');
  const [lastCalibratedAt, setLastCalibratedAt] = useState<number | null>(null);

  const startCalibration = useCallback(async () => {
    if (!bleManager.isConnected) {
      accessibilityEngine.announce('Cannot calibrate: device is not connected', 'high', true);
      return;
    }

    setStatus('in_progress');
    accessibilityEngine.announce('Calibration started. Keep the device steady.', 'high', false);
    logger.info('[useDeviceCalibration] Starting calibration');

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      bleManager.sendControlCommand('calibrate');
      setStatus('complete');
      setLastCalibratedAt(Date.now());
      accessibilityEngine.announce('Calibration complete', 'high', false);
      logger.info('[useDeviceCalibration] Calibration complete');
    } catch (error) {
      setStatus('failed');
      accessibilityEngine.announce('Calibration failed. Please try again.', 'high', true);
      logger.error('[useDeviceCalibration] Calibration failed:', error);
    }
  }, []);

  const cancelCalibration = useCallback(() => {
    setStatus('idle');
    accessibilityEngine.announce('Calibration cancelled', 'normal', false);
    logger.info('[useDeviceCalibration] Calibration cancelled');
  }, []);

  const resetCalibration = useCallback(() => {
    setStatus('idle');
    setLastCalibratedAt(null);
  }, []);

  return {
    status,
    isCalibrating: status === 'in_progress',
    lastCalibratedAt,
    startCalibration,
    cancelCalibration,
    resetCalibration,
  };
};
