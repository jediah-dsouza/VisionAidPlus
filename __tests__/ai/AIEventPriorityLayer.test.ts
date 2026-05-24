import { AIEventPriorityLayer } from '../../src/core/camera/AIEventPriorityLayer';
import type { DetectionContract } from '../../src/core/camera/types';

jest.mock('../../src/core/debug', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../src/core/events/EventBus', () => ({
  eventBus: {
    subscribe: jest.fn(() => jest.fn()),
    publish: jest.fn(),
  },
  EVENTS: {},
}));

jest.mock('../../src/core/events/AI_EVENTS', () => ({
  AI_EVENTS: {
    DETECTION_CLASSIFIED: 'ai:detectionClassified',
  },
}));

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

describe('AIEventPriorityLayer', () => {
  let layer: AIEventPriorityLayer;

  beforeEach(() => {
    jest.clearAllMocks();
    layer = new AIEventPriorityLayer();
  });

  afterEach(() => {
    layer.destroy();
  });

  it('assigns priority based on detection type', () => {
    const hazard = layer.classify(makeDetection({ type: 'hazard' }));
    expect(hazard.priority).toBe('critical');

    const person = layer.classify(makeDetection({ type: 'person' }));
    expect(person.priority).toBe('high');

    const text = layer.classify(makeDetection({ type: 'text' }));
    expect(text.priority).toBe('background');
  });

  it('uses normal for doorway type', () => {
    const det = layer.classify(makeDetection({ type: 'doorway' }));
    expect(det.priority).toBe('normal');
  });

  it('publishes DETECTION_CLASSIFIED event', () => {
    const { eventBus } = require('../../src/core/events/EventBus');
    layer.classify(makeDetection({ type: 'hazard' }));
    expect(eventBus.publish).toHaveBeenCalledWith('ai:detectionClassified', expect.any(Object), 'high');
  });

  it('getPriorityForType returns correct priority', () => {
    expect(layer.getPriorityForType('hazard')).toBe('critical');
    expect(layer.getPriorityForType('person')).toBe('high');
    expect(layer.getPriorityForType('text')).toBe('background');
    expect(layer.getPriorityForType('doorway')).toBe('normal');
  });

  it('destroy prevents classification', () => {
    layer.destroy();
    const d = makeDetection({ type: 'hazard' });
    const result = layer.classify(d);
    expect(result.priority).toBe('normal');
  });
});
