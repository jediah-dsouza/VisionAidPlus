export type BLEConnectionState =
  | 'idle'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

export type BLESeverity = 'safe' | 'caution' | 'danger';
export type BLEDirection = 'left' | 'center' | 'right';
export type BLEChargingStatus = 'charging' | 'discharging' | 'full';

export interface BLEDevice {
  id: string;
  name: string;
  rssi: number;
  isConnected: boolean;
  batteryLevel?: number;
  manufacturerData?: string;
  serviceUUIDs?: string[];
  txPowerLevel?: number;
  lastSeen: number;
}

export interface BLEDeviceDiscovery {
  device: BLEDevice;
  advertisementData: {
    localName?: string;
    manufacturerData?: string;
    serviceUUIDs?: string[];
    txPowerLevel?: number;
    rssi: number;
    isConnectable: boolean;
  };
  timestamp: number;
}

export interface BLEConnectionConfig {
  deviceId: string;
  deviceName: string;
  requestMTU: number;
  timeout: number;
  autoReconnect: boolean;
}

export interface BLEConnectionInfo {
  state: BLEConnectionState;
  deviceId: string | null;
  deviceName: string | null;
  mtu: number;
  rssi: number;
  batteryLevel: number | null;
  chargingStatus: BLEChargingStatus | null;
  connectedAt: number | null;
  disconnectedAt: number | null;
  reconnectAttempts: number;
  lastError: string | null;
}

export interface ObstaclePacket {
  type: 'obstacle';
  obstacleType: string;
  distanceCm: number;
  direction: BLEDirection;
  severity: BLESeverity;
  voiceInstruction: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: string;
}

export interface BatteryPacket {
  type: 'battery';
  batteryLevel: number;
  chargingStatus: BLEChargingStatus;
  voltage: number;
  temperature: number;
  timestamp: string;
}

export interface SignalPacket {
  type: 'signal';
  rssi: number;
  txPower: number;
  noiseFloor: number;
  snr: number;
  timestamp: string;
}

export interface StatusPacket {
  type: 'status';
  deviceState: 'normal' | 'low_power' | 'error' | 'firmware_update' | 'pairing';
  errorCode: number | null;
  uptime: number;
  firmwareVersion: string;
  hardwareVersion: string;
  timestamp: string;
}

export interface NavigationPacket {
  type: 'navigation';
  instruction: string;
  direction: 'left' | 'right' | 'straight' | 'uturn' | 'arrived';
  distance: number;
  nextInstruction: string | null;
  timestamp: string;
}

export type BLEPacket =
  | ObstaclePacket
  | BatteryPacket
  | SignalPacket
  | StatusPacket
  | NavigationPacket;

export type BLEPacketType = BLEPacket['type'];

export interface BLEPacketParsingResult {
  packet: BLEPacket;
  raw: string;
  parsedAt: number;
}

export interface BLEPacketParseError {
  type: 'parse_error';
  raw: string;
  error: string;
  timestamp: string;
}

export interface BLEScanConfig {
  scanMode: 'lowPower' | 'balanced' | 'lowLatency';
  reportDelay: number;
  filters: Array<{
    serviceUUID?: string;
    deviceName?: string;
    rssiThreshold?: number;
  }>;
  duration: number;
}

export const DEFAULT_SCAN_CONFIG: BLEScanConfig = {
  scanMode: 'balanced',
  reportDelay: 0,
  filters: [],
  duration: 10000,
};

export interface BLESubscriptionInfo {
  characteristicUUID: string;
  serviceUUID: string;
  packetType: BLEPacketType;
  isNotifying: boolean;
  subscribedAt: number;
  lastNotificationAt: number | null;
  notificationCount: number;
}

export interface BLEBackgroundConfig {
  enabled: boolean;
  scanOnBackground: boolean;
  keepConnection: boolean;
  subscribeOnForeground: boolean;
}

export const DEFAULT_BACKGROUND_CONFIG: BLEBackgroundConfig = {
  enabled: false,
  scanOnBackground: false,
  keepConnection: true,
  subscribeOnForeground: false,
};

export interface BLEMetrics {
  totalPacketsReceived: number;
  totalPacketsParsed: number;
  totalParseErrors: number;
  averageParseTimeMs: number;
  totalReconnections: number;
  totalDisconnections: number;
  uptime: number;
  lastPacketAt: number | null;
}

export interface BLEEventMap {
  'ble:deviceDiscovered': BLEDeviceDiscovery;
  'ble:scanStarted': { mode: string };
  'ble:scanStopped': { reason: string };
  'ble:connecting': { deviceId: string };
  'ble:connected': BLEConnectionInfo;
  'ble:disconnecting': { deviceId: string; reason: string };
  'ble:disconnected': { deviceId: string; reason: string };
  'ble:reconnecting': { deviceId: string; attempt: number; maxAttempts: number };
  'ble:reconnectFailed': { deviceId: string; attempts: number };
  'ble:error': { deviceId?: string; error: string; code?: number };
  'ble:packetReceived': BLEPacketParsingResult;
  'ble:parseError': BLEPacketParseError;
  'ble:batteryUpdated': BatteryPacket;
  'ble:signalUpdated': SignalPacket;
  'ble:statusUpdated': StatusPacket;
  'ble:mtuChanged': { mtu: number };
  'ble:rssiUpdated': { rssi: number };
}

export type BLEEventHandler<E extends keyof BLEEventMap> = (payload: BLEEventMap[E]) => void;
