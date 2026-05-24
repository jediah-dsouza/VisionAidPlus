import bleReducer, { bleActions } from '../../src/app/store/slices/bleSlice';

describe('bleSlice', () => {
  const initialState = bleReducer(undefined, { type: 'init' });

  it('starts in idle state', () => {
    expect(initialState.connectionState).toBe('idle');
    expect(initialState.status).toBe('idle');
    expect(initialState.connectedDeviceId).toBeNull();
    expect(initialState.devices).toEqual([]);
    expect(initialState.signalStrength).toBe(-127);
  });

  it('handles setConnectionState', () => {
    const state = bleReducer(initialState, bleActions.setConnectionState('scanning'));
    expect(state.connectionState).toBe('scanning');
  });

  it('handles setConnectedDevice', () => {
    const state = bleReducer(
      initialState,
      bleActions.setConnectedDevice({ id: 'device-1', name: 'VisionAid Pro' }),
    );
    expect(state.connectedDeviceId).toBe('device-1');
    expect(state.connectedDeviceName).toBe('VisionAid Pro');
    expect(state.connectedAt).toBeGreaterThan(0);
  });

  it('handles setConnectedDevice null', () => {
    const withDevice = bleReducer(
      initialState,
      bleActions.setConnectedDevice({ id: 'device-1', name: 'VisionAid Pro' }),
    );
    const cleared = bleReducer(withDevice, bleActions.setConnectedDevice(null));
    expect(cleared.connectedDeviceId).toBeNull();
    expect(cleared.connectedDeviceName).toBeNull();
  });

  it('handles setDevices', () => {
    const devices = [
      { id: 'd1', name: 'Dev1', rssi: -50, isConnected: false, lastSeen: Date.now() },
      { id: 'd2', name: 'Dev2', rssi: -70, isConnected: false, lastSeen: Date.now() },
    ];
    const state = bleReducer(initialState, bleActions.setDevices(devices));
    expect(state.devices).toEqual(devices);
  });

  it('handles addDevice (new)', () => {
    const device = { id: 'd1', name: 'Dev1', rssi: -50, isConnected: false, lastSeen: Date.now() };
    const state = bleReducer(initialState, bleActions.addDevice(device));
    expect(state.devices).toHaveLength(1);
    expect(state.devices[0]).toEqual(device);
  });

  it('handles addDevice (update existing)', () => {
    const device1 = { id: 'd1', name: 'Dev1', rssi: -50, isConnected: false, lastSeen: Date.now() };
    const state1 = bleReducer(initialState, bleActions.addDevice(device1));

    const device1Updated = { ...device1, rssi: -45 };
    const state2 = bleReducer(state1, bleActions.addDevice(device1Updated));
    expect(state2.devices).toHaveLength(1);
    expect(state2.devices[0].rssi).toBe(-45);
  });

  it('handles setSignalStrength', () => {
    const state = bleReducer(initialState, bleActions.setSignalStrength(-60));
    expect(state.signalStrength).toBe(-60);
  });

  it('handles setBatteryLevel', () => {
    const state = bleReducer(initialState, bleActions.setBatteryLevel(85));
    expect(state.batteryLevel).toBe(85);
  });

  it('handles setChargingStatus', () => {
    const state = bleReducer(initialState, bleActions.setChargingStatus('charging'));
    expect(state.chargingStatus).toBe('charging');
  });

  it('handles setMtu', () => {
    const state = bleReducer(initialState, bleActions.setMtu(512));
    expect(state.mtu).toBe(512);
  });

  it('handles setReconnectAttempts', () => {
    const state = bleReducer(initialState, bleActions.setReconnectAttempts(3));
    expect(state.reconnectAttempts).toBe(3);
  });

  it('handles setScanning', () => {
    const state = bleReducer(initialState, bleActions.setScanning(true));
    expect(state.isScanning).toBe(true);
  });

  it('handles setError', () => {
    const state = bleReducer(initialState, bleActions.setError('Connection failed'));
    expect(state.lastError).toBe('Connection failed');
    expect(state.status).toBe('error');
    expect(state.connectionState).toBe('error');
  });

  it('handles reset', () => {
    const modified = bleReducer(initialState, bleActions.setConnectionState('connected'));
    const reset = bleReducer(modified, bleActions.reset());
    expect(reset).toEqual(initialState);
  });
});
