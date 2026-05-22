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
| CI test | `npm run test:ci` (`--ci --coverage --maxWorkers=2`) |
| Reset Metro cache | `npm run start:reset` |
| Format | `npm run format` / `npm run format:check` |
| Commit (cz) | `npm run commit` |
| Bundle analysis | `npm run analyze` |

**Strict order**: pre-commit hook runs `eslint --fix --max-warnings=0` + `prettier --write` via lint-staged. `lint:ci` must pass.

**Engine**: Node >= 22.11.0. JDK 17+ required for Android builds (not installed here).

---

## Build Variant Quirks

- Flavor name `stagingEnv` (NOT `staging` — renamed to avoid BuildType collision in `android/app/build.gradle:72`).
- ⚠️ `npm run android:build:staging` runs `assembleStaging` (wrong gradle task — should be `assembleStagingEnvDebug`).
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

### ✅ RESOLVED: Dev Panel Modal auto-opening blocked all touches

**Root cause** (fixed 2026-05-22): `DashboardDevPanel.tsx:337` — `initialVisible = true` defaulted the Dev Panel Modal to visible on mount. The Modal had `transparent={false}` and `presentationStyle="pageSheet"`, creating a full-screen opaque layer that swallowed ALL touch events across the entire app — including the standalone test button in HomeScreen.

**Fix**: Changed `initialVisible = true` → `initialVisible = false`. The Dev Panel now starts as a small floating "🧪 DEV" button (`DashboardDevPanel.tsx:386-395`), only opening the full-screen Modal on user tap.

---

## Framework Quirks & Gotchas

- **Mock-only backend**: BLE/AI services are stubs (`MOCK_BLE_DEVICE`, `MOCK_AI_DETECTION` default `true` in `src/env.ts`).
- **Env reads from `process.env`** at runtime with fallback defaults via `src/env.ts:21-29`. NOT react-native-dotenv.
- **Form validation** (Phase 5): Zod + react-hook-form. Errors render only after field interaction (touchedFields pattern).
- **AccessibilityEngine** + **DashboardEventMiddleware** must be `initialize()`'d at startup (done in `app/index.tsx:19-22` for `__DEV__`, needs call for production).
- **Only 3 test files** exist (`__tests__/accessibility/VoiceQueue.test.ts`, `__tests__/accessibility/SpeechController.test.ts`, `__tests__/App.test.tsx`). Dashboard widgets and dev harness have zero tests.
- **`Design.json`** at repo root is the formal architecture design reference (layers, event list, states, design tokens).
- **~46 lint warnings** (unused imports, `any` types). Pre-commit rejects them (`--max-warnings=0`).
- **`@tanstack/react-query`** in deps but minimally used. **`react-native-gesture-handler`** wraps app root.
- **`LogBox.ignoreLogs(['Non-serializable values...'])`** suppressed in `app/index.tsx:34`.
- **`commit-msg` hook** enforces `<type>(<scope>): <description>` with ≤50-char description. Types: feat, fix, docs, style, refactor, test, chore, build, ci, perf, revert.

## Additional Debugging Hooks

- **`__REDUX_STORE_ID__`**: Every store instance gets a random ID + timestamp at `src/app/store/index.ts:33`. Logged by all major consumers.
- **`globalThis.__VISIONAID_STORE__`** : Exposed in `__DEV__` so any module can verify it imports the same store instance the Provider uses.
- **Force Redux Dispatch buttons** in Dev Panel → Simulation tab → "Force Redux Dispatch" section bypass EventBus to test Redux→UI isolation.
- **Stress test mode** in Dev Panel → Stress tab: emits random BLE/AI events every 100ms for configurable duration.
