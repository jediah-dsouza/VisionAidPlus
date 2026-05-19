import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useReducedMotion } from '@shared/design-system/hooks/useReducedMotion';

export type ScreenOptions = NativeStackNavigationOptions;

export const getDefaultScreenOptions = (): ScreenOptions => ({
  headerShown: false,
  animation: 'default',
  gestureEnabled: true,
});

export const getModalScreenOptions = (): ScreenOptions => ({
  ...getDefaultScreenOptions(),
  animation: 'slide_from_bottom',
  presentation: 'modal',
});

export const getNoAnimationOptions = (): ScreenOptions => ({
  ...getDefaultScreenOptions(),
  animation: 'none',
  gestureEnabled: false,
});

export const useAccessibilitySafeTransition = (): ScreenOptions => {
  const reducedMotion = useReducedMotion();

  return reducedMotion
    ? {
        animation: 'none',
        gestureEnabled: false,
      }
    : {
        animation: 'slide_from_right',
        gestureDirection: 'horizontal',
      };
};

export const screenTransitionPresets = {
  default: { animation: 'slide_from_right' },
  modal: { animation: 'slide_from_bottom' },
  card: { animation: 'slide_from_right' },
  fade: { animation: 'fade' },
} as const;

export const getScreenOptionsBuilder = () => {
  return (options?: Partial<ScreenOptions>): ScreenOptions => {
    return {
      ...getDefaultScreenOptions(),
      ...options,
    };
  };
};
