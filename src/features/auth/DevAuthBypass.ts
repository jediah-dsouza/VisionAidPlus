/**
 * DEV ONLY: Authentication Bypass for Dashboard Testing
 *
 * TEMPORARY DEVELOPMENT LOGIC - DO NOT USE IN PRODUCTION
 *
 * This module provides a mock authenticated state for rapid dashboard
 * testing during Phase 6 development. It is only active when __DEV__ is true.
 *
 * Features:
 * - Auto-authenticates a mock user on app launch
 * - Skips Login/Register screens during development
 * - Preserves existing Redux auth architecture
 * - Does not affect production builds
 *
 * To disable: Set DEV_AUTH_BYPASS_ENABLED = false or remove this file
 */

// ============================================================================
// CONFIGURATION - Set to false to disable dev auth bypass
// ============================================================================
const DEV_AUTH_BYPASS_ENABLED = __DEV__;

if (!DEV_AUTH_BYPASS_ENABLED) {
  console.log('[DevAuth] Bypass disabled - using normal auth flow');
}

// ============================================================================
// MOCK USER DATA - Change as needed for testing
// ============================================================================
export const MOCK_USER = {
  id: 'dev-user-001',
  email: 'dev@visionaid.test',
  name: 'Dev Test User',
  createdAt: new Date().toISOString(),
  emergencyContacts: [
    {
      id: 'contact-001',
      name: 'Emergency Contact',
      phone: '+1234567890',
      relationship: 'Caregiver',
      isPrimary: true,
      notifyOnEmergency: true,
    },
  ],
};

export const MOCK_TOKEN = 'dev-mock-token-123456789';

// ============================================================================
// DEV AUTH STATE - Singleton for managing mock auth
// ============================================================================
interface DevAuthState {
  isAuthenticated: boolean;
  user: typeof MOCK_USER;
  token: string;
  onboardingComplete: boolean;
}

let devAuthState: DevAuthState = {
  isAuthenticated: false,
  user: MOCK_USER,
  token: MOCK_TOKEN,
  onboardingComplete: true,
};

export const getDevAuthState = (): DevAuthState => devAuthState;

export const setDevAuthState = (state: Partial<DevAuthState>): void => {
  devAuthState = { ...devAuthState, ...state };
};

export const resetDevAuthState = (): void => {
  devAuthState = {
    isAuthenticated: false,
    user: MOCK_USER,
    token: MOCK_TOKEN,
    onboardingComplete: true,
  };
};

// ============================================================================
// DEV AUTH UTILITIES
// ============================================================================

/**
 * Check if dev auth bypass is enabled
 * @returns boolean - true if bypass is active
 */
export const isDevAuthBypassEnabled = (): boolean => DEV_AUTH_BYPASS_ENABLED;

/**
 * Check if we should bypass authentication in dev mode
 * @returns boolean - true if auth should be bypassed
 */
export const shouldBypassAuth = (): boolean => {
  return DEV_AUTH_BYPASS_ENABLED;
};

/**
 * Check if we should bypass onboarding in dev mode
 * @returns boolean - true if onboarding should be bypassed
 */
export const shouldBypassOnboarding = (): boolean => {
  return DEV_AUTH_BYPASS_ENABLED;
};

/**
 * Get mock auth data for Redux initialization
 * Use this in store initialization or splash screen
 */
export const getMockAuthData = (): { user: typeof MOCK_USER; token: string } => {
  if (!DEV_AUTH_BYPASS_ENABLED) {
    return { user: null as any, token: null as any };
  }

  return {
    user: MOCK_USER,
    token: MOCK_TOKEN,
  };
};

/**
 * Log dev auth status to console
 */
export const logDevAuthStatus = (): void => {
  if (!DEV_AUTH_BYPASS_ENABLED) {
    console.log('[DevAuth] Disabled - using normal auth flow');
    return;
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('  DEV AUTH BYPASS ACTIVE - TESTING MODE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  User:     ${MOCK_USER.name}`);
  console.log(`  Email:    ${MOCK_USER.email}`);
  console.log(`  Token:    ${MOCK_TOKEN.slice(0, 20)}...`);
  console.log(`  Onboarding: ${devAuthState.onboardingComplete ? 'COMPLETE' : 'PENDING'}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  This bypass is ONLY active in __DEV__ mode');
  console.log('  Set DEV_AUTH_BYPASS_ENABLED = false to disable');
  console.log('═══════════════════════════════════════════════════════════');
};

// ============================================================================
// REDUX INTEGRATION HELPERS
// ============================================================================

/**
 * Get initial auth state for Redux store (dev only)
 * Returns null in production to preserve normal auth flow
 */
export const getInitialAuthState = (): {
  isAuthenticated: boolean;
  user: typeof MOCK_USER | null;
  token: string | null;
} | null => {
  if (!DEV_AUTH_BYPASS_ENABLED) {
    return null;
  }

  console.log('[DevAuth] Setting mock authenticated state');

  return {
    isAuthenticated: true,
    user: MOCK_USER,
    token: MOCK_TOKEN,
  };
};

/**
 * Get initial settings state for Redux store (dev only)
 * Includes hasCompletedOnboarding = true for bypass
 */
export const getInitialSettingsState = (): { hasCompletedOnboarding: boolean } | null => {
  if (!DEV_AUTH_BYPASS_ENABLED) {
    return null;
  }

  return {
    hasCompletedOnboarding: true,
  };
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================
/*
// In AppNavigator.tsx or SplashScreen.tsx:

import {
  isDevAuthBypassEnabled,
  getMockAuthData,
  logDevAuthStatus,
} from './DevAuthBypass';

const MyComponent = () => {
  useEffect(() => {
    if (isDevAuthBypassEnabled()) {
      logDevAuthStatus();
      // Initialize mock auth state in Redux
      dispatch(setMockAuthState(getMockAuthData()));
    }
  }, []);

  // In getInitialRoute():
// if (isDevAuthBypassEnabled()) return 'Main';
// ... normal auth logic
};
*/
