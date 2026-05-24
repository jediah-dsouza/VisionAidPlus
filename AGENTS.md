# VisionAid+ Agent Guide

React Native 0.85.3 (CLI), Android-first, dark-first accessibility app for the visually impaired.

**Current Phase**: 7 — BLE Realtime Communication Backbone (Phase 6.5 Dashboard Dev Testing Harness, Phase 6 Dashboard, Phase 5 Auth/Onboarding, Phase 4 Accessibility Engine)

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

## BLE Communication Backbone (Phase 7)

### Architecture

`src/core/ble/` — 7 modules + barrel export, all with singleton exports:

| Module | File | Responsibility |
|--------|------|---------------|
| Types | `types.ts` | All BLE type definitions, packet schemas, event map, connection configs, defaults |
| Constants | `constants.ts` | Service/characteristic UUIDs, backoff arrays, limits, error codes |
| BLEPacketParser | `BLEPacketParser.ts` | Typed KV-pair parser (5 packet types: obstacle, battery, signal, status, navigation); metric tracking |
| BLEScanner | `BLEScanner.ts` | Scan lifecycle, device cache with 30s TTL, listener system, mock discovery (2 devices) |
| BLEConnectionManager | `BLEConnectionManager.ts` | Connection state machine (8 states: idle→scanning→connecting→connected→disconnecting→disconnected→reconnecting→error), RSSI monitoring, battery thresholds, mock connect simulation |
| BLEReconnectionManager | `BLEReconnectionManager.ts` | Exponential backoff (1s→2s→4s→8s→16s), max 5 attempts, AppState pause/resume |
| BLESubscriptionManager | `BLESubscriptionManager.ts` | Characteristic subscription registry, rate-limited notifications (10/sec), safe unsubscribe |
| BLEManager | `BLEManager.ts` | Singleton orchestrator — initializes all sub-managers, handles packet routing to EventBus, connect/disconnect/scan public API, background lifecycle |

### Data flow

```
BLE Packet (raw) → BLEPacketParser.parse() → typed packet → BLEManager.handlePacketReceived()
  → BLEConnectionManager.updateBattery/updateRSSI
  → eventBus.publish(EVENTS.*) → DashboardEventMiddleware → Redux bleSlice → Widgets
```

### Console log prefixes

| Prefix | Source |
|--------|--------|
| `[BLEManager]` | BLEManager init, connect, disconnect, control commands |
| `[BLEConnection]` | Connection state transitions, mock connect, errors |
| `[BLEScanner]` | Scan start/stop, mock device discovery, cache |
| `[BLEReconnection]` | Reconnection scheduling, attempts, success/failure |
| `[BLESubscriptionManager]` | Subscription registration, monitoring rate limits |
| `[BLEPacketParser]` | Packet parse results and errors |

### Wire format

KV-pair (not JSON): `t=person,d=150,dir=center,sev=caution`. Chosen for reduced packet size and parsing latency on embedded device.

### State machine

```
idle → scanning → connecting → connected → disconnecting → disconnected
                                        ↓
                                   reconnecting (→ connected on success, → error on exhaust)
idle ← error (after 2s auto-transition)
```

### Key integration points

- `src/app/index.tsx:23` — `bleManager.initialize()` called after dev middleware init (both DEV and production)
- `src/app/store/slices/bleSlice.ts` — Enhanced with connectionState, connectedDeviceName, chargingStatus, mtu, reconnectAttempts, lastError, connectedAt, isScanning
- `src/core/native/BLEService.ts` — Thin wrapper delegating to BLEManager
- `src/features/home/dashboard/middleware/index.ts` — Handles BLE_DEVICE_RECONNECTING, LOW_BATTERY_WARNING events
- `src/features/home/dashboard/hooks/index.ts` — useDeviceStatus returns connectionState, chargingStatus, mtu, reconnectAttempts, isScanning, deviceName, isReconnecting, isError
- `src/features/home/dashboard/widgets/BLEStatusWidget.tsx` — Shows reconnecting state with attempt count, charging indicator, low battery warning
- `src/features/home/hooks/useHome.ts` — Accessibility announcements for reconnect, low battery
- `src/env.ts` — BLE configuration: MOCK_BLE_DEVICE, BLE_REQUEST_MTU, BLE_MAX_RECONNECT_ATTEMPTS, BLE_SCAN_MODE, BLE_BACKGROUND_ENABLED, BLE_KEEP_CONNECTION_IN_BACKGROUND

### Dev Panel Packets tab

`src/features/home/dev/DevicePacketMonitorTab.tsx` — 7th tab in DashboardDevPanel. Captures all BLE EventBus events and simulated packets in real time. Shows timestamp, direction, payload type, parse status, raw payload (expandable). Clear button and live counter.

### Test coverage (36 tests)

| File | Tests | Status |
|------|-------|--------|
| `__tests__/ble/bleSlice.test.ts` | 15 | PASS |
| `__tests__/ble/BLEPacketParser.test.ts` | 14 | PASS |
| `__tests__/ble/BLEReconnectionManager.test.ts` | 7 | PASS |
| `__tests__/ble/BLEManager.test.ts` | (integration) | PASS |

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
| `[BLEManager]` | BLEManager init, connect, disconnect, control commands |
| `[BLEConnection]` | Connection state transitions, mock connect, errors |
| `[BLEScanner]` | Scan start/stop, mock device discovery, cache |
| `[BLEReconnection]` | Reconnection scheduling, attempts, success/failure |
| `[BLESubscriptionManager]` | Subscription registration, monitoring rate limits |
| `[BLEPacketParser]` | Packet parse results and errors |

### ✅ RESOLVED: Dev Panel Modal auto-opening blocked all touches

**Root cause** (fixed 2026-05-22): `DashboardDevPanel.tsx:337` — `initialVisible = true` defaulted the Dev Panel Modal to visible on mount. The Modal had `transparent={false}` and `presentationStyle="pageSheet"`, creating a full-screen opaque layer that swallowed ALL touch events across the entire app — including the standalone test button in HomeScreen.

**Fix**: Changed `initialVisible = true` → `initialVisible = false`. The Dev Panel now starts as a small floating "🧪 DEV" button (`DashboardDevPanel.tsx:386-395`), only opening the full-screen Modal on user tap.

---

### ⚠️ UNRESOLVED: Redux→React rendering gap

Force Redux Dispatch buttons (Dev Panel → Simulation tab) confirm `store.getState()` changes but widgets do not re-render. This rules out EventBus and middleware — the bug is in the Redux→React rendering layer. Cross-reference `__REDUX_STORE_ID__` values in `[StoreDebug]` logs at every consumer to catch stale store references.

---

## Framework Quirks & Gotchas

- **Mock-only backend**: BLE/AI services are stubs (`MOCK_BLE_DEVICE`, `MOCK_AI_DETECTION` default `true` in `src/env.ts`).
- **Env reads from `process.env`** at runtime with fallback defaults via `src/env.ts:21-29`. NOT react-native-dotenv.
- **Form validation** (Phase 5): Zod + react-hook-form. Errors render only after field interaction (touchedFields pattern).
- **AccessibilityEngine** + **DashboardEventMiddleware** must be `initialize()`'d at startup (done in `app/index.tsx:19-22` for `__DEV__`, needs call for production).
- **7 test files** exist: 3 accessibility + App tests, 4 BLE test suites (bleSlice 15, BLEPacketParser 14, BLEReconnectionManager 7, BLEManager integration). Dashboard widgets and dev harness have zero tests.
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
