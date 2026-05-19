import { useAppDispatch, useAppSelector } from '@app/store';
import { navigationActions } from '@app/store/slices/navigationSlice';
import { eventBus, EVENTS, accessibilityEngine, ttsService } from '../../../core';
import { useCallback } from 'react';

export const useNavigation = () => {
  const dispatch = useAppDispatch();
  const navigation = useAppSelector(state => state.navigation);
  const settings = useAppSelector(state => state.settings);

  const startNavigation = useCallback(
    async (destination: string) => {
      dispatch(navigationActions.startNavigation(destination));
      eventBus.publish(EVENTS.NAVIGATION_STARTED, { destination }, 'normal');
      accessibilityEngine.announceNavigationChange('Navigation');
      if (settings.ttsEnabled) {
        await ttsService.speak(`Navigation started to ${destination}`, 'normal');
      }
    },
    [dispatch, settings.ttsEnabled],
  );

  const stopNavigation = useCallback(async () => {
    dispatch(navigationActions.stopNavigation());
    eventBus.publish(EVENTS.NAVIGATION_STOPPED, {}, 'normal');
    if (settings.ttsEnabled) {
      await ttsService.speak('Navigation stopped', 'normal');
    }
  }, [dispatch, settings.ttsEnabled]);

  const pauseNavigation = useCallback(() => {
    dispatch(navigationActions.pauseNavigation());
  }, [dispatch]);

  const resumeNavigation = useCallback(() => {
    dispatch(navigationActions.resumeNavigation());
  }, [dispatch]);

  return {
    ...navigation,
    startNavigation,
    stopNavigation,
    pauseNavigation,
    resumeNavigation,
  };
};
