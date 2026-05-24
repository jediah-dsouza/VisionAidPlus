import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AI_STATES } from '@shared/constants';
import type { ObstacleDetection } from '@shared/types';
import type { DetectionContract, DetectionPriority } from '@core/camera/types';

interface AIState {
  status: (typeof AI_STATES)[keyof typeof AI_STATES];
  currentObstacle: ObstacleDetection | null;
  detectionHistory: ObstacleDetection[];
  lastDetectionTime: string | null;
  error: string | null;
  currentDetections: DetectionContract[];
  detectionCount: number;
  dedupSuppressed: number;
  stalePruned: number;
  queueOverflows: number;
  renderCount: number;
  totalDrops: number;
  averageConfidence: number;
}

const initialState: AIState = {
  status: AI_STATES.IDLE,
  currentObstacle: null,
  detectionHistory: [],
  lastDetectionTime: null,
  error: null,
  currentDetections: [],
  detectionCount: 0,
  dedupSuppressed: 0,
  stalePruned: 0,
  queueOverflows: 0,
  renderCount: 0,
  totalDrops: 0,
  averageConfidence: 0,
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
    addDetection: (state, action: PayloadAction<DetectionContract>) => {
      const d = action.payload;
      state.detectionCount++;
      state.currentDetections = [d, ...state.currentDetections.slice(0, 19)];
      state.lastDetectionTime = new Date(d.processedAt).toISOString();
      if (state.detectionCount > 0) {
        const totalConf = state.currentDetections.reduce((s, x) => s + x.confidence.overall, 0);
        state.averageConfidence = totalConf / state.currentDetections.length;
      }
    },
    clearDetections: state => {
      state.currentDetections = [];
      state.detectionCount = 0;
      state.averageConfidence = 0;
    },
    setDetectionStats: (state, action: PayloadAction<{
      dedupSuppressed?: number;
      stalePruned?: number;
      queueOverflows?: number;
      renderCount?: number;
      totalDrops?: number;
    }>) => {
      if (action.payload.dedupSuppressed !== undefined) state.dedupSuppressed = action.payload.dedupSuppressed;
      if (action.payload.stalePruned !== undefined) state.stalePruned = action.payload.stalePruned;
      if (action.payload.queueOverflows !== undefined) state.queueOverflows = action.payload.queueOverflows;
      if (action.payload.renderCount !== undefined) state.renderCount = action.payload.renderCount;
      if (action.payload.totalDrops !== undefined) state.totalDrops = action.payload.totalDrops;
    },
    reset: () => initialState,
  },
});

export const aiActions = aiSlice.actions;
export default aiSlice.reducer;
