import { bleConnectionManager } from '../../../src/core/ble/BLEConnectionManager';
import { bleSubscriptionManager } from '../../../src/core/ble/BLESubscriptionManager';
import { eventBus, EVENTS } from '../../../src/core/events/EventBus';
import { BLE_CHARACTERISTIC_UUIDS } from '../../../src/core/ble/constants';
import { MockRegistry } from '../MockRegistry';
import { flushPromises } from '../helpers/asyncLifecycle';

beforeAll(() => {
  MockRegistry.resetAll();
});

afterEach(async () => {
  eventBus.removeAllListeners();
  await bleConnectionManager.disconnect('cleanup').catch(() => {});
  bleConnectionManager.destroy();
  await flushPromises();
});

describe('BLE Realtime Integration', () => {
  it('connect event published via EventBus', () => {
    const handler = jest.fn();
    eventBus.subscribe(EVENTS.BLE_DEVICE_CONNECTED, handler);

    eventBus.publish(EVENTS.BLE_DEVICE_CONNECTED, { deviceId: 'test-device-001', deviceName: 'Test' });

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ deviceId: 'test-device-001' }),
    );
  });

  it('disconnect event published via EventBus', () => {
    const handler = jest.fn();
    eventBus.subscribe(EVENTS.BLE_DEVICE_DISCONNECTED, handler);

    eventBus.publish(EVENTS.BLE_DEVICE_DISCONNECTED, { deviceId: 'test-device-001', reason: 'test' });

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ deviceId: 'test-device-001' }),
    );
  });

  it('publishes obstacle detected event via EventBus', () => {
    const handler = jest.fn();
    eventBus.subscribe(EVENTS.AI_OBSTACLE_DETECTED, handler);

    eventBus.publish(EVENTS.AI_OBSTACLE_DETECTED, {
      type: 'person',
      distance: 150,
      direction: 'center',
      severity: 'caution',
    });

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'person', distance: 150, severity: 'caution' }),
    );
  });

  it('destroy cleanup prevents operations on EventBus', () => {
    const handler = jest.fn();
    eventBus.subscribe(EVENTS.BLE_DEVICE_CONNECTED, handler);

    eventBus.removeAllListeners();
    eventBus.publish(EVENTS.BLE_DEVICE_CONNECTED, {});

    expect(handler).not.toHaveBeenCalled();
  });

  it('disconnect after destroy does not throw', async () => {
    bleConnectionManager.destroy();
    await expect(bleConnectionManager.disconnect('cleanup')).resolves.not.toThrow();
  });
});
