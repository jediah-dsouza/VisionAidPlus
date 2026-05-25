import { eventBus, EVENTS } from '../../../src/core/events/EventBus';
import type { AnalyticsEvent } from '../../../src/core/analytics/types';
import { factories } from '../helpers/factories';

beforeAll(() => {
  factories.resetCounter();
});

afterEach(() => {
  eventBus.removeAllListeners();
});

describe('Analytics Pipeline Integration', () => {
  it('factory builders create unique analytics events', () => {
    const event1 = factories.analyticsEvent({ category: 'obstacle' });
    const event2 = factories.analyticsEvent({ category: 'safety' });

    expect(event1.id).toBeTruthy();
    expect(event1.id).not.toBe(event2.id);
    expect(event1.category).toBe('obstacle');
    expect(event2.category).toBe('safety');
  });

  it('EventBus subscribe and publish round-trip works', () => {
    const handler = jest.fn();
    eventBus.subscribe(EVENTS.AI_OBSTACLE_DETECTED, handler);

    eventBus.publish(EVENTS.AI_OBSTACLE_DETECTED, { distanceCm: 200 });

    expect(handler).toHaveBeenCalledWith({ distanceCm: 200 });
  });

  it('multiple EventBus events deliver independently', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    eventBus.subscribe(EVENTS.BLE_DEVICE_CONNECTED, handler1);
    eventBus.subscribe(EVENTS.BLE_DEVICE_DISCONNECTED, handler2);

    eventBus.publish(EVENTS.BLE_DEVICE_CONNECTED, { deviceId: 'd1' });
    eventBus.publish(EVENTS.BLE_DEVICE_DISCONNECTED, { deviceId: 'd1' });

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('factory alert records have required fields', () => {
    const alert = factories.alertRecord();
    expect(alert.id).toBeTruthy();
    expect(alert.title).toBe('Test Alert');
    expect(alert.status).toBe('active');
  });

  it('factory performance metrics have reasonable defaults', () => {
    const metrics = factories.performanceMetrics();
    expect(metrics.totalEventsIngested).toBe(100);
    expect(metrics.eventsPerSecond).toBe(50);
  });
});
