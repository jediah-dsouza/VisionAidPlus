import { aiActions, aiSlice } from '../../src/app/store/slices/aiSlice';
import type { DetectionContract } from '../../src/core/camera/types';

function makeDetection(overrides: Partial<DetectionContract> = {}): DetectionContract {
  return {
    id: `det_${Date.now()}`,
    type: 'person',
    priority: 'normal',
    source: 'ai_model',
    lifecycleState: 'captured',
    position: { x: 0, y: 0, width: 100, height: 200 },
    confidence: { overall: 0.85, classification: 0.85, spatial: 0.85, temporal: 0.85 },
    frameId: 'frame_0',
    sourceTimestamp: Date.now(),
    processedAt: Date.now(),
    ttlMs: 5000,
    tracking: null,
    metadata: {},
    ...overrides,
  };
}

describe('aiSlice', () => {
  const initialState = {
    status: 'idle' as const,
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

  it('returns initial state', () => {
    const state = aiSlice.reducer(undefined, { type: 'unknown' });
    expect(state).toEqual(initialState);
  });

  it('setStatus updates status', () => {
    const state = aiSlice.reducer(undefined, aiActions.setStatus('detecting'));
    expect(state.status).toBe('detecting');
  });

  it('addDetection appends to currentDetections', () => {
    const detection = makeDetection({ id: 'det_1' });
    const state = aiSlice.reducer(undefined, aiActions.addDetection(detection));
    expect(state.currentDetections).toHaveLength(1);
    expect(state.detectionCount).toBe(1);
    expect(state.lastDetectionTime).toBeDefined();
  });

  it('addDetection caps at 20 detections', () => {
    for (let i = 0; i < 25; i++) {
      aiSlice.reducer(undefined, aiActions.addDetection({
        ...makeDetection({ id: `det_${i}`, confidence: { overall: 0.8, classification: 0.8, spatial: 0.8, temporal: 0.8 } }),
      }));
    }
    const state = aiSlice.reducer(undefined, aiActions.addDetection({
      ...makeDetection({ id: 'last', confidence: { overall: 0.9, classification: 0.9, spatial: 0.9, temporal: 0.9 } }),
    }));
    expect(state.currentDetections.length).toBeLessThanOrEqual(20);
  });

  it('clearDetections resets detection state', () => {
    const withDetection = aiSlice.reducer(undefined, aiActions.addDetection({
      ...makeDetection({ id: 'det_1' }),
    }));
    const state = aiSlice.reducer(withDetection, aiActions.clearDetections());
    expect(state.currentDetections).toEqual([]);
    expect(state.detectionCount).toBe(0);
  });

  it('setCurrentObstacle updates obstacle and history', () => {
    const obstacle = {
      type: 'person', distance: 5, direction: 'center' as const,
      severity: 'caution' as const, timestamp: '2026-01-01T00:00:00.000Z', voiceInstruction: 'Stop',
    };
    const state = aiSlice.reducer(undefined, aiActions.setCurrentObstacle(obstacle));
    expect(state.currentObstacle).toEqual(obstacle);
    expect(state.detectionHistory).toHaveLength(1);
    expect(state.lastDetectionTime).toBe('2026-01-01T00:00:00.000Z');
  });

  it('clearObstacle clears obstacle', () => {
    const state = aiSlice.reducer(undefined, aiActions.clearObstacle());
    expect(state.currentObstacle).toBeNull();
  });

  it('setError sets error and OFFLINE status', () => {
    const state = aiSlice.reducer(undefined, aiActions.setError('Test error'));
    expect(state.error).toBe('Test error');
    expect(state.status).toBe('offline');
  });

  it('reset returns to initial state', () => {
    const modified = aiSlice.reducer(undefined, aiActions.setStatus('detecting'));
    const reset = aiSlice.reducer(modified, aiActions.reset());
    expect(reset).toEqual(initialState);
  });
});
