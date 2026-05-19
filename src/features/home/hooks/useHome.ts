import { useAppSelector } from '@app/store';
import { eventBus, EVENTS } from '../../../core';
import { useEffect } from 'react';

export const useHome = () => {
  const bleStatus = useAppSelector(state => state.ble.status);
  const aiStatus = useAppSelector(state => state.ai.status);
  const emergencyStatus = useAppSelector(state => state.emergency.status);

  const summary = {
    deviceConnected: bleStatus === 'connected',
    aiActive: aiStatus === 'detecting' || aiStatus === 'processing',
    emergencyActive: emergencyStatus !== 'idle',
    lastObstacle: useAppSelector(state => state.ai.currentObstacle),
  };

  useEffect(() => {
    const unsubscribe = eventBus.subscribe(EVENTS.AI_OBSTACLE_DETECTED, payload => {
      console.log('Home: Obstacle detected', payload);
    });

    return unsubscribe;
  }, []);

  return { summary, bleStatus, aiStatus, emergencyStatus };
};
