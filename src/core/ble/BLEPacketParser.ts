import { eventBus, EVENTS } from '@core/events/EventBus';
import { logger } from '@core/debug';
import type {
  BLEPacket,
  BLEPacketType,
  BLEPacketParsingResult,
  BLEPacketParseError,
  ObstaclePacket,
  BatteryPacket,
  SignalPacket,
  StatusPacket,
  NavigationPacket,
  BLEDirection,
  BLESeverity,
  BLEChargingStatus,
} from './types';
import { BLE_CHARACTERISTIC_UUIDS, BLE_LIMITS } from './constants';

type ParserFn = (fields: Record<string, string>) => BLEPacket | null;

const PARSERS: Record<string, ParserFn> = {
  [BLE_CHARACTERISTIC_UUIDS.OBSTACLE]: parseObstaclePacket,
  [BLE_CHARACTERISTIC_UUIDS.BATTERY]: parseBatteryPacket,
  [BLE_CHARACTERISTIC_UUIDS.SIGNAL]: parseSignalPacket,
  [BLE_CHARACTERISTIC_UUIDS.STATUS]: parseStatusPacket,
  [BLE_CHARACTERISTIC_UUIDS.NAVIGATION]: parseNavigationPacket,
};

function parseObstaclePacket(fields: Record<string, string>): ObstaclePacket | null {
  const distanceCm = parseInt(fields.d, 10);
  if (isNaN(distanceCm) || distanceCm < 0) return null;

  const direction = fields.dir as BLEDirection;
  if (!['left', 'center', 'right'].includes(direction)) return null;

  const severity = fields.sev as BLESeverity;
  if (!['safe', 'caution', 'danger'].includes(severity)) return null;

  return {
    type: 'obstacle',
    obstacleType: fields.t || 'unknown',
    distanceCm,
    direction,
    severity,
    voiceInstruction: fields.v || '',
    boundingBox: fields.bx && fields.by && fields.bw && fields.bh
      ? {
          x: parseInt(fields.bx, 10),
          y: parseInt(fields.by, 10),
          width: parseInt(fields.bw, 10),
          height: parseInt(fields.bh, 10),
        }
      : undefined,
    timestamp: fields.ts || new Date().toISOString(),
  };
}

function parseBatteryPacket(fields: Record<string, string>): BatteryPacket | null {
  const batteryLevel = parseInt(fields.lvl, 10);
  if (isNaN(batteryLevel) || batteryLevel < 0 || batteryLevel > 100) return null;

  const chargingStatus = fields.chg as BLEChargingStatus;
  if (!['charging', 'discharging', 'full'].includes(chargingStatus)) return null;

  return {
    type: 'battery',
    batteryLevel,
    chargingStatus,
    voltage: parseFloat(fields.v) || 0,
    temperature: parseFloat(fields.temp) || 0,
    timestamp: fields.ts || new Date().toISOString(),
  };
}

function parseSignalPacket(fields: Record<string, string>): SignalPacket | null {
  const rssi = parseInt(fields.r, 10);
  if (isNaN(rssi) || rssi > 0) return null;

  return {
    type: 'signal',
    rssi,
    txPower: parseInt(fields.tx, 10) || -127,
    noiseFloor: parseInt(fields.nf, 10) || -127,
    snr: parseFloat(fields.snr) || 0,
    timestamp: fields.ts || new Date().toISOString(),
  };
}

function parseStatusPacket(fields: Record<string, string>): StatusPacket | null {
  const deviceState = fields.st as StatusPacket['deviceState'];
  if (!['normal', 'low_power', 'error', 'firmware_update', 'pairing'].includes(deviceState)) {
    return null;
  }

  return {
    type: 'status',
    deviceState,
    errorCode: fields.ec ? parseInt(fields.ec, 10) : null,
    uptime: parseInt(fields.up, 10) || 0,
    firmwareVersion: fields.fw || 'unknown',
    hardwareVersion: fields.hw || 'unknown',
    timestamp: fields.ts || new Date().toISOString(),
  };
}

function parseNavigationPacket(fields: Record<string, string>): NavigationPacket | null {
  const direction = fields.dir as NavigationPacket['direction'];
  if (!['left', 'right', 'straight', 'uturn', 'arrived'].includes(direction)) return null;

  return {
    type: 'navigation',
    instruction: fields.inst || '',
    direction,
    distance: parseInt(fields.d, 10) || 0,
    nextInstruction: fields.next || null,
    timestamp: fields.ts || new Date().toISOString(),
  };
}

function parseKeyValuePairs(raw: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const parts = raw.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (key && value) {
      fields[key] = value;
    }
  }
  return fields;
}

export class BLEPacketParser {
  private totalPackets = 0;
  private totalParsed = 0;
  private totalErrors = 0;
  private totalParseTimeMs = 0;

  parse(
    characteristicUUID: string,
    rawValue: string,
  ): BLEPacketParsingResult | BLEPacketParseError {
    const startTime = performance.now();
    this.totalPackets++;

    const parser = PARSERS[characteristicUUID];
    if (!parser) {
      this.totalErrors++;
      const error: BLEPacketParseError = {
        type: 'parse_error',
        raw: rawValue,
        error: `No parser registered for characteristic: ${characteristicUUID}`,
        timestamp: new Date().toISOString(),
      };
      eventBus.publish(EVENTS.BLE_ERROR, { error: error.error }, 'high');
      return error;
    }

    const fields = parseKeyValuePairs(rawValue);
    const packet = parser(fields);

    const parseTime = performance.now() - startTime;
    this.totalParseTimeMs += parseTime;

    if (!packet) {
      this.totalErrors++;
      const error: BLEPacketParseError = {
        type: 'parse_error',
        raw: rawValue,
        error: `Failed to parse packet for characteristic: ${characteristicUUID}`,
        timestamp: new Date().toISOString(),
      };
      logger.warn(`[BLEPacketParser] Parse failed for ${characteristicUUID}: ${rawValue}`);
      eventBus.publish(EVENTS.BLE_ERROR, { error: error.error }, 'high');
      return error;
    }

    this.totalParsed++;
    const result: BLEPacketParsingResult = {
      packet,
      raw: rawValue,
      parsedAt: Date.now(),
    };

    logger.debug(
      `[BLEPacketParser] Parsed ${packet.type} packet in ${parseTime.toFixed(2)}ms:`,
      packet,
    );

    return result;
  }

  parseRaw(serviceUUID: string, characteristicUUID: string, base64Data: string): string {
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      return buffer.toString('utf-8');
    } catch {
      logger.warn(
        `[BLEPacketParser] Failed to decode base64 data for ${serviceUUID}/${characteristicUUID}`,
      );
      return base64Data;
    }
  }

  getMetrics() {
    return {
      totalPackets: this.totalPackets,
      totalParsed: this.totalParsed,
      totalErrors: this.totalErrors,
      averageParseTimeMs:
        this.totalPackets > 0 ? this.totalParseTimeMs / this.totalPackets : 0,
    };
  }

  reset(): void {
    this.totalPackets = 0;
    this.totalParsed = 0;
    this.totalErrors = 0;
    this.totalParseTimeMs = 0;
  }
}

export const blePacketParser = new BLEPacketParser();
