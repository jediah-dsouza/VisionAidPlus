import { bleReconnectionManager } from '../../src/core/ble/BLEReconnectionManager';

describe('BLEReconnectionManager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    bleReconnectionManager.reset();
  });

  afterEach(() => {
    bleReconnectionManager.destroy();
    jest.useRealTimers();
  });

  it('starts in idle state', () => {
    expect(bleReconnectionManager.isReconnecting).toBe(false);
    expect(bleReconnectionManager.currentAttempt).toBe(0);
  });

  it('resets correctly', () => {
    bleReconnectionManager.start('device-1', () => Promise.resolve(false));
    expect(bleReconnectionManager.stateSnapshot.isActive).toBe(true);

    bleReconnectionManager.reset();
    expect(bleReconnectionManager.isReconnecting).toBe(false);
    expect(bleReconnectionManager.currentAttempt).toBe(0);
  });

  it('tracks state snapshot after start', () => {
    bleReconnectionManager.start('device-1', () => Promise.resolve(false));
    const state = bleReconnectionManager.stateSnapshot;
    expect(state.deviceId).toBe('device-1');
    expect(state.isActive).toBe(true);
    expect(state.maxAttempts).toBe(5);
    expect(state.attempt).toBe(0);
  });

  it('can be paused after start', () => {
    const handler = jest.fn().mockResolvedValue(false);
    bleReconnectionManager.start('device-1', handler);

    bleReconnectionManager.pause();
    jest.advanceTimersByTime(10000);
    expect(handler).not.toHaveBeenCalled();

    bleReconnectionManager.resume();
    jest.advanceTimersByTime(1000);
    expect(handler).toHaveBeenCalled();
  });

  it('stops on destroy', () => {
    bleReconnectionManager.start('device-1', () => Promise.resolve(false));
    bleReconnectionManager.destroy();
    expect(bleReconnectionManager.isReconnecting).toBe(false);
  });

  it('can restart mid-process', () => {
    const handler = jest.fn().mockResolvedValue(false);
    bleReconnectionManager.start('device-1', handler);
    jest.advanceTimersByTime(1000);
    expect(handler).toHaveBeenCalledTimes(1);

    bleReconnectionManager.start('device-1', handler);
    jest.advanceTimersByTime(1000);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('handles stop gracefully when not reconnecting', () => {
    expect(() => bleReconnectionManager.stop()).not.toThrow();
    expect(() => bleReconnectionManager.reset()).not.toThrow();
  });
});
