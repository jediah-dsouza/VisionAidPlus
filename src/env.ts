interface Environment {
  APP_NAME: string;
  APP_VERSION: string;
  API_BASE_URL: string;
  API_TIMEOUT: number;
  ENVIRONMENT: 'development' | 'staging' | 'production';
  DEBUG_MODE: boolean;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  BLE_SCAN_TIMEOUT: number;
  BLE_RECONNECT_DELAY: number;
  AI_MODEL_PATH: string;
  TTS_DEFAULT_LANGUAGE: string;
  TTS_SPEECH_RATE: number;
  EMERGENCY_COUNTDOWN_SECONDS: number;
  CACHE_EXPIRY_MS: number;
  ENABLE_ANALYTICS: boolean;
  MOCK_BLE_DEVICE: boolean;
  MOCK_AI_DETECTION: boolean;
}

const getEnvValue = <T>(key: string, defaultValue: T): T => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
};

const env: Environment = {
  APP_NAME: getEnvValue('APP_NAME', 'VisionAidPlus'),
  APP_VERSION: getEnvValue('APP_VERSION', '1.0.0'),
  API_BASE_URL: getEnvValue('API_BASE_URL', 'https://api.visionaid.example.com'),
  API_TIMEOUT: getEnvValue('API_TIMEOUT', 30000),
  ENVIRONMENT: getEnvValue('ENVIRONMENT', 'development'),
  DEBUG_MODE: getEnvValue('DEBUG_MODE', __DEV__),
  LOG_LEVEL: getEnvValue('LOG_LEVEL', 'debug'),
  BLE_SCAN_TIMEOUT: getEnvValue('BLE_SCAN_TIMEOUT', 10000),
  BLE_RECONNECT_DELAY: getEnvValue('BLE_RECONNECT_DELAY', 3000),
  AI_MODEL_PATH: getEnvValue('AI_MODEL_PATH', '/models/yolo.pt'),
  TTS_DEFAULT_LANGUAGE: getEnvValue('TTS_DEFAULT_LANGUAGE', 'en-US'),
  TTS_SPEECH_RATE: getEnvValue('TTS_SPEECH_RATE', 0.5),
  EMERGENCY_COUNTDOWN_SECONDS: getEnvValue('EMERGENCY_COUNTDOWN_SECONDS', 5),
  CACHE_EXPIRY_MS: getEnvValue('CACHE_EXPIRY_MS', 24 * 60 * 60 * 1000),
  ENABLE_ANALYTICS: getEnvValue('ENABLE_ANALYTICS', false),
  MOCK_BLE_DEVICE: getEnvValue('MOCK_BLE_DEVICE', true),
  MOCK_AI_DETECTION: getEnvValue('MOCK_AI_DETECTION', true),
};

export default env;
export type { Environment };
export const isProduction = env.ENVIRONMENT === 'production';
export const isDevelopment = env.ENVIRONMENT === 'development';
export const isStaging = env.ENVIRONMENT === 'staging';
