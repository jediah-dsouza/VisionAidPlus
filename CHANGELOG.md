# VisionAid+ Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

#### Accessibility Engine (Phase 4)

- Created centralized accessibility architecture as CORE SYSTEM
- Created VoiceQueue system with priority-based message queuing (critical, high, normal, low)
- Created SpeechController with interruption handling, pause/resume, and retry logic
- Created EventPriorityMapper for event-to-priority mapping (emergency, obstacle, navigation, alert, device, system)
- Created HapticCoordinator with voice coordination, pattern definitions, and priority-based haptics
- Created FocusManager with focus history, focus traps, and accessibility announcements
- Created AccessibilityEventEmitter for real-time accessibility events
- Created accessibility hooks: useReducedMotion, useScreenReaderEnabled, useBoldTextEnabled, useGrayscaleEnabled, useInvertColorsEnabled, useHighContrastEnabled, useAccessibilitySettings, useAnnounce, useHaptic, useAccessibility
- Created AccessibilityWrapper components: AccessibleView, LiveRegion, AccessibilityButton, AccessibilityContainer
- Created SemanticUtils for screen reader optimization (toggle, progress, slider formatting)
- Emergency mode with critical priority interruption
- Quiet hours support for accessibility announcements

#### Accessibility Engine Stabilization (Sprint)

**CRITICAL Fixes:**

- Added destroy() lifecycle method to AccessibilityEngine with full cleanup
- Added destroy() to SpeechController with setTimeout cleanup and Promise mutex
- Added destroy() to AccessibilityEventEmitter with bounded history (max 100)
- Added destroy() to HapticCoordinator and FocusManager

**HIGH Priority Fixes:**

- Fixed SpeechController race conditions using Promise-based mutex pattern
- Removed duplicate state listeners in AccessibilityEngine.setupSpeechController()
- Added proper eventBus subscription cleanup on destroy()
- Bound pending haptic queue (max 10) in HapticCoordinator
- Added mounted guards to all useEffect hooks to prevent state updates after unmount

**Refactoring:**

- Consolidated AccessibilityInfo listeners across hooks
- Created useAccessibility composable hook for unified access
- Removed dead code: AccessibilityWrapper complex HOCs, unused EventPriorityMapper custom mappings, broken vibration checks
- Simplified semantic.ts to only useful utilities
- Added initialization safety guards (ensureInitialized, destroyed checks)
- Added error resilience with try-catch wrappers in hooks

**Tests Added:**

- VoiceQueue priority ordering tests
- SpeechController state management and cleanup tests
- Interruption behavior tests
- Queue concurrency tests
- Lifecycle cleanup tests

#### Project Setup

- Initialized React Native 0.85.3 project with TypeScript
- Configured ESLint with TypeScript support
- Configured Prettier code formatter
- Configured Husky for git hooks
- Configured lint-staged for pre-commit linting
- Set up path aliases (@app, @core, @features, @shared, @env)
- Created scalable folder structure (app/, core/, features/, shared/)

#### Navigation Architecture

- Created Root stack navigator with typed routes
- Created Auth stack navigator (Login, Register, ForgotPassword)
- Created Onboarding stack navigator (Welcome, Permissions, DevicePairing, Complete)
- Created Main Tab navigator with 5 tabs (Home, Navigation, Alerts, Device, Settings)
- Created Emergency stack navigator
- Created Modal stack navigator
- Created Calibration stack navigator
- Implemented typed navigation with RootStackParamList
- Added navigation guards and utilities
- Added screen options configuration

#### State Management

- Created Redux Toolkit store with 8 slices:
  - authSlice for authentication state
  - bleSlice for BLE device state
  - aiSlice for AI detection state
  - ttsSlice for text-to-speech state
  - settingsSlice for user preferences
  - emergencySlice for emergency handling
  - navigationSlice for navigation state
  - alertsSlice for alert management
- Configured typed useAppSelector and useAppDispatch hooks

#### Design System

- Created comprehensive theme tokens:
  - Color tokens (primary, secondary, neutral, success, warning, danger, info)
  - Spacing tokens (0-48, sm, md, lg, xl)
  - Radius tokens (none, xs, sm, base, md, lg, xl, 2xl, 3xl, full)
  - Typography tokens
- Created semantic tokens:
  - Background colors (default, subtle, muted, emphasized)
  - Foreground colors (default, muted, subtle, disabled)
  - Surface colors (default, elevated, overlay)
  - Border colors (default, muted, emphasis)
  - Touch target minimum (48px for accessibility)
- Created 11 accessible UI components:
  - Button component with variants (primary, secondary, outline, ghost, danger)
  - Card component with variants (default, elevated, outline, ghost)
  - Input component with label, error, hint, variants
  - Slider component
  - Toggle component
  - Modal component with animations
  - Loader component
  - EmptyState component
  - FAB (Floating Action Button) component
  - Alert component
  - VoiceFeedbackBanner component

#### Core Services

- Created EventBus service with priority levels (critical, high, normal, low)
- Created BLEService for Bluetooth device management
- Created AIService for AI obstacle detection
- Created TTSService for text-to-speech
- Created AccessibilityEngine for screen reader announcements
- Created StorageService for persistent storage
- Created ErrorHandler with error boundaries

#### Feature Modules

- Created Home feature with HomeScreen
- Created Device feature with DeviceScreen
- Created Alerts feature with AlertsScreen
- Created Settings feature with SettingsScreen
- Created Emergency feature with EmergencyScreen
- Created Navigation feature with NavigationScreen

#### Hooks

- Created useReducedMotion hook
- Created useScreenReaderEnabled hook
- Created useHome hook
- Created useDevice hook
- Created useAlerts hook
- Created useSettings hook
- Created useEmergency hook
- Created useNavigation hook

### Fixed

#### TypeScript Fixes

- Fixed NavigationContainerRef generic type argument
- Fixed onStateChange callback signature in NavigationContainer
- Fixed screen options type compatibility with NativeStackNavigationOptions
- Fixed Stack Navigator missing 'id' prop requirements
- Fixed Tab Navigator icon type compatibility
- Fixed import type issues (TransitionPresets, CommonActions)
- Fixed spacing tokens missing sm, md, lg, xl keys
- Fixed semantic tokens missing neutral and dark color keys
- Fixed semantic tokens missing subtle and muted keys for info colors
- Fixed semantic tokens missing radius aliases

#### Component Fixes

- Fixed Button component missing style prop
- Fixed Input component missing disabled prop
- Fixed Input component accessibilityState invalid property
- Fixed Loader component StyleSheet.absoluteFillObject to absoluteFill
- Fixed Modal component accessibilityModal property
- Fixed Card component ViewStyle import
- Fixed Card component ref type compatibility
- Fixed VoiceFeedbackBanner variable naming conflict
- Fixed EmergencyScreen danger.dark to danger.subtle

#### Import Path Fixes

- Fixed @core/events imports to use relative paths in core files
- Fixed @core/storage imports to use relative paths in feature files
- Fixed @core/accessibility imports to use relative paths
- Fixed @core/native imports to use relative paths
- Fixed @core/debug import in ErrorHandler

#### Export Conflicts

- Fixed AIConfig export conflict in AIService
- Fixed TTSConfig export conflict in TTSService

#### Navigation Fixes

- Fixed screenNames.ts duplicate RootStackParamList declaration
- Fixed NavigationGuard replace method using CommonActions
- Fixed NavigationGuard popToTop method implementation
- Fixed getState usage in useDevice and useEmergency hooks
- Fixed nested NavigationContainer runtime error - consolidated to single root container at app entry
- Removed nested NavigationContainer from AppNavigator, moved to root level in index.tsx
- Added NavigationWrapper component with theme configuration and state change handling
- Ensured compatibility with React Navigation v7

#### Android Build Fixes

- Fixed ProductFlavor "staging" name collision with BuildType (renamed to "stagingEnv")
- Fixed obsolete native_modules.gradle reference (removed, autolinking handled by React Native 0.85+)

#### Environment System Fixes

- Removed react-native-dotenv and @env path alias (conflicted with custom env.ts)
- Deleted env.d.ts (obsolete TypeScript declaration for @env)
- Replaced all @env imports with relative paths to env.ts in 5 files:
  - app/index.tsx, core/native/TTSService.ts, core/native/AIService.ts, core/native/BLEService.ts, core/debug/index.ts
- Removed @env from tsconfig.json paths

#### Path Alias Resolution Fixes

- Added babel-plugin-module-resolver to babel.config.js
- Configured aliases (@, @app, @core, @features, @shared) to match metro.config.js and tsconfig.json
- Fixed Metro bundler unable to resolve @core/debug and other path aliases
- Ensured Babel, Metro, and TypeScript alias configuration is aligned

#### TypeScript Fixes

- Fixed StorageService.ts readonly array type error (getAllKeys return type)

### Changed

#### Refactoring

- Refactored navigation screens to use stable component references instead of inline arrow functions
- Renamed typeStyles to bannerTypeStyles in VoiceFeedbackBanner to avoid naming conflict
- Added Alert interface missing source property in alertsSlice

### Removed

- Removed unused imports (useEffect in SplashScreen, getDefaultScreenOptions in AppNavigator)

---

## [1.0.0] - Development Started

### Added

- Initial project structure created
- React Native 0.85.3 with TypeScript
- Android-first development configuration
- Dark-first theme with high contrast
- 48px minimum touch targets for accessibility
- WCAG 2.1 AA compliance targets

---

## Notes

- BLE latency target: <100ms
- TTS delay target: <150ms
- All components must be accessibility-optimized
- Build variants: debug, staging, release

---

## Known Issues

- 46 lint warnings remaining (mostly unused imports and any types)
