export { bleManager, BLEManager } from './BLEManager';
export type { BLEManagerConfig, BLEManagerState } from './BLEManager';

export { bleScanner, BLEScanner } from './BLEScanner';
export type { ScanListener } from './BLEScanner';

export { bleConnectionManager, BLEConnectionManager } from './BLEConnectionManager';

export { bleSubscriptionManager, BLESubscriptionManager } from './BLESubscriptionManager';
export type { CharacteristicSubscription } from './BLESubscriptionManager';

export { bleReconnectionManager, BLEReconnectionManager } from './BLEReconnectionManager';
export type { ReconnectHandler, ReconnectionState } from './BLEReconnectionManager';

export { blePacketParser, BLEPacketParser } from './BLEPacketParser';

export {
  BLE_SERVICE_UUIDS,
  BLE_CHARACTERISTIC_UUIDS,
  BLE_LIMITS,
  BLE_SCAN_MODES,
  BLE_ERROR_CODES,
  BLE_RECONNECT_BACKOFFS,
} from './constants';

export type {
  BLEConnectionState,
  BLEDevice,
  BLEDeviceDiscovery,
  BLEConnectionConfig,
  BLEConnectionInfo,
  ObstaclePacket,
  BatteryPacket,
  SignalPacket,
  StatusPacket,
  NavigationPacket,
  BLEPacket,
  BLEPacketType,
  BLEPacketParsingResult,
  BLEPacketParseError,
  BLEScanConfig,
  BLESubscriptionInfo,
  BLEBackgroundConfig,
  BLEMetrics,
  BLEEventMap,
  BLEEventHandler,
  BLEDirection,
  BLESeverity,
  BLEChargingStatus,
} from './types';
