# VisionAid+ Engineering Guide

## Project Status

- **Version**: 1.0.0 (Development started)
- **Phase**: Core infrastructure complete - Navigation (7 stacks), 8 Redux slices, 11 design system components, Accessibility Engine (Phase 4), 6 feature modules
- **Platform**: React Native 0.85.3 (CLI), Android-first

## Project Setup

### Initial Commands

```bash
npm install
npm start
npm run android
npm run android:rebuild  # Clean and rebuild
```

### Required Tools

- **Node.js**: >= 22.11.0
- **JDK**: 17+ (required for Android builds)
- **Android SDK**: Required for Android builds

## Available Scripts

| Command                         | Description                    |
| ------------------------------- | ------------------------------ |
| `npm run android`               | Run on Android device/emulator |
| `npm run android:build:debug`   | Build debug APK                |
| `npm run android:build:release` | Build release APK              |
| `npm run android:build:staging` | Build staging APK              |
| `npm run android:clean`         | Clean Android build            |
| `npm run android:rebuild`       | Clean and rebuild              |
| `npm run lint`                  | Run ESLint                     |
| `npm run lint:fix`              | Auto-fix lint issues           |
| `npm run format`                | Format code with Prettier      |
| `npm run format:check`          | Check formatting               |
| `npm run typecheck`             | TypeScript type check          |
| `npm run test`                  | Run Jest tests                 |
| `npm run test:watch`            | Run tests in watch mode        |
| `npm run test:ci`               | Run tests for CI               |
| `npm run test:coverage`         | Run with coverage              |
| `npm run start:reset`           | Reset Metro cache              |
| `npm run analyze`               | Bundle Android app             |
| `npm run commit`                | Commit with commitizen         |

## Build Variants

Android uses Build Types + Product Flavors:

**Build Types**: debug, staging, release  
**Product Flavors**: development, stagingEnv, production (default: development)

| Command                         | Output                 |
| ------------------------------- | ---------------------- |
| `npm run android:build:debug`   | developmentDebug.apk   |
| `npm run android:build:staging` | developmentStaging.apk |
| `npm run android:build:release` | developmentRelease.apk |

Flavor-specific builds require Gradle directly (e.g., `./gradlew assembleStagingEnvDebug`).

## Architecture

### Source Structure

```
src/
├── app/                   # Navigation, providers, Redux store
│   ├── navigation/        # React Navigation setup (stacks, screens, types)
│   ├── providers/        # ThemeProvider
│   └── store/slices/     # Redux slices (8 total)
├── core/                  # Core services (BLE, AI, TTS, storage, events)
├── features/             # Feature modules
│   ├── auth/             # Auth flow (login, register, forgot password)
│   ├── home/             # Home screen
│   ├── device/          # Device pairing/management
│   ├── alerts/           # Alert management
│   ├── settings/         # User settings
│   ├── emergency/       # Emergency handling
│   └── navigation/       # Navigation assistance
└── shared/
    ├── design-system/    # 11 UI components, theme tokens
    ├── theme/            # Colors, typography, spacing
    ├── types/            # Global TypeScript types
    └── constants/        # App constants
```

### Path Aliases

| Alias       | Path            |
| ----------- | --------------- |
| `@`         | `src/`          |
| `@app`      | `src/app/`      |
| `@core`     | `src/core/`     |
| `@features` | `src/features/` |
| `@shared`   | `src/shared/`   |

Note: Use relative imports for `src/env.ts` - `@env` alias was removed.

## Environment Variables (src/env.ts)

| Variable                      | Type    | Default       | Description                                |
| ----------------------------- | ------- | ------------- | ------------------------------------------ |
| `ENVIRONMENT`                 | string  | 'development' | 'development' \| 'staging' \| 'production' |
| `DEBUG_MODE`                  | boolean | **DEV**       | Enable debug logging                       |
| `LOG_LEVEL`                   | string  | 'debug'       | 'error' \| 'warn' \| 'info' \| 'debug'     |
| `MOCK_BLE_DEVICE`             | boolean | true          | Use mock BLE (dev only)                    |
| `MOCK_AI_DETECTION`           | boolean | true          | Use mock AI (dev only)                     |
| `BLE_SCAN_TIMEOUT`            | number  | 10000         | BLE scan duration (ms)                     |
| `BLE_RECONNECT_DELAY`         | number  | 3000          | BLE reconnect delay (ms)                   |
| `EMERGENCY_COUNTDOWN_SECONDS` | number  | 5             | Emergency countdown                        |
| `TTS_SPEECH_RATE`             | number  | 0.5           | TTS speech rate                            |
| `API_BASE_URL`                | string  | -             | API endpoint                               |
| `API_TIMEOUT`                 | number  | 30000         | API timeout (ms)                           |

## State Management

Redux slices in `src/app/store/slices/`:

- `authSlice` - Authentication state
- `bleSlice` - BLE device state
- `aiSlice` - AI detection state
- `ttsSlice` - Text-to-speech state
- `settingsSlice` - User preferences
- `emergencySlice` - Emergency handling
- `navigationSlice` - Navigation state
- `alertsSlice` - Alert management

## Core Services

- **BLEService**: Bluetooth device management (`src/core/native/BLEService.ts`)
- **AIService**: AI obstacle detection (`src/core/native/AIService.ts`)
- **TTSService**: Text-to-speech (`src/core/native/TTSService.ts`)
- **AccessibilityEngine**: Centralized accessibility with VoiceQueue (priority-based), SpeechController (interruption handling), HapticCoordinator, FocusManager, EventPriorityMapper
- **StorageService**: Persistent storage (`src/core/storage/StorageService.ts`)
- **EventBus**: Priority-based event system (`src/core/events/EventBus.ts`)
- **ErrorHandler**: Error boundaries (`src/core/error/ErrorHandler.ts`)

## Navigation Stacks

7 navigators: Root, Auth (Login, Register, ForgotPassword), Onboarding (Welcome, Permissions, DevicePairing, Complete), Main Tab (Home, Navigation, Alerts, Device, Settings), Emergency, Modal, Calibration

## Design System

11 accessible components in `src/shared/design-system/components/`:

- Button, Card, Input, Slider, Toggle, Modal, Loader, EmptyState, FAB, Alert, VoiceFeedbackBanner

Theme: Dark-first with high contrast, 48px minimum touch targets, WCAG 2.1 AA target

## Git Workflow

- Branch strategy: `main`, `develop`, `feature/*`, `fix/*`, `release/*`
- Commit format: `<type>(<scope>): <description>` (Conventional Commits)
- Pre-commit: Husky runs `lint-staged` on staged files

## Testing

Run specific test:

```bash
npm test -- --testPathPattern=bleSlice
```

## Known Issues

- 46 lint warnings remaining (mostly unused imports and `any` types)
- JDK 17+ required for Android builds (not installed in current environment)

## Performance Targets

- BLE latency: <100ms
- TTS delay: <150ms

## Development Tips

- **Mock services**: MOCK_BLE_DEVICE and MOCK_AI_DETECTION default to `true` in development flavor, `false` in production
- **CI linting**: Run `npm run lint:ci` (max-warnings=0) before committing - pre-commit hook enforces this
- **Reset Metro**: Use `npm run start:reset` if bundler has cache issues
- **No backend API**: All data is local/mock (early phase)
- **Env imports**: Use relative paths (`../../env`) not `@env` alias (alias was removed)
- **Build issues**: Path alias errors - verify babel-plugin-module-resolver in babel.config.js matches metro.config.js and tsconfig.json
- **Product flavor naming**: Use `stagingEnv` not `staging` (was renamed to avoid BuildType collision)
