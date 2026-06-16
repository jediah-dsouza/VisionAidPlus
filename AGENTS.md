# VisionAid+ Agent Guide

React Native 0.85.3 (CLI), Android-first, dark-first accessibility app for the visually impaired.

**All 17 phases complete** — project is production-ready (see `CHANGELOG.md`). No pending phases.

**Pre-existing issues** (don't waste time investigating):
- Redux→React rendering gap: `store.getState()` changes but widgets don't re-render (blame Redux→React layer, not middleware/EventBus)
- `SessionSummaryGenerator.test.ts` flaky timing — `endTime` may equal `startTime` by 1ms on fast runs
- ~294 lint warnings pre-existing (unused imports, `any` types; `lint:ci` enforces `--max-warnings=0` regardless)

---

## Commands (all from this directory)

| Purpose | Command |
|---------|---------|
| Run (dev) | `npm run android` |
| Clean rebuild | `npm run android:rebuild` |
| Lint | `npm run lint` / `lint:fix` / `lint:ci` (max-warnings=0) |
| Typecheck | `npm run typecheck` |
| Test | `npm run test` |
| Single test | `npm test -- --testPathPattern=bleSlice` |
| CI test | `npm run test:ci` (`--ci --coverage --maxWorkers=2`) |
| Reset Metro cache | `npm run start:reset` |
| Format | `npm run format` / `format:check` |
| Commit | `npm run commit` (git-cz) |
| Bundle analysis | `npm run analyze` |
| E2E test | `npm run e2e` (requires `detox` globally installed) |

**Lint+Format**: pre-commit hook via lint-staged runs `eslint --fix --max-warnings=0 && prettier --write` on staged files. `lint:ci` must pass.

**Engine**: Node >= 22.11.0. JDK 17+ for Android builds.

**Testing Infrastructure**: Phase 16 — `__tests__/infrastructure/` with centralized MockRegistry, 7 reusable mocks, 9 helper modules, 7 integration suites (35 tests), 3 performance benchmarks (gated behind `__PERF__`), Detox E2E config. All new tests are deterministic (no `setTimeout` in test logic). Performance benchmarks skip in CI. Detox requires `detox` globally installed.

**Production Hardening**: Phase 17 — React ErrorBoundary wrapping app tree, AccessibilityEngine initialized in all builds, EventBus health monitoring (subscription cap, throttle warnings, destroy lifecycle), EmergencyManager timer leak fixed, AsyncStorage stale keys removed, Redux debug logging gated behind `__DEV__`, all core managers destroyed on unmount, `console.error` → `logger.error` in EventBus and analytics pipelines, NetworkMonitor utility for offline awareness, ProductionErrorReporter for remote error transport integration.

---

## Build Variant Quirks

- Flavor name `stagingEnv` (NOT `staging` — renamed in `android/app/build.gradle:72` to avoid BuildType collision).
- ⚠️ `npm run android:build:staging` runs `assembleStaging` — wrong. Correct: `./gradlew assembleStagingEnvDebug`.
- Output naming: `developmentDebug.apk`, `developmentStaging.apk`, `developmentRelease.apk`.

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

**Do NOT use `@env`** — removed. Import `src/env.ts` via relative paths (e.g. `../../env`).

### Key rules
- **Single** `NavigationContainer` in `src/app/index.tsx` — never add nested containers.
- **Babel plugin order** (must be this sequence): `@babel/plugin-transform-export-namespace-from → module-resolver → react-native-reanimated/plugin`.
- **Redux**: app-level slices in `src/app/store/slices/`; feature-level slices co-located in `features/*/store/`. Combined in `src/app/store/index.ts`.
- **Dev auth bypass**: `src/features/auth/DevAuthBypass.ts` — auto-authenticates mock user and skips onboarding in `__DEV__`. Disable: `DEV_AUTH_BYPASS_ENABLED = false`.

### App initialization hub (`src/app/index.tsx`)
All core systems are initialized here: `accessibilityEngine`, `bleManager`, `emergencyManager`, `navigationManager`, `networkMonitor`, `analyticsEventBridge`/`analyticsBatchProcessor`/`analyticsEventPipeline`. The `useEffect` cleanup destroys all managers on unmount. `accessibilityEngine.initialize()` runs in ALL builds (not just `__DEV__`).

### Redux store
13 slices in `src/app/store/slices/` + `@features/auth`/`@features/onboarding` reducers, combined in `src/app/store/index.ts`. Memoized selectors in `src/app/store/selectors.ts` (20+ `createSelector` wrappers). Use `useAppSelector`/`useAppDispatch` from store/index.

### Mock-only backend
BLE, AI camera, and all device interactions are simulated via mocks (`src/core/ble/*`, `src/features/home/dev/DevSimulationEngine.ts`). No physical BLE device required for development. Performance benchmarks gated behind `(globalThis as any).__PERF__` (default false, skip in CI).

### Console log prefixes for debugging
`[DevPanel]` — DashboardDevPanel button events | `[DevSim]` — simulation engine | `[EventBus#N]` — EventBus instance operations | `[DashboardMiddleware]` — middleware handler invocations | `[BLEWidget]` — BLEStatusWidget renders | `[AccessibilityEngine]` — announcements | `[StoreDebug]` — Redux store identity checks

---

## Source of Truth Priority

1. **Source code** — the code is correct; docs may be stale.
2. **Phase tracking**: `CHANGELOG.md` (accurate, all phases documented)
3. **Architecture reference**: `Design.json` (design-system spec, state models, event catalog — some deps/versions stale)
4. **AI context**: `AI_CONTEXT.md` (may be stale — cross-check with source code)
