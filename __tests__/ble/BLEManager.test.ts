jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  Platform: { OS: 'android' },
}));

jest.setTimeout(15000);

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

type Modules = {
  bleManager: any;
  BLEManager: any;
  bleConnectionManager: any;
  bleScanner: any;
  bleSubscriptionManager: any;
  bleReconnectionManager: any;
  blePacketParser: any;
};

let BLEManager: any;
let bleManager: any;
let bleConnectionManager: any;
let bleScanner: any;
let bleSubscriptionManager: any;
let bleReconnectionManager: any;
let blePacketParser: any;

beforeEach(() => {
  jest.resetModules();
  const BLE = require('../../src/core/ble/BLEManager');
  const CONN = require('../../src/core/ble/BLEConnectionManager');
  const SCAN = require('../../src/core/ble/BLEScanner');
  const SUB = require('../../src/core/ble/BLESubscriptionManager');
  const RECO = require('../../src/core/ble/BLEReconnectionManager');
  const PARSER = require('../../src/core/ble/BLEPacketParser');

  bleManager = BLE.bleManager;
  BLEManager = BLE.BLEManager;
  bleConnectionManager = CONN.bleConnectionManager;
  bleScanner = SCAN.bleScanner;
  bleSubscriptionManager = SUB.bleSubscriptionManager;
  bleReconnectionManager = RECO.bleReconnectionManager;
  blePacketParser = PARSER.blePacketParser;
});

afterEach(() => {
  if (bleManager && typeof bleManager.destroy === 'function') {
    bleManager.destroy();
  }
});

describe('BLEManager integration', () => {
  it('initialize sets up the manager', async () => {
    await expect(bleManager.startScan()).rejects.toThrow('Not initialized');
    bleManager.initialize();
    expect(bleManager.isConnected).toBe(false);
    expect(bleManager.connectedDeviceId).toBeNull();
    expect(bleManager.discoveredDevices).toEqual([]);
  });

  it('initialize is idempotent', () => {
    bleManager.initialize();
    bleManager.initialize();
    expect(bleManager.isConnected).toBe(false);
  });

  it('scan lifecycle discovers mock devices', async () => {
    bleManager.initialize();
    await bleManager.startScan();

    expect(bleScanner.scanning).toBe(true);

    await delay(1100);
    expect(bleScanner.discovered.length).toBeGreaterThanOrEqual(1);

    await bleManager.stopScan();
    expect(bleScanner.scanning).toBe(false);
  }, 10000);

  it('connects to a discovered device', async () => {
    bleManager.initialize();
    await bleManager.startScan();
    await delay(1100);

    const devices = bleManager.discoveredDevices;
    expect(devices.length).toBeGreaterThanOrEqual(1);

    const success = await bleManager.connectToDevice(devices[0]);
    expect(success).toBe(true);
    expect(bleManager.isConnected).toBe(true);
    expect(bleManager.connectedDeviceId).toBe(devices[0].id);
    expect(bleConnectionManager.currentState).toBe('connected');
  }, 10000);

  it('disconnect transitions to disconnected state', async () => {
    bleManager.initialize();
    await bleManager.startScan();
    await delay(1100);
    const devices = bleManager.discoveredDevices;
    await bleManager.connectToDevice(devices[0]);

    await bleManager.disconnect('test');
    await delay(500);

    expect(bleConnectionManager.currentState).toBe('disconnected');
    expect(bleManager.isConnected).toBe(false);
  }, 10000);

  it('attemptReconnect re-establishes connection', async () => {
    bleManager.initialize();
    await bleManager.startScan();
    await delay(1100);
    const devices = bleManager.discoveredDevices;
    await bleManager.connectToDevice(devices[0]);

    await bleManager.disconnect('test');
    await delay(600);

    expect(bleManager.isConnected).toBe(false);

    const reconnected = await bleManager.attemptReconnect();
    expect(reconnected).toBe(true);
    expect(bleManager.isConnected).toBe(true);
  }, 10000);

  it('handles packet parsing and routing', () => {
    bleManager.initialize();

    const obstacles = [
      '0000FFE1-0000-1000-8000-00805F9B34FB',
      't=person,d=150,dir=center,sev=caution',
    ] as const;
    const battery = [
      '0000FFE2-0000-1000-8000-00805F9B34FB',
      'lvl=85,chg=discharging,v=3.7,temp=28',
    ] as const;

    const obstaclesBase64 = Buffer.from(obstacles[1]).toString('base64');
    const batteryBase64 = Buffer.from(battery[1]).toString('base64');

    bleManager.handlePacketReceived(
      '0000FFE0-0000-1000-8000-00805F9B34FB',
      obstacles[0],
      obstaclesBase64,
    );

    bleManager.handlePacketReceived(
      '0000FFE0-0000-1000-8000-00805F9B34FB',
      battery[0],
      batteryBase64,
    );

    const metrics = bleManager.metricsSnapshot;
    expect(metrics.totalPacketsReceived).toBe(2);
    expect(metrics.totalPacketsParsed).toBe(2);
    expect(metrics.totalParseErrors).toBe(0);
    expect(metrics.totalReconnections).toBe(0);
    expect(metrics.totalDisconnections).toBe(0);
  }, 10000);

  it('reconnection manager is reset on disconnect', async () => {
    bleManager.initialize();
    await bleManager.startScan();
    await delay(1100);
    const devices = bleManager.discoveredDevices;
    await bleManager.connectToDevice(devices[0]);

    bleReconnectionManager.start('device-1', () => Promise.resolve(false));
    expect(bleReconnectionManager.isReconnecting).toBe(true);

    await bleManager.disconnect('test');
    expect(bleReconnectionManager.isReconnecting).toBe(false);
    expect(bleReconnectionManager.currentAttempt).toBe(0);
  }, 10000);

  it('subscription registration and deregistration lifecycle', () => {
    bleManager.initialize();

    const unsub = bleSubscriptionManager.register({
      serviceUUID: 'svc-1',
      characteristicUUID: 'char-1',
      packetType: 'obstacle',
      onPacket: () => {},
      onError: () => {},
    });

    const subsBefore = bleSubscriptionManager.activeSubscriptions;
    expect(subsBefore.some((s: any) => s.characteristicUUID === 'char-1')).toBe(true);

    unsub();

    const subsAfter = bleSubscriptionManager.activeSubscriptions;
    expect(subsAfter.some((s: any) => s.characteristicUUID === 'char-1')).toBe(false);
  }, 10000);

  it('re-connect to already connected device returns true', async () => {
    bleManager.initialize();
    await bleManager.startScan();
    await delay(1100);
    const devices = bleManager.discoveredDevices;

    await bleManager.connectToDevice(devices[0]);
    expect(bleManager.isConnected).toBe(true);

    await bleManager.disconnect('test');
    await delay(600);

    const reconnected = await bleManager.connectToDevice(devices[0]);
    expect(reconnected).toBe(true);
    expect(bleManager.isConnected).toBe(true);
  }, 10000);

  it('metrics are tracked correctly after operations', async () => {
    bleManager.initialize();
    await bleManager.startScan();
    await delay(1100);
    const devices = bleManager.discoveredDevices;
    await bleManager.connectToDevice(devices[0]);

    await bleManager.disconnect('test');
    await delay(500);

    const metrics = bleManager.metricsSnapshot;
    expect(metrics.totalDisconnections).toBeGreaterThanOrEqual(1);
    expect(metrics.uptime).toBeGreaterThan(0);
    expect(metrics.lastPacketAt).toBeNull();
  }, 10000);

  it('destroy cleans up all sub-managers', () => {
    bleManager.initialize();
    bleManager.destroy();

    expect(bleConnectionManager.currentState).toBe('idle');
    expect(bleScanner.scanning).toBe(false);
    expect(bleReconnectionManager.isReconnecting).toBe(false);
    expect(bleSubscriptionManager.subscriptionCount).toBe(0);
  });
});
