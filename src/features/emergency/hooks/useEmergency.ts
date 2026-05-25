import { useAppDispatch, useAppSelector } from '@app/store';
import { emergencyActions } from '@app/store/slices/emergencySlice';
import { eventBus, EVENTS } from '@core/events/EventBus';
import { accessibilityEngine } from '@core/accessibility';
import {
  emergencyManager,
  emergencyStateMachine,
  emergencyCountdownManager,
  emergencyContactManager,
  emergencyGPSPipeline,
  emergencySMSPipeline,
} from '@core/emergency';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { EmergencyContact } from '../types';
import env from '../../../env';

export const useEmergency = () => {
  const dispatch = useAppDispatch();
  const emergency = useAppSelector(state => state.emergency);
  const mountedRef = useRef(true);
  const countdownListenerCleanup = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    emergencyManager.initialize();

    countdownListenerCleanup.current = emergencyCountdownManager.addListener({
      onTick: (remaining: number) => {
        if (!mountedRef.current) return;
        dispatch(emergencyActions.updateCountdown(remaining));
      },
      onExpired: () => {
        if (!mountedRef.current) return;
        dispatch(emergencyActions.triggerEmergency({ sessionId: emergencyManager.getSession()?.id }));
        accessibilityEngine.announce(
          'Emergency activated. Notifying emergency contacts.',
          'critical',
          true,
        );
      },
      onCancelled: () => {
        if (!mountedRef.current) return;
        dispatch(emergencyActions.saveSessionToHistory());
        dispatch(emergencyActions.resetEmergency());
      },
    });

    return () => {
      countdownListenerCleanup.current?.();
    };
  }, [dispatch]);

  const startCountdown = useCallback((durationOverride?: number) => {
    const duration = durationOverride ?? env.EMERGENCY_COUNTDOWN_SECONDS;
    dispatch(emergencyActions.startCountdown(duration));
    emergencyManager.startCountdown(duration);

    accessibilityEngine.announce(
      `Emergency will activate in ${duration} seconds. Tap to cancel.`,
      'critical',
      true,
    );
    accessibilityEngine.triggerHaptic('emergency');
  }, [dispatch]);

  const triggerEmergency = useCallback(async () => {
    emergencyCountdownManager.confirm();

    const sessionId = emergencyManager.getSession()?.id;
    dispatch(emergencyActions.triggerEmergency({ sessionId }));
    dispatch(emergencyActions.setSending());

    accessibilityEngine.enterEmergencyMode();
    accessibilityEngine.announce(
      'Emergency activated. Sending alerts to emergency contacts.',
      'critical',
      true,
    );
    accessibilityEngine.triggerHaptic('emergency');

    eventBus.publish(EVENTS.EMERGENCY_TRIGGERED, { triggeredAt: Date.now() }, 'critical');

    const location = await emergencyGPSPipeline.prepareLocation();
    if (location && mountedRef.current) {
      dispatch(emergencyActions.setGpsCoordinates({
        latitude: location.latitude,
        longitude: location.longitude,
      }));
    }

    const contacts = emergencyContactManager.getNotifiableContacts();
    if (contacts.length > 0 && mountedRef.current) {
      const messages = await emergencySMSPipeline.sendEmergencyAlerts(
        contacts,
        location ? { latitude: location.latitude, longitude: location.longitude } : null,
      );
      if (mountedRef.current) {
        dispatch(emergencyActions.setSmsSent(messages.filter(m => m.status === 'sent').length));
        dispatch(emergencyActions.setSmsFailed(messages.filter(m => m.status === 'failed').length));
        dispatch(emergencyActions.incrementContactsNotified(
          messages.filter(m => m.status === 'sent').length,
        ));
        dispatch(emergencyActions.incrementContactsFailed(
          messages.filter(m => m.status === 'failed').length,
        ));
      }
    }

    if (mountedRef.current) {
      dispatch(emergencyActions.saveSessionToHistory());
    }
  }, [dispatch]);

  const cancelEmergency = useCallback(() => {
    emergencyManager.cancelEmergency();
    dispatch(emergencyActions.cancelEmergency());
    accessibilityEngine.exitEmergencyMode();
    accessibilityEngine.announce('Emergency cancelled', 'high', true);
  }, [dispatch]);

  const resolveEmergency = useCallback(() => {
    emergencyManager.resolveEmergency();
    dispatch(emergencyActions.saveSessionToHistory());
    dispatch(emergencyActions.resolveEmergency());
    setTimeout(() => {
      if (mountedRef.current) {
        dispatch(emergencyActions.resetEmergency());
      }
    }, 5000);
    accessibilityEngine.announce('Emergency resolved', 'high', true);
  }, [dispatch]);

  const resetEmergency = useCallback(() => {
    emergencyManager.reset();
    dispatch(emergencyActions.resetEmergency());
  }, [dispatch]);

  const addContact = useCallback((contact: Omit<EmergencyContact, 'id'>) => {
    const newContact = emergencyContactManager.addContact(contact);
    newContact.then(c => {
      dispatch(emergencyActions.addContact(c));
    }).catch(err => {
      console.error('[useEmergency] Failed to add contact', err);
    });
  }, [dispatch]);

  const updateContact = useCallback((id: string, updates: Partial<EmergencyContact>) => {
    emergencyContactManager.updateContact(id, updates).then(c => {
      dispatch(emergencyActions.updateContact(c));
    }).catch(err => {
      console.error('[useEmergency] Failed to update contact', err);
    });
  }, [dispatch]);

  const removeContact = useCallback((id: string) => {
    emergencyContactManager.removeContact(id).then(() => {
      dispatch(emergencyActions.removeContact(id));
    }).catch(err => {
      console.error('[useEmergency] Failed to remove contact', err);
    });
  }, [dispatch]);

  const escalate = useCallback(() => {
    emergencyManager.escalate();
    dispatch(emergencyActions.setEscalationAttempts(
      emergencyManager.getSession()?.escalationAttempts ?? 0,
    ));
  }, []);

  const canStartCountdown = useMemo(
    () => emergencyStateMachine.canTransition('START_COUNTDOWN'),
    [emergency.status],
  );

  const canCancel = useMemo(
    () => emergencyStateMachine.canTransition('CANCEL_EMERGENCY'),
    [emergency.status],
  );

  return {
    ...emergency,
    isActive: emergencyManager.isActive,
    canStartCountdown,
    canCancel,
    startCountdown,
    triggerEmergency,
    cancelEmergency,
    resolveEmergency,
    resetEmergency,
    addContact,
    updateContact,
    removeContact,
    escalate,
  };
};
