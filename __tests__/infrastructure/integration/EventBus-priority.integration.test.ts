import { eventBus, EVENTS } from '../../../src/core/events/EventBus';
import { MockRegistry } from '../MockRegistry';
import { flushPromises } from '../helpers/asyncLifecycle';

beforeAll(() => {
  MockRegistry.resetAll();
});

afterEach(() => {
  eventBus.removeAllListeners();
});

describe('EventBus Priority Integration', () => {
  it('subscribes and receives published events', () => {
    const handler = jest.fn();
    eventBus.subscribe(EVENTS.BLE_DEVICE_CONNECTED, handler);
    eventBus.publish(EVENTS.BLE_DEVICE_CONNECTED, { deviceId: 'd1' });

    expect(handler).toHaveBeenCalledWith({ deviceId: 'd1' });
  });

  it('high priority handlers fire before normal', () => {
    const order: string[] = [];
    eventBus.subscribe(EVENTS.BLE_DEVICE_CONNECTED, () => order.push('normal'), 'normal');
    eventBus.subscribe(EVENTS.BLE_DEVICE_CONNECTED, () => order.push('high'), 'high');

    eventBus.publish(EVENTS.BLE_DEVICE_CONNECTED, {});

    expect(order[0]).toBe('high');
  });

  it('handler errors do not crash EventBus', () => {
    const handler1 = jest.fn(() => { throw new Error('handler crash'); });
    const handler2 = jest.fn();
    eventBus.subscribe(EVENTS.BLE_DEVICE_DISCONNECTED, handler1);
    eventBus.subscribe(EVENTS.BLE_DEVICE_DISCONNECTED, handler2);

    expect(() => {
      eventBus.publish(EVENTS.BLE_DEVICE_DISCONNECTED, {});
    }).not.toThrow();
    expect(handler2).toHaveBeenCalled();
  });

  it('unsubscribe removes handler', () => {
    const handler = jest.fn();
    const unsub = eventBus.subscribe(EVENTS.AI_OBSTACLE_DETECTED, handler);
    unsub();
    eventBus.publish(EVENTS.AI_OBSTACLE_DETECTED, {});

    expect(handler).not.toHaveBeenCalled();
  });

  it('removeAllListeners clears all subscriptions', () => {
    const h1 = jest.fn();
    const h2 = jest.fn();
    eventBus.subscribe(EVENTS.BLE_DEVICE_CONNECTED, h1);
    eventBus.subscribe(EVENTS.BLE_DEVICE_DISCONNECTED, h2);

    eventBus.removeAllListeners();
    eventBus.publish(EVENTS.BLE_DEVICE_CONNECTED, {});
    eventBus.publish(EVENTS.BLE_DEVICE_DISCONNECTED, {});

    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });
});
