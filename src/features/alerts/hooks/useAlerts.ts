import { useAppSelector, useAppDispatch } from '@app/store';
import { alertsActions } from '@app/store/slices/alertsSlice';
import { eventBus, EVENTS } from '../../../core';
import { useCallback, useEffect } from 'react';
import type { Alert } from '../types';

export const useAlerts = () => {
  const dispatch = useAppDispatch();
  const { alerts, unreadCount } = useAppSelector(state => state.alerts);

  const addAlert = useCallback(
    (alert: Omit<Alert, 'id' | 'timestamp' | 'read' | 'dismissed'>) => {
      dispatch(alertsActions.addAlert(alert));
    },
    [dispatch],
  );

  const markAsRead = useCallback(
    (alertId: string) => {
      dispatch(alertsActions.markAsRead(alertId));
    },
    [dispatch],
  );

  const markAllAsRead = useCallback(() => {
    dispatch(alertsActions.markAllAsRead());
  }, [dispatch]);

  const dismissAlert = useCallback(
    (alertId: string) => {
      dispatch(alertsActions.dismissAlert(alertId));
    },
    [dispatch],
  );

  useEffect(() => {
    const unsubObstacle = eventBus.subscribe(
      EVENTS.AI_OBSTACLE_DETECTED,
      (payload: { type: string; severity: string }) => {
        addAlert({
          type: payload.severity === 'danger' ? 'danger' : 'warning',
          title: 'Obstacle Detected',
          message: `${payload.type} detected nearby`,
          source: 'ai',
        });
      },
    );

    const unsubEmergency = eventBus.subscribe(EVENTS.EMERGENCY_TRIGGERED, () => {
      addAlert({
        type: 'danger',
        title: 'Emergency Activated',
        message: 'Emergency alert has been triggered',
        source: 'emergency',
      });
    });

    return () => {
      unsubObstacle();
      unsubEmergency();
    };
  }, [addAlert]);

  return {
    alerts,
    unreadCount,
    addAlert,
    markAsRead,
    markAllAsRead,
    dismissAlert,
  };
};
