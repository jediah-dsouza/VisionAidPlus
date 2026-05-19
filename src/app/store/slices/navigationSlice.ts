import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type NavigationStatus = 'idle' | 'active' | 'paused' | 'error';

interface NavigationState {
  status: NavigationStatus;
  destination: string | null;
  eta: number | null;
  distanceRemaining: number | null;
  currentInstruction: string | null;
  error: string | null;
}

const initialState: NavigationState = {
  status: 'idle',
  destination: null,
  eta: null,
  distanceRemaining: null,
  currentInstruction: null,
  error: null,
};

export const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    startNavigation: (state, action: PayloadAction<string>) => {
      state.status = 'active';
      state.destination = action.payload;
      state.error = null;
    },
    setInstruction: (state, action: PayloadAction<string>) => {
      state.currentInstruction = action.payload;
    },
    updateProgress: (state, action: PayloadAction<{ eta: number; distance: number }>) => {
      state.eta = action.payload.eta;
      state.distanceRemaining = action.payload.distance;
    },
    pauseNavigation: state => {
      state.status = 'paused';
    },
    resumeNavigation: state => {
      state.status = 'active';
    },
    stopNavigation: () => initialState,
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.status = 'error';
    },
  },
});

export const navigationActions = navigationSlice.actions;
export default navigationSlice.reducer;
