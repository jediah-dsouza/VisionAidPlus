import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TTS_STATES } from '@shared/constants';

interface TTSState {
  status: (typeof TTS_STATES)[keyof typeof TTS_STATES];
  queue: string[];
  currentText: string | null;
  isEnabled: boolean;
  language: string;
  speechRate: number;
}

const initialState: TTSState = {
  status: TTS_STATES.IDLE,
  queue: [],
  currentText: null,
  isEnabled: true,
  language: 'en-US',
  speechRate: 0.5,
};

export const ttsSlice = createSlice({
  name: 'tts',
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<TTSState['status']>) => {
      state.status = action.payload;
    },
    addToQueue: (state, action: PayloadAction<string>) => {
      state.queue = [...state.queue, action.payload];
    },
    removeFromQueue: state => {
      state.queue = state.queue.slice(1);
      if (state.queue.length > 0) {
        state.currentText = state.queue[0];
      } else {
        state.currentText = null;
        state.status = TTS_STATES.IDLE;
      }
    },
    setCurrentText: (state, action: PayloadAction<string | null>) => {
      state.currentText = action.payload;
    },
    setEnabled: (state, action: PayloadAction<boolean>) => {
      state.isEnabled = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setSpeechRate: (state, action: PayloadAction<number>) => {
      state.speechRate = action.payload;
    },
    clearQueue: state => {
      state.queue = [];
      state.currentText = null;
      state.status = TTS_STATES.IDLE;
    },
    reset: () => initialState,
  },
});

export const ttsActions = ttsSlice.actions;
export default ttsSlice.reducer;
