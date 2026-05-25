import { AnalyticsEventBridge } from '../../src/core/analytics/AnalyticsEventBridge';
import { EVENTS } from '../../src/core/events/EventBus';
import { EventBus } from '../../src/core/events/EventBus';
import type { AnalyticsEvent } from '../../src/core/analytics/types';

describe('AnalyticsEventBridge', () => {
  let bridge: AnalyticsEventBridge;
  let eventBus: EventBus;
  let onAnalyticsEvent: jest.Mock;

  beforeEach(() => {
    bridge = new AnalyticsEventBridge();
    eventBus = new EventBus();
    onAnalyticsEvent = jest.fn();
    bridge.onAnalyticsEvent = onAnalyticsEvent;
  });

  afterEach(() => {
    bridge.destroy();
  });

  it('connects to EventBus and subscribes to events', () => {
    bridge.connect(eventBus);
    expect(onAnalyticsEvent).not.toHaveBeenCalled();
  });

  it('routes BLE_DEVICE_CONNECTED as analytics session event', () => {
    bridge.connect(eventBus);
    eventBus.publish(EVENTS.BLE_DEVICE_CONNECTED, { deviceId: 'd1' });
    expect(onAnalyticsEvent).toHaveBeenCalledTimes(1);
    const event: AnalyticsEvent = onAnalyticsEvent.mock.calls[0][0];
    expect(event.category).toBe('session');
    expect(event.source).toBe('ble');
    expect(event.severity).toBe('info');
  });

  it('routes AI_OBSTACLE_DETECTED as obstacle event', () => {
    bridge.connect(eventBus);
    eventBus.publish(EVENTS.AI_OBSTACLE_DETECTED, { distance: 150 });
    expect(onAnalyticsEvent).toHaveBeenCalledTimes(1);
    const event: AnalyticsEvent = onAnalyticsEvent.mock.calls[0][0];
    expect(event.category).toBe('obstacle');
    expect(event.source).toBe('ai');
  });

  it('routes EMERGENCY_TRIGGERED as safety critical event', () => {
    bridge.connect(eventBus);
    eventBus.publish(EVENTS.EMERGENCY_TRIGGERED, { type: 'fall' });
    expect(onAnalyticsEvent).toHaveBeenCalledTimes(1);
    const event: AnalyticsEvent = onAnalyticsEvent.mock.calls[0][0];
    expect(event.category).toBe('safety');
    expect(event.severity).toBe('critical');
  });

  it('routes multiple event types correctly', () => {
    bridge.connect(eventBus);
    eventBus.publish(EVENTS.AI_DANGER_DETECTED, {});
    eventBus.publish(EVENTS.NAVIGATION_STARTED, {});
    expect(onAnalyticsEvent).toHaveBeenCalledTimes(2);
    expect(onAnalyticsEvent.mock.calls[0][0].category).toBe('safety');
    expect(onAnalyticsEvent.mock.calls[1][0].category).toBe('usage');
  });

  it('disconnect removes subscriptions', () => {
    bridge.connect(eventBus);
    bridge.disconnect();
    eventBus.publish(EVENTS.BLE_DEVICE_CONNECTED, {});
    expect(onAnalyticsEvent).not.toHaveBeenCalled();
  });

  it('disconnect before connect is safe', () => {
    expect(() => bridge.disconnect()).not.toThrow();
  });

  it('connect warns when already connected and replaces', () => {
    bridge.connect(eventBus);
    const bus2 = new EventBus();
    bridge.connect(bus2);
    eventBus.publish(EVENTS.BLE_DEVICE_CONNECTED, {});
    expect(onAnalyticsEvent).not.toHaveBeenCalled();
  });

  it('does not invoke callback after destroy', () => {
    bridge.connect(eventBus);
    bridge.destroy();
    eventBus.publish(EVENTS.BLE_DEVICE_CONNECTED, {});
    expect(onAnalyticsEvent).not.toHaveBeenCalled();
  });
});
