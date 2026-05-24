import { blePacketParser, BLEPacketParser } from '../../src/core/ble/BLEPacketParser';
import { BLE_CHARACTERISTIC_UUIDS } from '../../src/core/ble/constants';

describe('BLEPacketParser', () => {
  beforeEach(() => {
    blePacketParser.reset();
  });

  describe('obstacle packets', () => {
    const OBSTACLE_CHAR = BLE_CHARACTERISTIC_UUIDS.OBSTACLE;

    it('parses a valid obstacle packet', () => {
      const raw = 't=person,d=150,dir=center,sev=caution,v=Person ahead 1.5 meters,ts=2026-01-01T00:00:00Z';
      const result = blePacketParser.parse(OBSTACLE_CHAR, raw);

      expect(result).not.toHaveProperty('error');
      if ('error' in result) return;

      expect(result.packet.type).toBe('obstacle');
      if (result.packet.type !== 'obstacle') return;

      expect(result.packet.obstacleType).toBe('person');
      expect(result.packet.distanceCm).toBe(150);
      expect(result.packet.direction).toBe('center');
      expect(result.packet.severity).toBe('caution');
      expect(result.packet.voiceInstruction).toBe('Person ahead 1.5 meters');
    });

    it('returns error for invalid distance', () => {
      const raw = 't=person,d=abc,dir=center,sev=caution';
      const result = blePacketParser.parse(OBSTACLE_CHAR, raw);

      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('Failed to parse');
      }
    });

    it('parses obstacle with bounding box', () => {
      const raw = 't=car,d=500,dir=left,sev=safe,v=Car left,bx=10,by=20,bw=100,bh=200';
      const result = blePacketParser.parse(OBSTACLE_CHAR, raw);

      expect(result).not.toHaveProperty('error');
      if ('error' in result) return;

      if (result.packet.type !== 'obstacle') return;
      expect(result.packet.boundingBox).toEqual({ x: 10, y: 20, width: 100, height: 200 });
    });

    it('parses all three severities', () => {
      for (const sev of ['safe', 'caution', 'danger']) {
        const raw = `t=person,d=100,dir=center,sev=${sev}`;
        const result = blePacketParser.parse(OBSTACLE_CHAR, raw);
        expect(result).not.toHaveProperty('error');
        if ('error' in result) return;
        if (result.packet.type !== 'obstacle') return;
        expect(result.packet.severity).toBe(sev);
      }
    });
  });

  describe('battery packets', () => {
    const BATTERY_CHAR = BLE_CHARACTERISTIC_UUIDS.BATTERY;

    it('parses valid battery packet', () => {
      const raw = 'lvl=85,chg=discharging,v=3.7,temp=28.5';
      const result = blePacketParser.parse(BATTERY_CHAR, raw);

      expect(result).not.toHaveProperty('error');
      if ('error' in result) return;

      if (result.packet.type !== 'battery') return;
      expect(result.packet.batteryLevel).toBe(85);
      expect(result.packet.chargingStatus).toBe('discharging');
      expect(result.packet.voltage).toBe(3.7);
    });

    it('returns error for out of range battery level', () => {
      const raw = 'lvl=150,chg=charging';
      const result = blePacketParser.parse(BATTERY_CHAR, raw);
      expect(result).toHaveProperty('error');
    });
  });

  describe('signal packets', () => {
    const SIGNAL_CHAR = BLE_CHARACTERISTIC_UUIDS.SIGNAL;

    it('parses valid signal packet', () => {
      const raw = 'r=-65,tx=-70,nf=-95,snr=25';
      const result = blePacketParser.parse(SIGNAL_CHAR, raw);

      expect(result).not.toHaveProperty('error');
      if ('error' in result) return;

      if (result.packet.type !== 'signal') return;
      expect(result.packet.rssi).toBe(-65);
      expect(result.packet.txPower).toBe(-70);
      expect(result.packet.snr).toBe(25);
    });
  });

  describe('status packets', () => {
    const STATUS_CHAR = BLE_CHARACTERISTIC_UUIDS.STATUS;

    it('parses valid status packet', () => {
      const raw = 'st=normal,up=3600,fw=v2.1.0,hw=v1.0';
      const result = blePacketParser.parse(STATUS_CHAR, raw);

      expect(result).not.toHaveProperty('error');
      if ('error' in result) return;

      if (result.packet.type !== 'status') return;
      expect(result.packet.deviceState).toBe('normal');
      expect(result.packet.uptime).toBe(3600);
      expect(result.packet.firmwareVersion).toBe('v2.1.0');
    });

    it('parses error status', () => {
      const raw = 'st=error,ec=42,up=120';
      const result = blePacketParser.parse(STATUS_CHAR, raw);

      expect(result).not.toHaveProperty('error');
      if ('error' in result) return;

      if (result.packet.type !== 'status') return;
      expect(result.packet.deviceState).toBe('error');
      expect(result.packet.errorCode).toBe(42);
    });
  });

  describe('navigation packets', () => {
    const NAV_CHAR = BLE_CHARACTERISTIC_UUIDS.NAVIGATION;

    it('parses valid navigation packet', () => {
      const raw = 'inst=Turn left,dir=left,d=20';
      const result = blePacketParser.parse(NAV_CHAR, raw);

      expect(result).not.toHaveProperty('error');
      if ('error' in result) return;

      if (result.packet.type !== 'navigation') return;
      expect(result.packet.instruction).toBe('Turn left');
      expect(result.packet.direction).toBe('left');
      expect(result.packet.distance).toBe(20);
    });

    it('parses arrived state', () => {
      const raw = 'inst=You have arrived,dir=arrived,d=0';
      const result = blePacketParser.parse(NAV_CHAR, raw);

      expect(result).not.toHaveProperty('error');
      if ('error' in result) return;

      if (result.packet.type !== 'navigation') return;
      expect(result.packet.direction).toBe('arrived');
    });
  });

  describe('error handling', () => {
    it('returns error for unknown characteristic', () => {
      const raw = 't=test';
      const result = blePacketParser.parse('unknown-uuid', raw);
      expect(result).toHaveProperty('error');
      if ('error' in result) {
        expect(result.error).toContain('No parser registered');
      }
    });

    it('tracks parse metrics', () => {
      blePacketParser.parse(BLE_CHARACTERISTIC_UUIDS.OBSTACLE, 't=person,d=150,dir=center,sev=caution');
      blePacketParser.parse(BLE_CHARACTERISTIC_UUIDS.BATTERY, 'lvl=50,chg=charging,v=3.7');
      blePacketParser.parse(BLE_CHARACTERISTIC_UUIDS.OBSTACLE, 't=car,d=abc,dir=left,sev=safe');

      const metrics = blePacketParser.getMetrics();
      expect(metrics.totalPackets).toBe(3);
      expect(metrics.totalParsed).toBe(2);
      expect(metrics.totalErrors).toBe(1);
    });
  });
});
