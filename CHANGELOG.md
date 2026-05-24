# VisionAid+ Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

#### Android VIBRATE Permission & Haptic Fail-Safe System (2026-05-22)

- Added `android.permission.VIBRATE` to `android/app/src/main/AndroidManifest.xml`
- Added `canVibrate` auto-disable flag to `HapticCoordinator` — disables all haptics on first failure without crashing
- Wrapped all `Vibration.vibrate()` and `Vibration.cancel()` calls in try/catch with `console.warn('[Haptics] ...')` 
- Wrapped all `hapticCoordinator.*` calls in `AccessibilityEngine` in try/catch (8 call sites across `triggerHaptic`, `triggerHapticByPriority`, `enterEmergencyMode`, `updateConfig`, `setupSpeechController`, `announceFromEvent`)
- All event simulations (BLE, AI, Emergency) continue normally when haptics fail — EventBus publishes, Redux dispatches, widgets update, speech works

#### Phase 6.5 - Dashboard Dev Testing Harness

**Dev Simulation Engine:**

- Created `src/features/home/dev/DevSimulationEngine.ts` - Phase 6 dashboard validation harness
- Implemented simulation methods for BLE events (connect, disconnect, low battery, weak signal, reconnecting)
- Implemented simulation methods for AI events (obstacle, danger, warning, clear)
- Implemented simulation methods for Emergency events (trigger, cancel)
- Implemented simulation methods for Navigation events (start, stop)
- Added comprehensive debug logging across entire simulation pipeline
- Added simulation metrics tracking (total events, latency, active listeners, render count)
- Added event log with lifecycle tracking (EventBus, middleware, Redux, accessibility, UI render status)
- Added stress test mode with configurable duration
- Added validation methods for emergency state and BLE connection state

**Dashboard Dev Panel:**

- Created `src/features/home/dev/DashboardDevPanel.tsx` - Main dev testing panel
- Implemented 6-tab interface: Simulation, Console, Validation, Stress, Metrics, Summary
- Created simulation controls grid with BLE, AI, Emergency, Navigation event buttons
- Created custom AI obstacle simulation controls (left, center, right with distance)
- Created Force Redux Dispatch buttons for bypassing EventBus to test Redux directly:
  - Force BLE Connected/Disconnected
  - Force AI Obstacle
  - Force Emergency
  - Log Redux State
- Integrated DevEventConsole for event log display
- Integrated DevValidationIndicators for validation status
- Integrated DevStressTest for stress testing controls
- Integrated DevMetrics for performance metrics
- Integrated DevValidationSummary for validation results

**Dev Event Console:**

- Created `src/features/home/dev/DevEventConsole.tsx` - Event log panel
- Displays timestamp, event name, and 4 status indicators per event
- Status indicators: EventBus, Middleware, Redux, UI Render
- Color-coded status: pending (gray), success (green), failed (red), skipped (yellow)
- Expandable event rows showing full lifecycle details and payload
- Auto-scroll toggle and clear functionality
- Legend showing status color meanings

**Dev Validation Components:**

- Created `src/features/home/dev/DevValidationIndicators.tsx` - Validation status display
- Created `src/features/home/dev/DevStressTest.tsx` - Stress test controls
- Created `src/features/home/dev/DevMetrics.tsx` - Performance metrics display
- Created `src/features/home/dev/DevValidationSummary.tsx` - Validation summary

**Debug Logging Infrastructure:**

- Added unique instance ID to EventBus constructor for duplicate detection
- Added instance ID prefix to all EventBus logs ([EventBus#1], [EventBus#2], etc.)
- Added stack trace logging on EventBus instance creation
- Added comprehensive subscribe/unsubscribe logging with handler counts
- Added publish logging with payload and all registered subscriptions
- Added handler invocation logging with error handling
- Added debug logging to DashboardEventMiddleware for all BLE, AI, Emergency subscriptions
- Added debug logging to DevSimulationEngine simulate() method with payload, state, and latency
- Added render logging to BLEStatusWidget showing selector execution and state

**Accessibility Engine Initialization:**

- Added `accessibilityEngine.initialize()` call at app startup in `__DEV__` mode
- Ensures AccessibilityEngine is ready before announcing messages
- Added debug logging confirming initialization

#### Phase 6 - Home Dashboard System

**Dashboard Architecture:**

- Created modular dashboard widget system (`src/features/home/dashboard/`)
- Created DashboardEventMiddleware for EventBus-to-Redux integration
- Created dashboard types with WidgetStatus, BLEStatusData, AIStatusData, EmergencyStatusData
- Implemented DEFAULT_DASHBOARD_CONFIG with refreshInterval, maxObstacleHistory, alertTimeout

**Dashboard Widgets:**

- Created BLEStatusWidget with signal strength bars, battery level, connect/disconnect actions
- Created AIStatusWidget with detection count, current obstacle preview, start/stop controls
- Created ObstacleDetectionCard with severity colors, distance display, direction indicator, voice instructions
- Created AIInstructionBanner with auto-dismiss, replay, and dismiss functionality
- Created EmergencyFAB with countdown animation, cancel functionality, position prop support
- Created QuickActions and QuickActionsPreset with grid/row/stack layouts

**Dashboard Hooks:**

- Created useDashboard hook for centralized dashboard state management
- Created useDashboardWidget for widget-level auto-refresh logic
- Created useObstacleHistory for detection history with maxItems limit
- Created useDeviceStatus for BLE device connection status
- Created useAIStatus for AI detection status monitoring

**HomeScreen Updates:**

- Updated HomeScreen to use new dashboard architecture with status widgets
- Added pull-to-refresh functionality
- Added time-based greeting (morning/afternoon/evening)
- Integrated BLEStatusWidget and AIStatusWidget in compact and full modes
- Added obstacle list with dismiss functionality
- Integrated EmergencyFAB with position prop

**Realtime Rendering:**

- Event-driven updates via EventBus subscriptions in useHome
- Redux integration for BLE, AI, and Emergency state changes
- Accessibility announcements for real-time events (obstacle detected, device connected, emergency triggered)

**Widget States:**

- Loading states with Loader component
- Disconnected states with retry actions
- Error states with alert components
- Connected/active states with status indicators

**Dev Auth Bypass (Temporary Testing Feature):**

- Created `src/features/auth/DevAuthBypass.ts` for development-only authentication
- Auto-authenticates mock user on app launch (only in **DEV** mode)
- Skips Login/Register screens during development
- Navigates directly to HomeScreen/dashboard
- Preserves existing Redux auth architecture
- Does not affect production builds
- Added `setHasCompletedOnboarding` action to settingsSlice
- Integrated bypass in AppNavigator with clear dev-only comments

To disable: Set `DEV_AUTH_BYPASS_ENABLED = false` in DevAuthBypass.ts

#### Phase 5 - Authentication & Onboarding

**Auth Feature Module:**

- Created LoginScreen with Zod validation and React Hook Form integration
- Created RegisterScreen with password requirements validation
- Created ForgotPasswordScreen with reset flow
- Created Zod validation schemas (loginSchema, registerSchema, forgotPasswordSchema)
- Created FormInput component with Controller integration for accessible forms
- Created useFormValidation hook for form submission handling with AccessibilityEngine announcements
- Integrated Redux authSlice with async thunks (login, register, logout)
- Implemented touchedFields-based validation for UX (errors show only after interaction)
- Added accessibility labels and announcements for all form inputs

**Onboarding Feature Module:**

- Created WelcomeScreen with feature highlights
- Created PermissionsScreen with Android permissions request flow
- Created DevicePairingScreen with mock BLE device scanning
- Created CompleteScreen with setup checklist
- Created onboardingSlice for Redux state management (isComplete, permissions, devicePaired)
- Created useOnboarding hook for navigation and state
- Created usePermissions hook with PermissionsAndroid integration
- Implemented permission status tracking (undetermined, granted, denied, blocked)
- Integrated AccessibilityEngine for voice feedback on permissions

**Babel & Build Configuration:**

- Added @babel/plugin-transform-export-namespace-from for Zod v4 compatibility
- Updated babel.config.js plugin order: export-namespace -> module-resolver -> reanimated

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

#### Global Touch System — Dev Panel Modal Auto-Open Root Cause (2026-05-22)

**Root cause identified and fixed**: `DashboardDevPanel.tsx:337` — `initialVisible = true` defaulted the Dev Panel Modal to visible on mount. The Modal had `transparent={false}` and `presentationStyle="pageSheet"`, creating a full-screen opaque layer that swallowed ALL touch events across the entire app.

- Changed `initialVisible = true` → `initialVisible = false` — Dev Panel now starts as a small floating "🧪 DEV" button, opening the full-screen Modal only on user tap
- Touch events now propagate to HomeScreen test button, dashboard widgets, and all interactive elements

#### DEV Toggle Button Diagnostics & Isolation (2026-05-22)

- Added diagnostic logs to DEV toggle button: `onTouchStart`, `onPressIn`, `onPress`, `onPressOut` with `[DevPanel]` prefix
- Added `isVisible` state change logging via `useEffect`
- Added plain `RNButton` alongside `Pressable` for A/B touch comparison
- Replaced `position: absolute` button with `toggleWrapper` View (absolute positioned container with `elevation: 1000`, `zIndex: 1000`, `pointerEvents: 'box-none'`)
- Added explicit `width: 80`, `height: 48` to toggle button with `pointerEvents: 'auto'`

#### AGENTS.md — Compacted and Focused (2026-05-22)

- Rewrote from 288 lines to 130 lines by removing obvious info (file tree, full env table, navigator catalog, design system list, performance targets, phase prose)
- Preserved all commands, build variant quirks (`stagingEnv` naming), path alias rules (`@env` removed), Babel plugin order, single NavigationContainer rule, Redux two-tier layout, and Dev Auth Bypass mechanism
- Added **UNRESOLVED simulation pipeline UI rendering issue** with console trace signatures and top 4 investigation leads
- Added console log prefix reference table (`[DevPanel]`, `[DevSim]`, `[EventBus#N]`, `[DashboardMiddleware]`, `[BLEWidget]`)
- Added framework quirks section: mock-only backend, `process.env`-based env, touchedFields pattern, AccessibilityEngine init requirement, test coverage gaps

#### Redux Subscription Integrity Diagnostics (2026-05-22)

**Instrumentation added across 9 files — no logic changes:**

- `src/app/store/index.ts` — Added unique `store.__REDUX_STORE_ID__` (random ID + timestamp), exposed to `globalThis.__VISIONAID_STORE__` in `__DEV__` for cross-module reference comparison
- `src/app/index.tsx` — Module-level + App render store identity checks against global reference
- `src/features/home/dashboard/widgets/BLEStatusWidget.tsx` — Added direct `store.subscribe()` listener logging every Redux state change with `ble.status`; logged store identity and subscription method references
- `src/features/home/screens/HomeScreen.tsx` — Added render log with `summary.deviceConnected`, `detectionCount`, `isLoading`, `error` on every render
- `src/features/home/dev/DashboardDevPanel.tsx` — Logged store identity at component mount; enhanced "Force BLE Connected" button with: store ID logging, `store === globalThis.__VISIONAID_STORE__` comparison, subscriber count inspection, pre/post dispatch state logging
- `src/features/home/dashboard/middleware/index.ts` — Logged store identity and dispatch/subscribe method presence at initialization
- `src/features/home/dev/DevSimulationEngine.ts` — Logged store identity in `simulateBLEConnect()`
- `src/features/home/hooks/useHome.ts` — Added `store` import and identity check
- `src/features/home/dashboard/hooks/index.ts` — Added `store` import and identity check

**Diagnosis changed**: Force Redux Dispatch buttons also produce no widget re-render, even though `store.getState()` confirms state changed. Rule out EventBus and middleware as the root cause. Bug is in the Redux→React rendering layer.

#### AGENTS.md — Root Rewrite (2026-05-22)

- Rewrote root `AGENTS.md` from 248 to 142 lines, replacing verbose Engineering Guide with compact Agent Guide matching VisionAidPlus/AGENTS.md structure
- Removed: full file tree, complete env variable table, core services catalog, Redux slice list, design system component index, performance targets, phase prose
- Added: build variant quirks (`stagingEnv` naming), Babel plugin order, Redux two-tier layout, single NavigationContainer rule, Dev Auth Bypass description, `@env` removed caveat, env.ts `process.env`-based reading (NOT react-native-dotenv)
- Added: AccessibilityEngine + DashboardEventMiddleware `__DEV__`-only init note (needs production call), extra console log prefixes (`[StoreDebug]`, `[TouchTest]`, `[HomeScreen]`)
- Added: framework quirks section (`@tanstack/react-query`, `react-native-gesture-handler`, `LogBox.ignoreLogs`, `commit-msg` hook enforcement)

#### AGENTS.md — Evolved Diagnosis in VisionAidPlus/ (2026-05-22)

- Updated `VisionAidPlus/AGENTS.md` UNRESOLVED section: replaced outdated "Redux→React rendering layer" hypothesis with evolved **touch interaction layer** diagnosis
- Added: diagnostic trace map (test button → `onTouchStart` → `onPressIn` → `onPress`), current hypothesis (Modal dialog swallowing touch), key files with instrumentation
- Added: `[StoreDebug]`, `[TouchTest]`, `[HomeScreen]` to console log prefix table
- Added: framework quirks (react-query, gesture-handler, LogBox, commit-msg), Additional Debugging Hooks section (store identity, force dispatch, stress test)
- Fixed: DashboardDevPanel line reference from outdated 238 to correct 279

#### Touch Interaction Diagnostics (2026-05-22)

**Critical discovery**: NONE of the simulation buttons respond — no `[DevPanel]` logs, no Redux dispatches, no EventBus events. `onPress` handlers are never entered. Investigation shifted from Redux rendering to touch/interaction layer.

**Instrumentation added across 2 files — no logic changes:**

- `src/features/home/screens/HomeScreen.tsx` — Added orange standalone `RNButton` test button with click counter, rendered directly in HomeScreen above ScrollView, bypassing Modal entirely; logs `[TouchTest] 🧪 TEST BUTTON PRESSED!` on every press
- `src/features/home/dev/DashboardDevPanel.tsx` — Comprehensive touch diagnostics:
  - Modal lifecycle logging: `onShow`, `onRequestClose`, `onOrientationChange` all emit `[TouchTest]` prefixed console logs
  - Modal visibility state logged on every render (`[DevPanel] 📋 MODAL RENDER`)
  - Header title wrapped in `Pressable` with `onPress` + `onTouchStart` logs
  - Close button `onPress` + `onTouchStart` logs
  - Tab bar: every tab `onPress` logs previous/current tab; `onTouchStart` logs
  - SimulationSection: render confirmation log with button count, IDs, first button `onPress` type and disabled state
  - First 3 simulation buttons: visual red border cue, `onPressIn` handler, `onTouchStart` handler
  - Explicit `pointerEvents="auto"` on container, tabBar, buttonGrid, content ScrollView
  - `nestedScrollEnabled={true}` on content ScrollView
  - Modal `transparent={false}` explicitly set
  - `onShow` handler confirms Modal is visible

**Expected diagnostic trace map** (reading console output from top to bottom):
1. Test button in HomeScreen fires? → Touch system works at app level (if not, everything is broken)
2. Header title / close button fire? → Modal receives touches in header area
3. Tab press fires? → Touch works in Modal content area
4. `onTouchStart` fires? → Raw touch events reach the Pressable
5. `onPressIn` fires? → Pressable detects the press gesture
6. `onPress` fires? → Everything end-to-end

**Current hypothesis**: Touch events are either being swallowed by the React Native Modal's dialog layer on Android, blocked by a transparent overlay, or prevented by `GestureHandlerRootView` not propagating events into the Modal's native window.

#### Simulation Pipeline Debugging (UNRESOLVED — DIAGNOSIS EVOLVED)

**Previous diagnosis**: Simulation buttons trigger partial pipeline execution (EventBus publish, Redux dispatch, middleware handlers all execute successfully per console logs), but widgets do not visually update. This suggested React component subscription or rendering layer issue.

**Pipeline Trace (Working):**
- [DevPanel] Button press logged
- [DevSim] simulateBLEConnect() executes
- [EventBus#N] PUBLISH logs show handlers found
- [DashboardMiddleware] Handler receives payload, dispatches Redux actions
- [DevSim] Redux state shows ble.status = 'connected'

**Pipeline Trace (Broken):**
- BLEStatusWidget does not re-render
- Widget selector logs do not fire on state change
- UI remains showing disconnected state

**Debugging Instrumentation Added:**

1. Button-level tracing: Console logs on every onPress handler
2. Simulation engine tracing: Function entry/exit, payload, Redux state before/after
3. EventBus instance tracking: Unique instance IDs to detect duplicates
4. EventBus subscription tracing: Handler counts, all registered subscriptions on publish
5. Middleware tracing: Initialization, subscription registration, handler invocation
6. Widget tracing: Component renders, selector execution, received state values
7. Force Redux Dispatch buttons: Bypass EventBus to test Redux-to-UI rendering directly

**Files with Debug Logs:**
- `src/core/events/EventBus.ts` - Instance IDs, subscribe/publish logging
- `src/features/home/dev/DevSimulationEngine.ts` - Pipeline trace logging
- `src/features/home/dev/DashboardDevPanel.tsx` - Button press logging, force dispatch
- `src/features/home/dashboard/middleware/index.ts` - Handler invocation logging
- `src/features/home/dashboard/widgets/BLEStatusWidget.tsx` - Render and selector logging

#### Dashboard Dev Testing Pipeline Fixes

**Accessibility Engine Initialization:**

- Fixed AccessibilityEngine not being initialized at app startup
- Added `accessibilityEngine.initialize()` call in `app/index.tsx` during `__DEV__` mode
- Ensures announcements can be made when simulation buttons are pressed

**EventBus Debug Logging:**

- Added instance tracking to detect duplicate EventBus instances
- Added comprehensive logging to publish(), subscribe(), and constructor methods
- Added logging showing all registered subscriptions at publish time

**Dashboard Middleware Debug Logging:**

- Added startup logging confirming middleware initialization
- Added subscription logging for each event (BLE, AI, Emergency)
- Added handler invocation logging showing received payloads
- Added Redux action dispatch confirmation logging

**BLE Widget Debug Logging:**

- Added render logging showing widget mounting/updating
- Added selector execution logging showing full Redux state
- Added state mapping logging for status, connection, signal, battery

#### TextInput Fixes

- Fixed TextInput not editable in auth screens - removed conflicting onChangeText prop override from LoginScreen
- Fixed KeyboardAvoidingView behavior on Android - changed from 'height' to undefined to prevent touch interception
- Fixed FormInput Controller integration - proper field.value, field.onChange, field.onBlur wiring

#### Validation UX Fixes

- Fixed password validation showing on initial render before user interaction
- Added touchedFields-based conditional error rendering in LoginScreen, RegisterScreen, ForgotPasswordScreen
- Fixed PasswordRequirements component to only show after password field is touched
- Preserved Zod validation logic while improving UX

#### Module Resolution Fixes

- Fixed @features/auth/screens module resolution - ensured index.ts exports exist
- Fixed @features/onboarding/screens module resolution - ensured index.ts exports exist
- Verified all navigation imports work correctly

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

#### AGENTS.md — Wrapper Refactor + Detail Updates (2026-05-22)

- Root `AGENTS.md` trimmed from 142 to 8 lines — now a concise wrapper pointing to `VisionAidPlus/AGENTS.md` and `Design.json`
- `VisionAidPlus/AGENTS.md`:
  - Added `test:ci` and `analyze` to commands table
  - Added staging build gradle task warning (`npm run android:build:staging` targets wrong task)
  - Added commit-msg 50-char description limit detail
  - Added `Design.json` architecture design reference
  - Updated UNRESOLVED touch section to ✅ RESOLVED with root cause and fix documentation

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
- Debug mode adds comprehensive logging for EventBus, Redux, and UI updates

---

## Known Issues

- ~46 lint warnings remaining (mostly unused imports and `any` types)
- JDK 17+ required for Android builds (not installed in current environment)

## Debug Infrastructure

The following debug tools are available for development:

**DevSimulationEngine** (`src/features/home/dev/DevSimulationEngine.ts`):
- Direct Redux dispatch methods for testing
- EventBus publish methods with logging
- Accessibility announcement methods
- Stress test mode

**DashboardDevPanel** - In-app dev panel accessible via DEV button:
- Simulation tab: Fire BLE, AI, Emergency, Navigation events
- Force Redux Dispatch: Bypass EventBus to test Redux directly
- Console tab: View event lifecycle logs
- Validation tab: View validation status
- Metrics tab: View performance metrics
- Summary tab: View validation summary

**Console Log Prefixes:**
- `[DevPanel]` - DashboardDevPanel button presses
- `[DevSim]` - DevSimulationEngine operations
- `[EventBus#N]` - EventBus instance N operations
- `[DashboardMiddleware]` - DashboardEventMiddleware operations
- `[BLEWidget]` - BLEStatusWidget renders
- `[AccessibilityEngine]` - Accessibility announcements
