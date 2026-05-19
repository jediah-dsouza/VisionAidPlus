import { CommonActions } from '@react-navigation/native';
import type { NavigationContainerRef } from '@react-navigation/native';
import { accessibilityEngine, logger } from '../../../core';

export interface NavigationGuardConfig {
  onNavigate?: (route: string) => boolean;
  onStateChange?: (previousRoute: string | null, currentRoute: string) => void;
}

class NavigationGuard {
  private navigationRef: NavigationContainerRef<any> | null = null;
  private previousRoute: string | null = null;
  private config: NavigationGuardConfig = {};

  setNavigationRef(ref: NavigationContainerRef<any>): void {
    this.navigationRef = ref;
  }

  setConfig(config: NavigationGuardConfig): void {
    this.config = config;
  }

  onNavigationStateChange(currentState: any): void {
    if (!currentState) return;

    const currentRoute = currentState.routes?.[currentState.index]?.name;

    if (this.previousRoute !== currentRoute) {
      logger.debug(`Navigation: ${this.previousRoute} -> ${currentRoute}`);

      accessibilityEngine.announceNavigationChange(currentRoute as string);

      this.config.onStateChange?.(this.previousRoute, currentRoute as string);

      this.previousRoute = currentRoute;
    }
  }

  canNavigate(routeName: string): boolean {
    const allowed = this.config.onNavigate?.(routeName) ?? true;
    if (!allowed) {
      logger.warn(`Navigation blocked to: ${routeName}`);
    }
    return allowed;
  }

  getCurrentRoute(): string | null {
    return this.previousRoute;
  }

  navigate(routeName: string, params?: Record<string, any>): void {
    if (!this.canNavigate(routeName)) return;

    this.navigationRef?.navigate(routeName, params);
  }

  replace(routeName: string, params?: Record<string, any>): void {
    if (!this.canNavigate(routeName)) return;

    this.navigationRef?.dispatch(CommonActions.navigate({ name: routeName, params }));
  }

  reset(state: any): void {
    this.navigationRef?.dispatch(CommonActions.reset(state));
  }

  goBack(): void {
    this.navigationRef?.goBack();
  }

  popToTop(): void {
    this.navigationRef?.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  }
}

export const navigationGuard = new NavigationGuard();

export const navigateToHome = () => {
  navigationGuard.navigate('Main', {
    screen: 'HomeTab',
    params: { screen: 'Home' },
  });
};

export const navigateToEmergency = () => {
  navigationGuard.navigate('Emergency', {
    screen: 'EmergencyHome',
  });
};

export const navigateToAuth = (screen: string = 'Login') => {
  navigationGuard.navigate('Auth' as any, {
    screen,
  });
};

export const resetToMain = () => {
  navigationGuard.reset({
    index: 0,
    routes: [{ name: 'Main' }],
  });
};

export const resetToOnboarding = () => {
  navigationGuard.reset({
    index: 0,
    routes: [{ name: 'Onboarding', params: { screen: 'Welcome' } }],
  });
};
