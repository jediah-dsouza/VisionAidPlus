import { blePacketParser } from '../../../src/core/ble/BLEPacketParser';
import { BLE_CHARACTERISTIC_UUIDS } from '../../../src/core/ble/constants';
import { mockNativeModules } from '../mocks/NativeModules';
import { flushPromises } from '../helpers/asyncLifecycle';

mockNativeModules();

const RUN_BENCHMARKS = typeof globalThis !== 'undefined' && !!(globalThis as any).__PERF__;

function makePacket(type: string, fields: Record<string, string | number>): string {
  const parts = [`t=${type}`];
  for (const [k, v] of Object.entries(fields)) {
    parts.push(`${k}=${v}`);
  }
  parts.push(`ts=${Date.now()}`);
  return parts.join(',');
}

beforeEach(() => {
  blePacketParser.reset();
});

describe('BLE Packet Throughput Benchmarks', () => {
  (RUN_BENCHMARKS ? it : it.skip)('obstacle packet parse throughput', () => {
    const packet = makePacket('person', { d: 150, dir: 'center', sev: 'caution' });
    const start = performance.now();
    const iterations = 1000;
    for (let i = 0; i < iterations; i++) {
      blePacketParser.parse(BLE_CHARACTERISTIC_UUIDS.OBSTACLE, packet);
    }
    const elapsed = performance.now() - start;
    const perSecond = (iterations / elapsed) * 1000;
    expect(perSecond).toBeGreaterThan(10000);
  });

  (RUN_BENCHMARKS ? it : it.skip)('battery packet parse throughput', () => {
    const packet = makePacket('battery', { bl: 85, cs: 'discharging', v: 3.7 });
    const start = performance.now();
    const iterations = 1000;
    for (let i = 0; i < iterations; i++) {
      blePacketParser.parse(BLE_CHARACTERISTIC_UUIDS.BATTERY, packet);
    }
    const elapsed = performance.now() - start;
    const perSecond = (iterations / elapsed) * 1000;
    expect(perSecond).toBeGreaterThan(10000);
  });

  (RUN_BENCHMARKS ? it : it.skip)('all packet types parse throughput', () => {
    const uuidToPayload: Array<[string, string]> = [
      [BLE_CHARACTERISTIC_UUIDS.OBSTACLE, makePacket('person', { d: 150, dir: 'center', sev: 'caution' })],
      [BLE_CHARACTERISTIC_UUIDS.BATTERY, makePacket('battery', { bl: 85, cs: 'discharging', v: 3.7 })],
      [BLE_CHARACTERISTIC_UUIDS.SIGNAL, makePacket('signal', { rssi: -65 })],
      [BLE_CHARACTERISTIC_UUIDS.STATUS, makePacket('status', { st: 'normal' })],
      [BLE_CHARACTERISTIC_UUIDS.NAVIGATION, makePacket('navigation', { dist: 20, dir: 'left', eta: 30 })],
    ];
    const start = performance.now();
    const iterations = 500;
    for (let i = 0; i < iterations; i++) {
      for (const [uuid, pkt] of uuidToPayload) {
        blePacketParser.parse(uuid, pkt);
      }
    }
    const elapsed = performance.now() - start;
    const perSecond = ((iterations * uuidToPayload.length) / elapsed) * 1000;
    expect(perSecond).toBeGreaterThan(10000);
  });
});
