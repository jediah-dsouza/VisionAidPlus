# VisionAid+ Agent Guide

React Native 0.85.3 (CLI), Android-first, dark-first accessibility app for the visually impaired.

**Current Phase**: 8 — Validation & Stability Sweep (Phase 7.5 Device Feature Module, Phase 7 BLE, Phase 6.5 Dashboard Dev Testing Harness, Phase 6 Dashboard, Phase 5 Auth/Onboarding, Phase 4 Accessibility Engine)

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

- `src/app/index.tsx:27` — `bleManager.initialize()` called after dev middleware init (both DEV and production)
- `src/app/store/slices/bleSlice.ts` — Enhanced with connectionState, connectedDeviceName, chargingStatus, mtu, reconnectAttempts, lastError, connectedAt, isScanning
- `src/core/native/BLEService.ts` — Thin wrapper delegating to BLEManager
- `src/features/home/dashboard/middleware/index.ts` — Handles BLE_DEVICE_RECONNECTING, LOW_BATTERY_WARNING events
- `src/features/home/dashboard/hooks/index.ts` — useDeviceStatus returns connectionState, chargingStatus, mtu, reconnectAttempts, isScanning, deviceName, isReconnecting, isError
- `src/features/home/dashboard/widgets/BLEStatusWidget.tsx` — Shows reconnecting state with attempt count, charging indicator, low battery warning
- `src/features/home/hooks/useHome.ts` — Accessibility announcements for reconnect, low battery
- `src/env.ts` — BLE configuration: MOCK_BLE_DEVICE, BLE_REQUEST_MTU, BLE_MAX_RECONNECT_ATTEMPTS, BLE_SCAN_MODE, BLE_BACKGROUND_ENABLED, BLE_KEEP_CONNECTION_IN_BACKGROUND

### Dev Panel Packets tab

`src/features/home/dev/DevicePacketMonitorTab.tsx` — 7th tab in DashboardDevPanel. Captures all BLE EventBus events and simulated packets in real time. Shows timestamp, direction, payload type, parse status, raw payload (expandable). Clear button and live counter.

### Test coverage (48 tests)

| File | Tests | Status |
|------|-------|--------|
| `__tests__/ble/bleSlice.test.ts` | 15 | PASS |
| `__tests__/ble/BLEPacketParser.test.ts` | 14 | PASS |
| `__tests__/ble/BLEReconnectionManager.test.ts` | 7 | PASS |
| `__tests__/ble/BLEManager.test.ts` | 12 (integration) | PASS |

---

## Device Feature Module (Phase 7.5)

### Architecture

`src/features/device/` — 8 hooks, 12 widgets, 1 screen composable on top of Phase 7 BLE backbone:

| Layer | Files | Responsibility |
|-------|-------|---------------|
| Types | `types/index.ts`, `types/legacy.ts` | DeviceViewState (composite of 8 view states), sensor health, diagnostics, calibration |
| Hooks | `hooks/useDevice*.ts` (8 hooks) | Scan, connection, battery, signal, diagnostics, sensor health, calibration, reconnection |
| Widgets | `widgets/*.tsx` (12 widgets) | ScanHeader, DeviceList, DeviceCard, ConnectionStatus, DeviceInfoPanel, BatteryMonitor, SignalMonitor, SensorHealthGrid, DiagnosticsPanel, CalibrationAccessCard, ReconnectBanner, EmptyDeviceState |
| Screen | `screens/DeviceScreen.tsx` | Composition root — conditional connected/disconnected views |

### Data flow

```
BLEManager (core/ble) → EventBus → DashboardEventMiddleware → Redux bleSlice
                                                                   ↓
    Device hooks (useAppSelector + bleManager.get*() + eventBus)
                  ↓
         Device widgets (pure render via useAppSelector)
                  ↓
           DeviceScreen (composition via useDevice())
```

### Hooks

| Hook | File | Returns | BLE API used |
|------|------|---------|-------------|
| `useDeviceScan` | `hooks/useDeviceScan.ts` | isScanning, discoveredDevices, startScan, stopScan, clearDevices | `bleManager.startScan/stopScan` |
| `useDeviceConnection` | `hooks/useDeviceConnection.ts` | connectionState, isConnected, connectToDevice, disconnect, attemptReconnect, retryAfterError | `bleManager.connectToDevice/disconnect/attemptReconnect` |
| `useDeviceBattery` | `hooks/useDeviceBattery.ts` | batteryLevel, chargingStatus, isLowBattery, isCriticalBattery, isCharging, setBatteryLevel | Redux selector + accessibilityEngine |
| `useDeviceSignal` | `hooks/useDeviceSignal.ts` | rssi, signalQuality (excellent/good/fair/weak/poor), isWeakSignal, updateRSSI | Redux selector |
| `useDeviceDiagnostics` | `hooks/useDeviceDiagnostics.ts` | totalPackets*, parseErrors, avgParseTime, uptimeFormatted, reconnections | `bleManager.metricsSnapshot` (2s poll) |
| `useDeviceSensorHealth` | `hooks/useDeviceSensorHealth.ts` | sensors[] (5 types), allHealthy, activeCount, staleCount | EventBus `ble:packetReceived` subscription |
| `useDeviceCalibration` | `hooks/useDeviceCalibration.ts` | status (idle/ready/in_progress/complete/failed), startCalibration, cancelCalibration | `bleManager.sendControlCommand` |
| `useDeviceReconnection` | `hooks/useDeviceReconnection.ts` | isReconnecting, currentAttempt, maxAttempts, dismissReconnection, showReconnectionUI | Redux selector (negative: auto-dismiss on connected) |

### Main composable hook

`useDevice()` returns `{ viewState, scan, connection, battery, signal, diagnostics, sensorHealth, calibration, reconnection }`
- `viewState` is a `DeviceViewState` composite of all sub-hook states for one-shot rendering
- Backward compatible export from `@features/device`

### Widgets

| Widget | Props | Description |
|--------|-------|-------------|
| `ScanHeader` | isScanning, onScanToggle | Scan button + scanning indicator spinner |
| `DeviceList` | devices[], connectedDeviceId, isConnecting, isScanning, onConnect | FlatList of DeviceCard |
| `DeviceCard` | device (BLEDevice), isConnected, isConnecting, onConnect | Single device row: name, ID, 4-bar RSSI, connected badge |
| `ConnectionStatus` | connectionState, size? | Color-coded pill badge (green/yellow/red/gray per state) |
| `DeviceInfoPanel` | deviceName, deviceId, firmwareVersion, hardwareVersion, mtu | Card with icon + info rows |
| `BatteryMonitor` | batteryLevel, chargingStatus, isLowBattery/Critical/Charging/Full | Bar fill + percentage + charging indicator |
| `SignalMonitor` | rssi, signalQuality, isWeakSignal/Critical | 4-bar animated signal display + quality label |
| `SensorHealthGrid` | sensors[] (SensorHealthStatus) | 2×2 grid of sensor status cards (healthy/stale/inactive) |
| `DiagnosticsPanel` | totalPackets*, parseErrors, avgParseTime, uptime, reconnections | Collapsible card: packets/errors/reconnects/uptime |
| `CalibrationAccessCard` | status, isCalibrating, isConnected, start/cancel | Calibration entry + status + button |
| `ReconnectBanner` | currentAttempt, maxAttempts, timeUntilNextAttempt, onDismiss | Warning banner with attempt counter + dismiss |
| `EmptyDeviceState` | isScanning, hasError, errorMessage, onScan, onRetry | Error or empty state with retry action |

### Screen composition

```
DeviceScreen
├── Header (title + ConnectionStatus badge)
├── ReconnectBanner (conditional)
├── [Connected View — ScrollView]
│   ├── DeviceInfoPanel
│   ├── BatteryMonitor
│   ├── SignalMonitor
│   ├── SensorHealthGrid
│   ├── DiagnosticsPanel (collapsible)
│   ├── CalibrationAccessCard
│   └── Disconnect Button (danger)
├── [Disconnected View — ScrollView]
│   ├── ScanHeader (scan/stop button)
│   ├── DeviceList OR scanning Loader OR EmptyDeviceState
│   └── Connecting overlay (conditional)
└── Calibration Modal (conditional)
```

### Key constraints satisfied

1. **No BLEManager calls in UI** — all BLE calls go through hooks
2. **State via Redux selectors** — widgets use `useAppSelector` for bleState
3. **EventBus for real-time** — sensor health subscribes to `ble:packetReceived`
4. **Backward compatible** — `useDevice` export preserved, `types/index.ts` re-exports legacy types
5. **Accessibility** — all interactive elements have `accessibilityLabel` + `accessibilityRole`; `accessibilityEngine.announce()` for scan start, connect, disconnect, calibration, battery warnings, reconnection
6. **Cleanup-safe** — all hooks have `mountedRef` guard + `useEffect` cleanup
7. **Architecture layered** — hooks → widgets → screen, no circular dependencies

### Console log prefixes

| Prefix | Source |
|--------|--------|
| `[useDeviceScan]` | Scan errors |
| `[useDeviceConnection]` | Connection lifecycle errors |
| `[useDeviceCalibration]` | Calibration start/fail/cancel |

---

## Dashboard & Dev Testing Harness (Phase 6–6.5)

### Architecture

`src/features/home/dashboard/`:
- `middleware/` — `DashboardEventMiddleware` (EventBus → Redux bridge, initialized in `app/index.tsx:22`)
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
| `[useDeviceScan]` | Device scan errors |
| `[useDeviceConnection]` | Connection lifecycle errors |
| `[useDeviceCalibration]` | Calibration start/fail/cancel |
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

## Phase 8 — Validation & Stability Sweep (Applied)

All fixes below were verified against source. See `CHANGELOG.md` for full details.

### Critical fixes applied
| Issue | File | Fix |
|-------|------|-----|
| Timer leak on concurrent `connect()` calls | `BLEConnectionManager.ts:75` | Clears existing connectTimer before new attempt |
| `useDashboard.subscribe()` listener leak | `hooks/index.ts:81-86` | Unique keys per subscription via incrementing ID |
| Duplicate accessibility announcements | `useHome.ts:38-117` | Removed obstacle/danger/reconnect/battery EventBus subs that duplicated `AccessibilityEngine` handlers |
| Dual `connectionState`/`status` state drift | `bleSlice.ts` | `connectionStateToStatus()` mapping + `setConnected` batch action enforces consistency |
| Sequential dispatches (5 renders per connect) | `middleware/index.ts:75-87` | Collapsed to single `setConnected()` dispatch |

### High-priority fixes applied
| Issue | File | Fix |
|-------|------|-----|
| `useDeviceCalibration` no mountedRef + 3s timeout leak | `useDeviceCalibration.ts` | Added `mountedRef`, `timeoutRef`, guard all state setters |
| `useHome` no mountedRef | `useHome.ts` | Added `mountedRef` guard around async handlers |
| `useDeviceScan` mountedRef not checked after await | `useDeviceScan.ts:36-41` | Guard `setLastScanAt` + catch block |
| Cannot disconnect while `connecting` | `BLEConnectionManager.ts:99-107` | Added `state === 'connecting'` gate with timer cleanup |
| `subscribeToDeviceServices()` failure unhandled | `BLEManager.ts:135-142` | Wrapped in try/catch, disconnects on failure |
| `shouldInterrupt()` logic inverted (high-priority didn't interrupt) | `SpeechController.ts:75` | Changed `!==` to `===` — high interrupts speech |
| Reconnection announcements not throttled | `useDeviceReconnection.ts:27-34` | `lastAnnouncedAttempt` ref deduplicates |
| Battery announcements not throttled | `useDeviceBattery.ts:48-62` | `lastAnnouncedThreshold` ref prevents repeat announcements |
| EventBus publish no rate limiting | `EventBus.ts:86-94` | Added 50ms throttle per event type |
| Diagnostics polling runs when disconnected | `useDeviceDiagnostics.ts:40-49` | Polling only active when `connectionState === 'connected'` |

### Medium-priority fixes applied
- `BLEScanner` mock timer leak — tracked via `mockTimer` field, cleared in `stop()`/`destroy()`
- `BLEReconnectionManager.reset()` set `destroyed = false` — now guards on destroyed
- `BLEConnectionManager.finalizeDisconnect()` never cleared `deviceId` — now nulls all stale fields
- `BLESubscriptionManager` — added 30s subscription heartbeat watchdog
- `bleSlice.setBatteryLevel` — clamped to 0-100 range

### Validation instrumentation added
- `DevSimulationEngine`: `startLifecycleStressTest()` (rapid connect/disconnect cycles), `startPacketFloodTest()` (N packets/sec), `validateAllStates()` (consistency checks across all slices)

### Unresolved (pre-existing)
- Redux→React rendering gap: `store.getState()` changes but widgets don't re-render. Cross-reference `__REDUX_STORE_ID__` in `[StoreDebug]` logs.
- `shouldInterrupt` concurrency lock: `interrupt()` and `processQueue()` can call `deliverMessage()` concurrently. Not fixed to avoid refactoring `SpeechController` state model.

## Additional Debugging Hooks

- **`__REDUX_STORE_ID__`**: Every store instance gets a random ID + timestamp at `src/app/store/index.ts:33`. Logged by all major consumers.
- **`globalThis.__VISIONAID_STORE__`** : Exposed in `__DEV__` so any module can verify it imports the same store instance the Provider uses.
- **Force Redux Dispatch buttons** in Dev Panel → Simulation tab → "Force Redux Dispatch" section bypass EventBus to test Redux→UI isolation.
- **Stress test mode** in Dev Panel → Stress tab: emits random BLE/AI events every 100ms for configurable duration.
