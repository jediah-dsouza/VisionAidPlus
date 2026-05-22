# VisionAid+ Agent Guide

React Native 0.85.3 (CLI), Android-first, dark-first accessibility app for the visually impaired.

**Current Phase**: 6.5 — Dashboard Dev Testing Harness (+ Phase 6 Dashboard, Phase 5 Auth/Onboarding, Phase 4 Accessibility Engine)

---

## Commands

| Purpose | Command |
|---------|---------|
| Run (dev) | `npm run android` |
| Clean rebuild | `npm run android:rebuild` |
| Lint | `npm run lint` (or `lint:fix`, `lint:ci` for max-warnings=0) |
| Typecheck | `npm run typecheck` |
| Test | `npm run test` |
| Single test | `npm test -- --testPathPattern=bleSlice` |
| Reset Metro cache | `npm run start:reset` |
| Format | `npm run format` / `npm run format:check` |
| Commit (cz) | `npm run commit` |

**Strict order**: pre-commit hook runs `eslint --fix --max-warnings=0` + `prettier --write` via lint-staged. `lint:ci` must pass.

**Engine**: Node >= 22.11.0. JDK 17+ required for Android builds (not installed here).

---

## Build Variant Quirks

- Flavor name `stagingEnv` (NOT `staging` — renamed to avoid BuildType collision).
- Output naming: `developmentDebug.apk`, `developmentStaging.apk`, `developmentRelease.apk`.
- Flavor-specific: `./gradlew assembleStagingEnvDebug`.

---

## Architecture Shortcuts

### Path aliases (Babel + Metro + TS aligned)

| Alias | Path |
|-------|------|
| `@` | `src/` |
| `@app` | `src/app/` |
| `@core` | `src/core/` |
| `@features` | `src/features/` |
| `@shared` | `src/shared/` |

**Do NOT use `@env`** — it was removed. Import `src/env.ts` via relative paths (e.g. `../../env`).

### Redux layout (two tiers)

- **App-level** slices in `src/app/store/slices/` (7: ble, ai, tts, settings, emergency, navigation, alerts). Auth is feature-level.
- **Feature-level** slices co-located in `features/auth/store/` and `features/onboarding/store/`.
- Store combines them in `src/app/store/index.ts`.
- Export `state.auth` from the feature-level `authReducer`, NOT from an app-level slice.

### Navigation

- **Single** `NavigationContainer` in `src/app/index.tsx` — NEVER add nested containers.
- Root nav logic in `AppNavigator.tsx`: `!isAuthenticated → Auth`, `!hasCompletedOnboarding → Onboarding`, else `Main`.
- Splash screen rendered first with `animation: 'none'`.

### Babel plugin order (MUST be this sequence)

```
@babel/plugin-transform-export-namespace-from → module-resolver → react-native-reanimated/plugin
```

---

## Dev Auth Bypass (DEV only)

`src/features/auth/DevAuthBypass.ts` auto-authenticates a mock user and marks onboarding complete in `__DEV__` mode. Disable by setting `DEV_AUTH_BYPASS_ENABLED = false`.

In `AppNavigator.tsx`, the `getInitialRoute()` check for `isDevAuthBypassEnabled()` short-circuits to `'Main'` before checking real auth.

---

## Dashboard & Dev Testing Harness (Phase 6–6.5)

### Architecture

`src/features/home/dashboard/`:
- `middleware/` — `DashboardEventMiddleware` (EventBus → Redux bridge, initialized in `app/index.tsx` line 21)
- `hooks/` — `useDashboard`, `useDashboardWidget`, `useObstacleHistory`, `useDeviceStatus`, `useAIStatus`
- `widgets/` — BLEStatusWidget, AIStatusWidget, ObstacleDetectionCard, AIInstructionBanner, EmergencyFAB, QuickActions + QuickActionsPreset
- Widgets support `compact` + full modes. They subscribe via `useAppSelector` to Redux and via `eventBus.subscribe` for real-time.

`src/features/home/dev/` — Dev testing harness (6-tab `DashboardDevPanel` rendered as a Modal in `HomeScreen.tsx:279`, only in `__DEV__`)

### Console log prefixes for debugging

| Prefix | Source |
|--------|--------|
| `[DevPanel]` | DashboardDevPanel button presses |
| `[DevSim]` | DevSimulationEngine operations |
| `[EventBus#N]` | EventBus instance N (`instanceId` from counter — detects duplicates) |
| `[DashboardMiddleware]` | Middleware init & handler invocations |
| `[BLEWidget]` | BLEStatusWidget renders + selector execution |
| `[AccessibilityEngine]` | Accessibility announcements |
| `[StoreDebug]` | Store identity checks (`store === globalThis.__VISIONAID_STORE__`) |
| `[TouchTest]` | Touch interaction diagnostics on Modal buttons |
| `[HomeScreen]` | HomeScreen render tracking |

### ⚠️ UNRESOLVED: Simulation pipeline — touch interaction layer, not Redux

**Evolved diagnosis** (as of 2026-05-22): NONE of the simulation buttons in the dev panel respond — no `[DevPanel]` logs, no dispatches, no EventBus events. Force Redux Dispatch buttons also produce no widget re-render even though `store.getState()` confirms state changed. The root cause is in the **touch/interaction layer**, NOT the Redux→React rendering layer.

**What works**: The standalone orange `🧪 TEST BUTTON` rendered in `HomeScreen.tsx:113-134` fires `[TouchTest]` on every press, proving touch works at the app level. But inside the Modal, nothing fires.

**Current hypothesis**: Touch events swallowed by React Native Modal's dialog layer on Android, blocked by transparent overlay, or prevented by `GestureHandlerRootView` not propagating events into Modal's native window.

**Diagnostic trace map** (read console logs top-to-bottom):
1. Test button in HomeScreen fires? → touch works at app level
2. `onTouchStart` fires on Modal header/close button → raw touch reaches Pressable
3. `onPressIn` fires → Pressable detects gesture
4. `onPress` fires → end-to-end touch works

**Key files**: `DashboardDevPanel.tsx` (Modal with `transparent={false}`, `pointerEvents="auto"`, `nestedScrollEnabled={true}`, diagnostic `onTouchStart`/`onPressIn` on first 3 buttons). `HomeScreen.tsx:113-134` (standalone test button).

---

## Framework Quirks & Gotchas

- **Mock-only backend**: BLE/AI services are stubs (`MOCK_BLE_DEVICE`, `MOCK_AI_DETECTION` default `true` in `src/env.ts`).
- **Env reads from `process.env`** at runtime with fallback defaults via `src/env.ts:21-29`. NOT react-native-dotenv.
- **Form validation** (Phase 5): Zod + react-hook-form. Errors render only after field interaction (touchedFields pattern).
- **AccessibilityEngine** + **DashboardEventMiddleware** must be `initialize()`'d at startup (done in `app/index.tsx:19-22` for `__DEV__`, needs call for production).
- **Only 3 test files** exist: `__tests__/accessibility/VoiceQueue.test.ts`, `__tests__/accessibility/SpeechController.test.ts`, `__tests__/App.test.tsx`. No tests for dashboard widgets or dev harness.
- **~46 lint warnings** (unused imports, `any` types). Pre-commit rejects them (`--max-warnings=0`).
- **`@tanstack/react-query`** in deps but minimally used. **`react-native-gesture-handler`** wraps app root.
- **`LogBox.ignoreLogs(['Non-serializable values...'])`** suppressed in `app/index.tsx:34`.
- **`commit-msg` hook** enforces conventional commits: `<type>(<scope>): <description>`. Types: feat, fix, docs, style, refactor, test, chore, build, ci, perf, revert.

## Additional Debugging Hooks

- **`__REDUX_STORE_ID__`**: Every store instance gets a random ID + timestamp at `src/app/store/index.ts:33`. Logged by all major consumers.
- **`globalThis.__VISIONAID_STORE__`** : Exposed in `__DEV__` so any module can verify it imports the same store instance the Provider uses.
- **Force Redux Dispatch buttons** in Dev Panel → Simulation tab → "Force Redux Dispatch" section bypass EventBus to test Redux→UI isolation.
- **Stress test mode** in Dev Panel → Stress tab: emits random BLE/AI events every 100ms for configurable duration.
