import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CameraSessionState } from '@core/camera/types';

interface CameraState {
  sessionState: CameraSessionState;
  frameRate: number;
  processedFrames: number;
  droppedFrames: number;
  targetFps: number;
  error: string | null;
}

const initialState: CameraState = {
  sessionState: 'idle',
  frameRate: 0,
  processedFrames: 0,
  droppedFrames: 0,
  targetFps: 30,
  error: null,
};

export const cameraSlice = createSlice({
  name: 'camera',
  initialState,
  reducers: {
    setSessionState: (state, action: PayloadAction<CameraSessionState>) => {
      state.sessionState = action.payload;
    },
    setFrameRate: (state, action: PayloadAction<number>) => {
      state.frameRate = action.payload;
    },
    setProcessedFrames: (state, action: PayloadAction<number>) => {
      state.processedFrames = action.payload;
    },
    setDroppedFrames: (state, action: PayloadAction<number>) => {
      state.droppedFrames = action.payload;
    },
    setTargetFps: (state, action: PayloadAction<number>) => {
      state.targetFps = action.payload;
    },
    setCameraError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetCamera: () => initialState,
  },
});

export const cameraActions = cameraSlice.actions;
export default cameraSlice.reducer;
