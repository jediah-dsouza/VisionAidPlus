# VisionAid+ Agent Guide

React Native 0.85.3 (CLI), Android-first, dark-first accessibility app for the visually impaired.

**Current Phase**: 16 — Testing Infrastructure (complete ✅)
**Next**: TBD

**Pre-existing issues** (don't waste time investigating):
- Redux→React rendering gap: `store.getState()` changes but widgets don't re-render (blame Redux→React layer, not middleware/EventBus)
- `SessionSummaryGenerator.test.ts` flaky timing — `endTime` may equal `startTime` by 1ms on fast runs

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

### Debugging hooks
- `__REDUX_STORE_ID__` logged by all major consumers — catch stale store instances.
- `globalThis.__VISIONAID_STORE__` exposed in `__DEV__` — verify same instance across modules.

---

## Source of Truth Priority

1. **Source code** — the code is correct; docs may be stale.
2. **Phase tracking**: `CHANGELOG.md`
3. **Architecture reference**: `Design.json` (design-system spec, state models, event catalog)
4. **AI context**: `AI_CONTEXT.md` (constraints, current-phase status)
