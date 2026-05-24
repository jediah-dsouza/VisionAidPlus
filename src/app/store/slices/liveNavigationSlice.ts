import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { EnvironmentMode, DangerLevel, Obstacle, GuidanceInstruction, NavigationStatus } from '@core/live-navigation/types';

interface LiveNavigationState {
  status: NavigationStatus;
  environment: EnvironmentMode;
  dangerLevel: DangerLevel;
  obstacles: Obstacle[];
  nearestObstacle: Obstacle | null;
  currentInstruction: GuidanceInstruction | null;
  obstacleCount: number;
  sensitivity: number;
  radarData: {
    sectors: Array<{ angle: number; distanceCm: number; severity: string; obstacleCount: number }>;
    maxDistanceCm: number;
  } | null;
  sessionId: string | null;
  startedAt: number | null;
  pausedAt: number | null;
  error: string | null;
  lastUpdatedAt: string | null;
}

const initialState: LiveNavigationState = {
  status: 'idle',
  environment: 'outdoor',
  dangerLevel: 'none',
  obstacles: [],
  nearestObstacle: null,
  currentInstruction: null,
  obstacleCount: 0,
  sensitivity: 5,
  radarData: null,
  sessionId: null,
  startedAt: null,
  pausedAt: null,
  error: null,
  lastUpdatedAt: null,
};

export const liveNavigationSlice = createSlice({
  name: 'liveNavigation',
  initialState,
  reducers: {
    navigationStarted: (state, action: PayloadAction<{ sessionId: string; startedAt: number }>) => {
      state.status = 'navigating';
      state.sessionId = action.payload.sessionId;
      state.startedAt = action.payload.startedAt;
      state.error = null;
      state.lastUpdatedAt = new Date().toISOString();
    },
    navigationStopped: () => initialState,
    navigationPaused: (state, action: PayloadAction<{ pausedAt: number } | undefined>) => {
      state.status = 'paused';
      state.pausedAt = action.payload?.pausedAt ?? Date.now();
      state.lastUpdatedAt = new Date().toISOString();
    },
    navigationResumed: (state) => {
      state.status = 'navigating';
      state.pausedAt = null;
      state.lastUpdatedAt = new Date().toISOString();
    },
    obstaclesUpdated: (state, action: PayloadAction<{ obstacles: Obstacle[]; nearest: Obstacle | null }>) => {
      state.obstacles = action.payload.obstacles;
      state.nearestObstacle = action.payload.nearest;
      state.obstacleCount = action.payload.obstacles.length;
      state.lastUpdatedAt = new Date().toISOString();
    },
    radarUpdated: (state, action: PayloadAction<{
      sectors: Array<{ angle: number; distanceCm: number; severity: string; obstacleCount: number }>;
      maxDistanceCm: number;
    }>) => {
      state.radarData = action.payload;
      state.lastUpdatedAt = new Date().toISOString();
    },
    instructionIssued: (state, action: PayloadAction<GuidanceInstruction>) => {
      state.currentInstruction = action.payload;
      state.lastUpdatedAt = new Date().toISOString();
    },
    dangerLevelChanged: (state, action: PayloadAction<DangerLevel>) => {
      state.dangerLevel = action.payload;
      state.lastUpdatedAt = new Date().toISOString();
    },
    environmentChanged: (state, action: PayloadAction<EnvironmentMode>) => {
      state.environment = action.payload;
      state.lastUpdatedAt = new Date().toISOString();
    },
    sensitivityChanged: (state, action: PayloadAction<number>) => {
      state.sensitivity = action.payload;
      state.lastUpdatedAt = new Date().toISOString();
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.status = 'error';
      state.lastUpdatedAt = new Date().toISOString();
    },
    clearError: (state) => {
      state.error = null;
      state.lastUpdatedAt = new Date().toISOString();
    },
  },
});

export const liveNavigationActions = liveNavigationSlice.actions;
export default liveNavigationSlice.reducer;
