import { eventBus } from '../../src/core/events/EventBus';
import { AI_EVENTS } from '../../src/core/events/AI_EVENTS';

jest.mock('../../src/core/debug', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe('AI_EVENTS', () => {
  it('defines all expected event keys', () => {
    expect(AI_EVENTS).toMatchObject({
      FRAME_CAPTURED: 'ai:frameCaptured',
      DETECTION_RECEIVED: 'ai:detectionReceived',
      DETECTION_CLASSIFIED: 'ai:detectionClassified',
      DETECTIONS_RENDER: 'ai:detectionsRender',
      SESSION_STATE_CHANGE: 'ai:sessionStateChange',
      PIPELINE_ERROR: 'ai:pipelineError',
      FRAME_DROPPED: 'ai:frameDropped',
      QUEUE_OVERFLOW: 'ai:queueOverflow',
      THROTTLE_ADJUSTED: 'ai:throttleAdjusted',
      METRICS_UPDATE: 'ai:metricsUpdate',
    });
  });

  it('all events use ai: prefix', () => {
    Object.values(AI_EVENTS).forEach(event => {
      expect(event).toMatch(/^ai:/);
    });
  });
});

describe('EventBus AI subscription', () => {
  let unsub: () => void;

  afterEach(() => {
    if (unsub) unsub();
  });

  it('publishes and receives ai:frameCaptured', () => {
    const handler = jest.fn();
    unsub = eventBus.subscribe('ai:frameCaptured', handler);
    eventBus.publish('ai:frameCaptured', { frameId: 'frame_1' }, 'normal');
    expect(handler).toHaveBeenCalledWith({ frameId: 'frame_1' });
  });

  it('publishes and receives ai:sessionStateChange', () => {
    const handler = jest.fn();
    unsub = eventBus.subscribe('ai:sessionStateChange', handler);
    eventBus.publish('ai:sessionStateChange', { state: 'active' }, 'normal');
    expect(handler).toHaveBeenCalledWith({ state: 'active' });
  });

  it('publishes and receives ai:detectionsRender', () => {
    const handler = jest.fn();
    unsub = eventBus.subscribe('ai:detectionsRender', handler);
    eventBus.publish('ai:detectionsRender', { detections: [] }, 'normal');
    expect(handler).toHaveBeenCalledWith({ detections: [] });
  });

  it('unsubscribe stops receiving', () => {
    const handler = jest.fn();
    const unsubFn = eventBus.subscribe('ai:frameCaptured', handler);
    unsubFn();
    eventBus.publish('ai:frameCaptured', {}, 'normal');
    expect(handler).not.toHaveBeenCalled();
  });
});
