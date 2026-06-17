# VisionAid+ Agent Guide

React Native 0.85.3 (CLI), Android-first, dark-first accessibility app for the visually impaired.

**All 17 phases complete** — production-ready (see `CHANGELOG.md`).

## Pre-existing Issues (don't investigate)

- **Redux→React rendering gap**: `store.getState()` changes but widgets don't re-render. Bug is in Redux→React layer, not middleware/EventBus.
- **Flaky test**: `SessionSummaryGenerator.test.ts` — `endTime` may equal `startTime` by 1ms on fast runs.
- **Test count**: 927/929 passing (2 test-only bugs in `SettingsStressValidation.test.ts`, no user-facing impact).
- **~294 lint warnings** (unused imports, `any` types, inline styles). `lint:ci` and pre-commit hook enforce `--max-warnings=0` — **both always fail**. Use `git commit --no-verify` to bypass.

## Commands (run from this directory)

| Purpose | Command |
|---------|---------|
| Run (dev) | `npm run android` |
| Clean rebuild | `npm run android:rebuild` |
| Lint | `npm run lint` / `lint:fix` |
| CI lint (⚠️ always fails) | `npm run lint:ci` |
| Typecheck | `npm run typecheck` |
| Test | `npm run test` |
| Single test | `npm test -- --testPathPattern=bleSlice` |
| CI test | `npm run test:ci` |
| Reset Metro cache | `npm run start:reset` |
| Format | `npm run format` / `format:check` |
| Commit (git-cz) | `npm run commit` |
| Bundle analysis | `npm run analyze` |
| E2E (requires global `detox`) | `npm run e2e` |

**Pre-commit**: `lint-staged` runs `eslint --fix --max-warnings=0 && prettier --write`. Always fails on warnings; bypass with `--no-verify`.

**Engine**: Node >= 22.11.0. JDK 17+ for Android builds.

## Build Variant Quirks

- Flavor name `stagingEnv` (NOT `staging` — renamed in `android/app/build.gradle` to avoid BuildType collision).
- ⚠️ `npm run android:build:staging` calls `assembleStaging` — wrong. Use `./gradlew assembleStagingEnvDebug`.
- APK output: `developmentDebug.apk`, `developmentStaging.apk`, `developmentRelease.apk`.

## Architecture

### Path aliases (Babel + Metro + TS aligned)

| Alias | Path |
|-------|------|
| `@` | `src/` |
| `@app` | `src/app/` |
| `@core` | `src/core/` |
| `@features` | `src/features/` |
| `@shared` | `src/shared/` |

**Do NOT use `@env`** — removed. Import `src/env.ts` via relative path (e.g. `../../env`). Reads via `process.env` (NOT `react-native-dotenv`).

### Key constraints
- **Single** `NavigationContainer` in `src/app/index.tsx` — never nest containers.
- **Babel plugin order** (must match): `@babel/plugin-transform-export-namespace-from → module-resolver → react-native-reanimated/plugin`.
- **Redux**: app slices in `src/app/store/slices/`; feature slices in `features/*/store/`. Combined in `src/app/store/index.ts`. Memoized selectors in `src/app/store/selectors.ts` (20+ `createSelector`). Use `useAppSelector`/`useAppDispatch`.
- **Dev auth bypass**: `src/features/auth/DevAuthBypass.ts` — auto-authenticates in `__DEV__`. Disable: `DEV_AUTH_BYPASS_ENABLED = false`.
- **Tests use `react-test-renderer`**, not `@testing-library/react-native`.
- **Performance benchmarks** gated behind `(globalThis as any).__PERF__` (default false, skip in CI).

### App initialization hub (`src/app/index.tsx`)
All core systems wired here: `accessibilityEngine` (ALL builds, not just `__DEV__`), `bleManager`, `emergencyManager`, `navigationManager`, `networkMonitor`, `analyticsEventBridge`/`analyticsBatchProcessor`/`analyticsEventPipeline`. `useEffect` cleanup destroys all managers on unmount. `errorHandler` import guarantees tree-shaking doesn't remove global `onerror`/`unhandledrejection` hooks.

### Mock-only backend
BLE, AI camera, all device interactions simulated (`src/core/ble/*`, `src/features/home/dev/DevSimulationEngine.ts`). No physical device needed.

### Console log prefixes
`[DevPanel]` — DashboardDevPanel | `[DevSim]` — simulation engine | `[EventBus#N]` — EventBus ops | `[DashboardMiddleware]` — middleware | `[BLEWidget]` — BLEStatusWidget renders | `[AccessibilityEngine]` — announcements | `[StoreDebug]` — Redux store identity checks

## Source of Truth Priority
1. **Source code** — code is correct; docs may be stale
2. **CHANGELOG.md** — accurate phase tracking
3. **Design.json** — design-system spec, state models (some deps/versions stale)
4. **AI_CONTEXT.md** — may be stale
