import { cameraActions, cameraSlice } from '../../src/app/store/slices/cameraSlice';

describe('cameraSlice', () => {
  const initialState = {
    sessionState: 'idle' as const,
    frameRate: 0,
    processedFrames: 0,
    droppedFrames: 0,
    targetFps: 30,
    error: null,
  };

  it('returns initial state', () => {
    const state = cameraSlice.reducer(undefined, { type: 'unknown' });
    expect(state).toEqual(initialState);
  });

  it('setSessionState updates session state', () => {
    const state = cameraSlice.reducer(undefined, cameraActions.setSessionState('active'));
    expect(state.sessionState).toBe('active');
  });

  it('setFrameRate updates frame rate', () => {
    const state = cameraSlice.reducer(undefined, cameraActions.setFrameRate(15));
    expect(state.frameRate).toBe(15);
  });

  it('setProcessedFrames updates processed count', () => {
    const state = cameraSlice.reducer(undefined, cameraActions.setProcessedFrames(100));
    expect(state.processedFrames).toBe(100);
  });

  it('setDroppedFrames updates dropped count', () => {
    const state = cameraSlice.reducer(undefined, cameraActions.setDroppedFrames(5));
    expect(state.droppedFrames).toBe(5);
  });

  it('setTargetFps updates target fps', () => {
    const state = cameraSlice.reducer(undefined, cameraActions.setTargetFps(15));
    expect(state.targetFps).toBe(15);
  });

  it('setCameraError sets error', () => {
    const state = cameraSlice.reducer(undefined, cameraActions.setCameraError('Camera error'));
    expect(state.error).toBe('Camera error');
  });

  it('resetCamera returns to initial state', () => {
    const modified = cameraSlice.reducer(undefined, cameraActions.setSessionState('active'));
    const reset = cameraSlice.reducer(modified, cameraActions.resetCamera());
    expect(reset).toEqual(initialState);
  });
});
