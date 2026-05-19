import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AI_STATES } from '@shared/constants';
import type { ObstacleDetection } from '@shared/types';

interface AIState {
  status: (typeof AI_STATES)[keyof typeof AI_STATES];
  currentObstacle: ObstacleDetection | null;
  detectionHistory: ObstacleDetection[];
  lastDetectionTime: string | null;
  error: string | null;
}

const initialState: AIState = {
  status: AI_STATES.IDLE,
  currentObstacle: null,
  detectionHistory: [],
  lastDetectionTime: null,
  error: null,
};

export const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<AIState['status']>) => {
      state.status = action.payload;
    },
    setCurrentObstacle: (state, action: PayloadAction<ObstacleDetection | null>) => {
      state.currentObstacle = action.payload;
      if (action.payload) {
        state.lastDetectionTime = action.payload.timestamp;
        state.detectionHistory = [action.payload, ...state.detectionHistory.slice(0, 99)];
      }
    },
    clearObstacle: state => {
      state.currentObstacle = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.status = AI_STATES.OFFLINE;
    },
    reset: () => initialState,
  },
});

export const aiActions = aiSlice.actions;
export default aiSlice.reducer;
