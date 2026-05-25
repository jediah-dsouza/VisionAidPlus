# VisionAid+ Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

#### Phase 14 — Settings & Customization (2026-05-25)

**Architecture:**

- Designed 8-category preference system replacing flat 11-field settings: accessibility (9 fields), audio (1), haptic (2), navigation (1), theme (2), language (5), biometric (1), privacy (4)
- All UI state flows through Redux selectors; no direct native calls in UI layer
- EventBus `SETTINGS_CHANGED` event for real-time sync with AccessibilityEngine, HapticCoordinator

**Preference Types & Schema (`src/features/settings/types/`):**

- Created `preferences.ts` — 8 typed category interfaces (`AccessibilityPreferences`, `AudioPreferences`, `HapticPreferences`, `NavigationPreferences`, `ThemePreferences`, `LanguagePreferences`, `BiometricPreferences`, `PrivacyPreferences`) + `UserPreferences` composite type
- Created `categories.ts` — `DEFAULT_PREFERENCES` with full 50+ field defaults, `SETTINGS_CATEGORIES` array with field definitions (type, default, min/max, options, dependency fields), `PreferenceCategory` union type, `getPreference`/`setPreference` helpers

**Persistence (`src/features/settings/services/SettingsPersistenceService.ts`):**

- AsyncStorage CRUD with per-category keys (`@pref_accessibility`, `@pref_audio`, etc.) + snapshot key + version key for granular reads/writes
- Debounced (300ms trailing) snapshot writes for atomic full-state reads
- Versioned migration (`legacyToPreferences()`) from old flat `STORAGE_KEYS.SETTINGS` to new category structure
- Destroy/resetState lifecycle for singleton test isolation

**Redux Integration (`src/app/store/slices/settingsSlice.ts`):**

- Replaced flat 11-field state with `{ preferences: UserPreferences, hasCompletedOnboarding, _loaded }`
- `setCategoryPreference` action for individual pref key updates
- `setPreferences`, `resetPreferences`, `setHasCompletedOnboarding`, `setLoaded` actions

**Sync Middleware (`src/features/settings/services/SettingsSyncMiddleware.ts`):**

- EventBus publish on preference change
- Registered handlers update AccessibilityEngine (8 fields: highContrastMode, largeText, reducedMotion, voiceAnnouncements, screenReaderEnabled, quietHoursEnabled/Start/End)
- Registered handlers update HapticCoordinator (`hapticEnabled`)
- Registration-based handler system with destroy lifecycle, category+key filtering

**Hook (`src/features/settings/hooks/useSettings.ts`):**

- Loads from persistence on mount (dispatches `setPreferences`)
- `setPreference(category, key, value)` — dispatches Redux, triggers sync middleware, persists via `saveCategory`
- `resetToDefaults()` — resets all categories to defaults, syncs, persists

**Accessible Components (`src/features/settings/components/`):**

- `SettingToggle` — switch with 48px minimum touch target, `accessibilityLabel`, `accessibilityRole="switch"`, `accessibilityState.checked`, announces changes via `accessibilityEngine`
- `SettingSlider` — custom +/- step buttons (no external slider dependency), increments/decrements with boundary clamping, accessibility actions for screen reader adjust gesture
- `SettingSelect` — modal picker with accessibility announcement on selection change
- `SettingCategory` — collapsible section with expand/collapse toggle, animated chevron, announces state changes

**Screen (`src/features/settings/screens/SettingsScreen.tsx`):**

- Category-based rendering from `SETTINGS_CATEGORIES` definition array
- Dependency-based field visibility (e.g. quiet hours time fields only visible when quietHoursEnabled is true)
- Reset-to-defaults with confirmation Alert modal
- Full accessibility labels and roles on all interactive elements

**ThemeProvider Update (`src/app/providers/ThemeProvider.tsx`):**

- Reads `preferences.theme.highContrastMode` and `preferences.theme.themeMode` (supports light/dark/system)
- Proper dependency array for useMemo

**TypeScript Fixes:**

- Fixed `SettingFieldDefinition` key typing (string instead of union-derived never)
- Fixed `SettingsSyncMiddleware` payload types (removed over-constrained generics)
- Fixed `settingsSlice` reducer (typed as unknown cast for dynamic key access)
- Fixed `SettingCategory` surface.subtle → surface.elevated (matching semantic tokens)
- Fixed `ThemeProvider` stale `settings.highContrastMode` reference → `prefs.theme.highContrastMode`
- Fixed `SettingsScreen`, `useSettings` call signatures for non-generic types

**Tests (20 tests across 5 suites):**

- `__tests__/settings/settingsSlice.test.ts` — 7 tests: initial state, setPreferences, setCategoryPreference, setHasCompletedOnboarding, resetPreferences, setLoaded, category isolation
- `__tests__/settings/SettingsPersistenceService.test.ts` — 6 tests: first-run defaults, category save/load, merged load after save, resetAll, destroy safety, loadCategory defaults
- `__tests__/settings/SettingsSyncMiddleware.test.ts` — 5 tests: init, idempotent init, dispatchChange publishes event, reset calls dispatch, destroy prevents operations
- `__tests__/settings/SettingsRuntimeValidation.test.ts` — 10 integration scenarios: persistence round-trip, sync dispatch, a11y engine update, haptic update, category isolation, resetAll, idempotent init, destroy safety, double destroy, default independence
- `__tests__/settings/SettingsStressValidation.test.ts` — 8 stress scenarios: rapid saves, large values, repeated reset cycles, concurrent load/save, field mapping completeness, null-read fallback, post-destroy safety, key uniqueness

**Key Design Decisions:**

- **Flat state with nested slice**: `state.settings.preferences` stores 8-category object; ThemeProvider reads `preferences.theme.*`
- **Per-category persistence keys**: 8 independent AsyncStorage keys — granular reads/writes, no catastrophic data loss on corruption
- **Immediate category writes**: `saveCategory` writes directly to its key (not debounced); only snapshot consolidation is debounced (300ms)
- **Custom slider**: no external `@react-native-community/slider` dependency; built accessible slider with increment/decrement buttons
- **Backward compatible migration**: `legacyToPreferences()` reads old flat key, maps to new category structure, deletes legacy key

#### Phase 13 — Analytics & Alert History (2026-05-25)

**Core Analytics Modules (`src/core/analytics/`):**

- Created `types.ts` — All analytics type definitions: `AnalyticsEvent`, `AnalyticsFilter`, `AnalyticsCategory`, `AnalyticsSeverity`, `AnalyticsSource`, `AlertRecord`, `SessionSegment`, `EngineMetrics`, `SafetyMetrics`, `ObstacleMetrics`, `UsageMetrics`, `SessionSummary`, `PerformanceSnapshot`, `AnalyticsState`, and supporting types
- Created `AnalyticsEventPipeline.ts` — Pub-sub pipeline for event ingestion with subscriber management, destroy lifecycle, singleton `analyticsEventPipeline`
- Created `AnalyticsBatchProcessor.ts` — Time/size-batched event processing with configurable `batchSize` and `batchIntervalMs`, `onBatchReady` callback, manual `flush()`, auto-flush on destroy
- Created `AnalyticsAggregationEngine.ts` — Abstract base class for aggregation engines: `processEvent`, `snapshot`, `reset`, `getMetrics`, `destroy` with automatic `trackEvent` timing
- Created `AlertHistoryManager.ts` — Alert lifecycle management: active/acknowledged/resolved/dismissed states, `getCriticalAlerts()`, `getAlertsByTimeRange()`, per-alert metrics tracking
- Created `SafetyMetricsEngine.ts` — Safety metrics with hazard counting, response time tracking (p50/p90/p95), severity time-series windowing (configurable `HAZARD_WINDOW_MS`)
- Created `ObstacleAnalyticsEngine.ts` — Obstacle detection analytics: type/distance/direction distributions, confidence tracking, density estimation, time-series history
- Created `UsageInsightEngine.ts` — Usage pattern analysis: feature activation counts, session durations, hourly usage distribution `usageByHour`, average session length
- Created `SessionSummaryGenerator.ts` — Per-session summary generation with start/end/bookend markers, segment tracking, route/confidence reporting
- Created `HistoricalEventIndexer.ts` — Doubly-linked-list event storage with `append`, `removeOlderThan`, `query` (predicate filtering), `getCount`, `getOldestTimestamp`, `toArray`
- Created `AnalyticsMemoryProtection.ts` — Adaptive memory budget enforcement with moving-average event rate, three-tier pressure (normal/warning/critical), automatic pruning trigger
- Created `AnalyticsPerformanceMonitor.ts` — Real-time performance metrics: events per second, p50/p90/p95/p99 processing latency, peak tracking, moving-average windowing
- Created `AnalyticsRetentionManager.ts` — TTL-based retention with configurable `alertTtlMs`/`aggregateTtlMs`/`sessionTtlMs`, per-category overrides via `setCustomTtl`, alert pinning/unpinning to prevent pruning
- Created `AnalyticsPersistenceCoordinator.ts` — Async serialize/deserialize of indexer events and engine snapshots with optional encryption marker, import/export support
- Created `AnalyticsSynchronizationLayer.ts` — Sync layer with retry queue (exponential backoff 1s→2s→4s→8s→16s), conflict detection via `lastSyncedAt`, flush-ordering fix for destroy race condition
- Created `AnalyticsFilterEngine.ts` — Multi-dimensional event filtering with timeRange, categories, severities, priorities, sources, textSearch; capped at `MAX_RESULTS=500`
- Created `AnalyticsExportPreparationLayer.ts` — Export with compression, checksum (SHA-256 via `CryptoJS`), format selection (JSON/CSV), optional encryption
- Created `AlertDeduplicationLayer.ts` — Configurable dedup window (`DEFAULT_DEDUP_WINDOW_MS=5000`), `dedupGroup` matching, chain clearing on match
- Created `AnalyticsAccessibilityChartCoordinator.ts` — Accessibility-optimized chart data: audio/tactile summaries, severity breakdowns, trend analysis with `isIncreasing`/`isDecreasing`
- Created `AnalyticsRenderingOptimizer.ts` — Render budget enforcement with frame budget/event budget/throttle intervals, adaptive pressure adjustment
- Created `AnalyticsEventBridge.ts` — EventBus↔Analytics bridge: bidirectional event relay with origin tagging and rate-limited callback protection
- Created `SessionAnalyticsCoordinator.ts` — Session lifecycle (start/end/buildSummary/destroy) with engine registration, merged summary from all registered engines

**Redux Integration:**

- Created `src/app/store/slices/analyticsSlice.ts` — Analytics Redux slice with actions: `startSession`, `endSession`, `updateMetrics`, `addAlert`, `acknowledgeAlert`, `resolveAlert`, `dismissAlert`, `setActive`

**Bug Fixes (source code):**

- `AnalyticsSynchronizationLayer.destroy()` — Fixed flush ordering to call `flush()` before setting `destroyed = true` to prevent pending events from being dropped
- `SessionAnalyticsCoordinator.buildSummary()` — Fixed field mapping to read `hazardCount`/`criticalAlerts` from SafetyMetricsEngine and `totalDetections` from ObstacleAnalyticsEngine instead of stale snapshot fields
- `AnalyticsFilterEngine.match()` — Added guard for missing `priority` field on `AnalyticsEvent` type to prevent false negative filtering when priorities filter is non-empty
- `AnalyticsRetentionManager.prune()` — Fixed to check `pinnedAlertIds` before removing events (pin system was disconnected from prune logic)
- `AnalyticsAggregationEngine.ts` — Changed `snapshot()` abstract return type from `Record<string, unknown>` to `any` to support typed subclass return values
- `EventBus.ts` — Added `EventBus` class export for testability (missing `export`)

**Tests (24 test suites, 217 tests):**

- `__tests__/analytics/AnalyticsEventPipeline.test.ts` — Pipeline lifecycle, subscribe/unsubscribe, destroy
- `__tests__/analytics/AnalyticsBatchProcessor.test.ts` — Batch by size, batch by interval, flush, empty flush
- `__tests__/analytics/AnalyticsAggregationEngine.test.ts` — Base class: metrics, process, timing, reset, destroy, error handling
- `__tests__/analytics/AlertHistoryManager.test.ts` — CRUD alerts, critical alerts, time-range filtering, destroy
- `__tests__/analytics/SafetyMetricsEngine.test.ts` — Hazard counting, response times (p50/p90/p95), severity window, alert count
- `__tests__/analytics/ObstacleAnalyticsEngine.test.ts` — Type/distance/direction distributions, confidence, density estimation
- `__tests__/analytics/UsageInsightEngine.test.ts` — Feature activation, session tracking, hourly peaks, reset
- `__tests__/analytics/SessionSummaryGenerator.test.ts` — Session lifecycle, segments, confidence tracking, null summary
- `__tests__/analytics/HistoricalEventIndexer.test.ts` — Append, removeOlderThan, query, count, oldest timestamp, toArray, destroy
- `__tests__/analytics/AnalyticsMemoryProtection.test.ts` — Event rate, pressure levels, pruning trigger
- `__tests__/analytics/AnalyticsPerformanceMonitor.test.ts` — Events/sec, peak latency, p50/p90/p99, moving average, snapshot
- `__tests__/analytics/AnalyticsRetentionManager.test.ts` — TTL pruning, custom TTL, pin/unpin protection
- `__tests__/analytics/AnalyticsPersistenceCoordinator.test.ts` — Serialize/deserialize, import validation, metadata tracking
- `__tests__/analytics/AnalyticsSynchronizationLayer.test.ts` — Sync queue, backoff, conflict detection, flush ordering, destroy
- `__tests__/analytics/AnalyticsFilterEngine.test.ts` — MatchAll, timeRange, categories, severities, sources, textSearch, result cap, destroy
- `__tests__/analytics/AnalyticsExportPreparationLayer.test.ts` — JSON/CSV export, checksum, record count
- `__tests__/analytics/AlertDeduplicationLayer.test.ts` — Dedup window, different categories, chain clearing, match counts
- `__tests__/analytics/AnalyticsAccessibilityChartCoordinator.test.ts` — Audio summaries, severity breakdowns, trend detection, empty state
- `__tests__/analytics/AnalyticsRenderingOptimizer.test.ts` — Frame budget, event budget, throttle interval, pressure adjustment, adaptive
- `__tests__/analytics/AnalyticsEventBridge.test.ts` — Forward analytics to EventBus, forward EventBus to analytics, origin tag, destroy
- `__tests__/analytics/SessionAnalyticsCoordinator.test.ts` — Session lifecycle, engine registration, merged summary, no-engines edge case
- `__tests__/analytics/analyticsSlice.test.ts` — Redux slice: initial state, session actions, metrics updates, alert CRUD
- `__tests__/analytics/runtime/AnalyticsRuntimeValidation.test.ts` — 10 integration scenarios: pipeline+batch, alert+safety, end-to-end+export, bridge, coordinator lifecycle, memory protection, retention+pruning, sync, filter query, dedup
- `__tests__/analytics/runtime/AnalyticsStressValidation.test.ts` — 10 throughput/stress scenarios: burst ingestion, batch pressure, multi-engine load, filter stress, memory protection under load, retention under load, sync queue stress, export scale, pipeline thundering herd, coordinator lifecycle stress

#### Phase 7 — BLE Realtime Communication Backbone (2026-05-24)

**Core BLE Modules (`src/core/ble/`):**

- Created `types.ts` — All BLE type definitions: BLEConnectionState (8-state machine), packet schemas (Obstacle, Battery, Signal, Status, Navigation), BLEEventMap, BLEScanConfig, BLEBackgroundConfig, BLEMetrics; default config exports
- Created `constants.ts` — Service UUIDs, characteristic UUIDs (obstacle, battery, signal, status, navigation), reconnect backoff array (1s→2s→4s→8s→16s), limits (max reconnect attempts: 5, scan duration: 10s, connection timeout: 10s, disconnect timeout: 5s, rate limits, RSSI/battery thresholds), error codes, scan modes
- Created `BLEPacketParser.ts` — Typed KV-pair parser for 5 packet types (`t=person,d=150,dir=center` wire format); includes `parse()`, `parseRaw()` for base64 decoding, metric tracking (total packets, parsed, errors, avg parse time); singleton export `blePacketParser`
- Created `BLEScanner.ts` — Scan lifecycle with configurable mode/duration, device cache with 30-second TTL, listener system with unsubscribe pattern, mock discovery (2 mock devices: VisionAid Pro, VisionAid Mini), RSSI updates, EventBus events (`ble:scanStarted`, `ble:scanStopped`); singleton export `bleScanner`
- Created `BLEConnectionManager.ts` — Connection state machine (idle→scanning→connecting→connected→disconnecting→disconnected→reconnecting→error), RSSI monitoring with configurable interval, battery update with threshold-based warnings (low: 20%, critical: 10%), mock connect simulation (500ms delay), disconnect lifecycle with mock (300ms delay), state change handler system, connection timeout guard; singleton export `bleConnectionManager`
- Created `BLEReconnectionManager.ts` — Exponential backoff reconnection (1s→2s→4s→8s→16s), max 5 attempts, AppState pause/resume for background handling, EventBus publish on reconnect attempt/failure; singleton export `bleReconnectionManager`
- Created `BLESubscriptionManager.ts` — Characteristic subscription registry with Map-based keying (`serviceUUID:characteristicUUID`), rate-limited notifications (10/sec), structured subscription info, destroy lifecycle; singleton export `bleSubscriptionManager`
- Created `BLEManager.ts` — Singleton orchestrator managing scanner, connection, subscriptions, reconnection, background lifecycle; public API: `initialize()`, `startScan()`, `stopScan()`, `connectToDevice()`, `disconnect()`, `attemptReconnect()`, `sendControlCommand()`, `handlePacketReceived()`, `destroy()`; metrics tracking; packet routing to EventBus; singleton export `bleManager`
- Created `index.ts` — Barrel export of all types, classes, singletons, constants

**Redux Integration:**

- Enhanced `bleSlice.ts` — Added `connectionState` (string enum), `connectedDeviceName`, `chargingStatus`, `mtu`, `reconnectAttempts`, `lastError`, `connectedAt`, `isScanning` fields; added `setConnectionState`, `setConnectedDevice` (object with `{id, name}`), `setChargingStatus`, `setMtu`, `setReconnectAttempts`, `setScanning` actions
- Updated `BLEService.ts` — Thin native wrapper delegating to `bleManager`
- Updated `DashboardEventMiddleware` — Added handlers for `BLE_DEVICE_RECONNECTING` and `LOW_BATTERY_WARNING` events; updated existing handlers for `connectionState` and `deviceName`
- Updated `useDeviceStatus` hook — Returns `connectionState`, `chargingStatus`, `mtu`, `reconnectAttempts`, `isScanning`, `deviceName`, `isReconnecting`, `isError`
- Updated `BLEStatusWidget.tsx` — Uses `connectionState` instead of legacy `status`; shows reconnecting state with attempt count, charging indicator, low battery warning
- Updated `useHome.ts` — Added accessibility announcements for `LOW_BATTERY_WARNING` and `BLE_DEVICE_RECONNECTING`; summary uses `connectionState`

**EventBus Enhancement:**

- Added `EVENTS.BLE_DEVICE_RECONNECTING`, `EVENTS.BLE_DEVICE_SCANNING`, `EVENTS.BLE_DEVICE_FOUND` constants

**Configuration:**

- Updated `env.ts` — Added `BLE_REQUEST_MTU`, `BLE_MAX_RECONNECT_ATTEMPTS`, `BLE_SCAN_MODE`, `BLE_BACKGROUND_ENABLED`, `BLE_KEEP_CONNECTION_IN_BACKGROUND`
- Added `bleManager.initialize()` call in `src/app/index.tsx` (both DEV and production)

**Bug Fixes in BLE Modules:**

- Fixed `DevSimulationEngine.ts` — `setConnectedDevice` now passes `{ id, name }` object instead of bare string
- Fixed `DashboardDevPanel.tsx` — `setConnectedDevice` uses `{ id, name }` object signature
- Fixed `useDevice.ts` — `setConnectedDevice` uses `{ id, name }` object signature
- Replaced all `(eventBus as any).emit()` calls with `eventBus.publish()` throughout BLE modules
- Fixed `BLEReconnectionManager.reset()` — Added `this.destroyed = false` to allow re-use after destroy
- Fixed `BLEReconnectionManager.setupAppStateListener()` — Wrapped `AppState.addEventListener` in try/catch for test environment compatibility

**Test Coverage (48 total BLE tests):**

- `__tests__/ble/bleSlice.test.ts` — 15 tests: initial state, all set* actions, addDevice (new + update), setError, reset
- `__tests__/ble/BLEPacketParser.test.ts` — 14 tests: all 5 packet type parsing (obstacle, battery, signal, status, navigation), edge cases (empty fields, malformed, missing chars), error routing, metric tracking, reset
- `__tests__/ble/BLEReconnectionManager.test.ts` — 7 tests: idle state, reset, state snapshot, pause/resume lifecycle, destroy cleanup, mid-process restart, graceful no-op
- `__tests__/ble/BLEManager.test.ts` — 12 integration tests: initialization/idempotent, scan lifecycle (mock device discovery), connect to discovered device, disconnect state transition, attemptReconnect, packet parsing and routing (obstacle + battery), reconnection manager reset on disconnect, subscription registration/deregistration, re-connect after disconnect, metrics tracking, destroy cleanup

**Dev Packet Monitor Tab:**

- Created `DevPacketMonitor.ts` — Dev-only singleton that listens to all BLE EventBus events (connected, disconnected, reconnecting, scanning, found, signal weak, error, low battery, scan started/stopped); stores timestamped log with direction, characteristic, payload type, parse status; max 200 entries; initialize/push/getLog/clear/destroy lifecycle
- Created `DevPacketMonitorTab.tsx` — 7th tab in DashboardDevPanel; displays real-time BLE event log with color-coded payload types (green: success, yellow: warning, red: error), expandable rows showing direction, characteristic UUID, parse status, raw payload; clear button and live packet counter
- Updated `DashboardDevPanel.tsx` — Added 'packets' tab (📦), initialized `devPacketMonitor` on mount, imports `DevPacketMonitorTab`
- Updated `DevSimulationEngine.ts` — Added `simulateBLEPacket()` method that generates random mock KV-pair packets (obstacle, battery, signal, status, navigation), parses via `blePacketParser`, pushes to `devPacketMonitor`, and publishes to EventBus
- Added "BLE Packet" simulation button (📦) to simulation controls grid

**Fix:**

- Fixed `__tests__/ble/BLEManager.test.ts` — Added missing `let BLEManager: any;` declaration to resolve TypeScript error TS2552

**Documentation:**

- Updated `AGENTS.md` — Changed current phase to "7 — BLE Realtime Communication Backbone"; added BLE Architecture section with module table, data flow diagram, console prefixes table, wire format explanation, state machine diagram, key integration points, Dev Panel Packets tab description, test coverage table; added BLE console prefixes to debugging table; updated test file count from 3 to 7

#### Phase 7.5 — Device Feature Module (2026-05-24)

**Architecture (`src/features/device/`):**

- Created hierarchical module structure: types → hooks (8) → widgets (12) → screen (1 composition root)
- All UI state flows through Redux selectors (`useAppSelector`); no BLEManager calls inside UI components
- Backward compatible exports (`useDevice`, legacy `DeviceState`/`DeviceInfo`/`DeviceSettings` types preserved)

**Types (`types/index.ts`, `types/legacy.ts`):**

- Created `DeviceViewState` — composite of 8 view states (scan, connection, battery, signal, diagnostics, info, sensorHealth, calibration, reconnection)
- Created `DeviceScanState`, `DeviceConnectionViewState`, `DeviceBatteryViewState`, `DeviceSignalViewState` — typed view models with computed properties (isLowBattery, signalQuality, etc.)
- Created `SensorHealthStatus[]` — 5 sensor types (obstacle, battery, signal, status, navigation) with health states (healthy/warning/stale/inactive)
- Created `DeviceDiagnosticsViewState` — metrics snapshot + formatted uptime
- Created `DeviceCalibrationViewState` — status enum (idle/ready/in_progress/complete/failed)
- Created `DeviceReconnectionViewState` — attempt tracking with time-until-next
- Created `types/legacy.ts` — backward-compatible `DeviceState`, `DeviceInfo`, `DeviceSettings` exports

**Hooks (`hooks/useDevice*.ts` — 8 hooks):**

- `useDeviceScan` — scan lifecycle via `bleManager.startScan/stopScan`; returns isScanning, discoveredDevices, scanError, lastScanAt, clearDevices
- `useDeviceConnection` — connection state machine via `bleManager.connectToDevice/disconnect/attemptReconnect`; returns connectionState (typed `BLEConnectionState`), isConnected/Connecting/Disconnecting/Reconnecting/Error, connectToDevice, disconnect, attemptReconnect, retryAfterError; dispatches Redux actions for all state transitions
- `useDeviceBattery` — battery monitoring via Redux selector + `BLE_LIMITS` thresholds; returns batteryLevel, chargingStatus, isLowBattery (≤20%), isCriticalBattery (≤10%), isCharging, isBatteryFull; announces warnings via `accessibilityEngine.announce()`
- `useDeviceSignal` — signal quality computation from RSSI (excellent ≥ -50, good ≥ -65, fair ≥ -80, weak ≥ -90, poor < -90, unknown); returns rssi, signalQuality, isWeakSignal, isCriticalSignal
- `useDeviceDiagnostics` — metrics polling from `bleManager.metricsSnapshot` every 2s; returns totalPacketsReceived/Parsed/Errors, averageParseTimeMs, totalReconnections/Disconnections, uptimeFormatted (Xd Yh Zm Zs), lastPacketAt, hasActivity
- `useDeviceSensorHealth` — EventBus subscription to `ble:packetReceived`; tracks last-update timestamp per sensor type; 5s stale check (30s timeout); returns sensors[] with status/message, allHealthy, activeCount, staleCount
- `useDeviceCalibration` — calibration lifecycle with accessibility announcements; simulates 3s calibration delay; sends `bleManager.sendControlCommand('calibrate')`; returns status, isCalibrating, lastCalibratedAt, startCalibration, cancelCalibration, resetCalibration
- `useDeviceReconnection` — reconnection UI state; auto-dismisses on connected; returns isReconnecting, currentAttempt, maxAttempts (5), timeUntilNextAttempt, dismissReconnection, showReconnectionUI; announces reconnection attempts via accessibilityEngine
- `useDevice` — main composable hook: `{ viewState, scan, connection, battery, signal, diagnostics, sensorHealth, calibration, reconnection }`

**Widgets (`widgets/*.tsx` — 12 widgets):**

- `ScanHeader` — Scan/Stop button with ActivityIndicator spinner during scan; accessibilityLabel with busy state
- `DeviceList` — FlatList of DeviceCard with keyExtractor; scanning loading state with spinner + "Scanning for nearby devices..." text
- `DeviceCard` — Individual device row: device icon, name, ID, 4-bar RSSI visualization with color-coded bars, connected badge (green) or connecting badge (yellow); Pressable via Card.interactive; full accessibilityLabel with signal description, role="button", disabled state
- `ConnectionStatus` — Color-coded pill badge: connected (green), connecting/reconnecting (yellow), idle/disconnected (gray), error (red); configurable size (sm/md); accessibilityLiveRegion="polite"
- `DeviceInfoPanel` — Card with device icon, name, ID, firmware version, hardware version, MTU; accessibilityLabel per info row
- `BatteryMonitor` — Card with battery icon, percentage bar (full-width rounded fill), numeric percentage, charging status indicator (⚡ + "Device is charging"); color coding: green (normal), yellow (low), red (critical), blue (charging)
- `SignalMonitor` — Card with 4 animated-height signal bars; quality label (Excellent/Good/Fair/Weak/Poor/Unknown); RSSI value in dBm; weak/critical warning text
- `SensorHealthGrid` — 2x2 grid of sensor status cards; icons per status (✅ healthy, ⚠️ warning, ⏰ stale, ⚪ inactive); sensor name + status label
- `DiagnosticsPanel` — Collapsible Card (Pressable to toggle); shows summary row (packets, parsed, errors, error rate %) + expanded row (reconnects, disconnects, avg parse time, uptime) + last packet timestamp; collapsed state shows mini summary
- `CalibrationAccessCard` — Card with calibration entry; shows status (Ready/In progress.../✅ Calibrated/❌ Failed); description text; Start Calibration / Cancel button (disabled when not connected); full accessibility
- `ReconnectBanner` — Warning-styled banner with reconnection icon, "Reconnecting..." title, attempt X of 5 counter, countdown timer ("retry in Ns"), dismiss button (✕); accessibilityRole="alert", accessibilityLiveRegion="assertive"
- `EmptyDeviceState` — Error state (⚠️ + error message + Retry button) or empty state (📱 + "No Devices Found" + description + Scan Again button)

**Screen (`screens/DeviceScreen.tsx`):**

- Full-screen composition root with header (title + ConnectionStatus badge + subtitle), ScrollView with RefreshControl
- **Connected view**: DeviceInfoPanel → BatteryMonitor → SignalMonitor → SensorHealthGrid → DiagnosticsPanel (collapsible) → CalibrationAccessCard → Disconnect button (danger variant, Alert.alert confirmation)
- **Disconnected view**: ScanHeader → DeviceList (if scanning or devices exist) or EmptyDeviceState → Connecting overlay (Loader)
- **Reconnection**: ReconnectBanner rendered above both views when reconnection.showReconnectionUI is true
- **Calibration**: Modal with Loader, instructions text, Cancel button when calibration.isCalibrating
- Accessibility: `accessibilityEngine.announce()` for scan start, connect, disconnect, calibration lifecycle, battery warnings, reconnection attempts

**Key constraints satisfied:**

1. No BLEManager calls in UI — all BLE calls go through hooks
2. State via Redux selectors — widgets use `useAppSelector` for bleState
3. EventBus for real-time — sensor health subscribes to `ble:packetReceived`
4. Backward compatible — `useDevice` export preserved, legacy types re-exported
5. Accessibility — all interactive elements have `accessibilityLabel` + `accessibilityRole`; `accessibilityEngine.announce()` throughout
6. Cleanup-safe — all hooks have `mountedRef` guard + `useEffect` cleanup
7. Architecture layered — hooks → widgets → screen, no circular dependencies

**Documentation:**

- Updated `AGENTS.md` — Added Device Feature Module section with architecture diagram, hook table, widget catalog, screen composition, console prefixes; updated current phase to "7 — BLE Realtime Communication Backbone / Device Feature Module"; added device console prefixes to debugging table

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

- ~294 lint warnings remaining (pre-existing, mostly unused imports and `any` types; pre-commit hook enforces `--max-warnings=0`)
- JDK 17+ required for Android builds (not installed in current environment)
- Redux→React rendering gap: Force Redux Dispatch confirms `store.getState()` changes but widgets don't re-render (pre-existing UNRESOLVED)

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
- `[useDeviceScan]` - Device scan errors
- `[useDeviceConnection]` - Connection lifecycle errors
- `[useDeviceCalibration]` - Calibration start/fail/cancel
