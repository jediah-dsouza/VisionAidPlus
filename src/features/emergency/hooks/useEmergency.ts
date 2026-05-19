import { useAppDispatch, useAppSelector, store } from '@app/store';
import { emergencyActions } from '@app/store/slices/emergencySlice';
import { eventBus, EVENTS, accessibilityEngine, ttsService } from '../../../core';
import { useCallback, useEffect, useRef } from 'react';

export const useEmergency = () => {
  const dispatch = useAppDispatch();
  const emergency = useAppSelector(state => state.emergency);
  const settings = useAppSelector(state => state.settings);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = useCallback(() => {
    const seconds = settings.emergencyCountdown;
    dispatch(emergencyActions.startCountdown(seconds));
    accessibilityEngine.announce(
      `Emergency will be activated in ${seconds} seconds. Press cancel to abort.`,
      'critical',
      true,
    );

    countdownRef.current = setInterval(() => {
      const current = store.getState()?.emergency?.countdownRemaining ?? 0;
      if (current <= 1) {
        triggerEmergency();
      } else {
        dispatch(emergencyActions.updateCountdown(current - 1));
        accessibilityEngine.announce(`${current - 1}`, 'high');
      }
    }, 1000);
  }, [dispatch, settings.emergencyCountdown]);

  const triggerEmergency = useCallback(async () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    dispatch(emergencyActions.triggerEmergency());
    accessibilityEngine.triggerHaptic('error');
    await ttsService.speak('Emergency activated. Notifying emergency contacts.', 'critical');
    eventBus.publish(EVENTS.EMERGENCY_TRIGGERED, {}, 'critical');
  }, [dispatch]);

  const cancelEmergency = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    dispatch(emergencyActions.cancelEmergency());
    accessibilityEngine.announce('Emergency cancelled', 'normal', true);
    eventBus.publish(EVENTS.EMERGENCY_CANCELLED, {}, 'normal');
  }, [dispatch]);

  const resetEmergency = useCallback(() => {
    dispatch(emergencyActions.resetEmergency());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  return {
    ...emergency,
    startCountdown,
    triggerEmergency,
    cancelEmergency,
    resetEmergency,
  };
};
