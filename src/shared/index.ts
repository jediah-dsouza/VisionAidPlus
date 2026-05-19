export * from './constants';
export * from './theme';
export * from './types';

export { default as logger } from '@core/debug';

export const APP_CONFIG = {
  name: 'VisionAid+',
  version: '1.0.0',
  minTouchTarget: 48,
  animationDuration: 300,
  debounceDelay: 300,
} as const;
