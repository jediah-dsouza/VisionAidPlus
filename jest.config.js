module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/__tests__/infrastructure/mocks/',
    '/__tests__/infrastructure/helpers/',
    '/__tests__/infrastructure/MockRegistry\\.ts$',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-redux|@reduxjs/toolkit|immer|@react-native-async-storage|react-native-safe-area-context|react-native-screens|react-native-gesture-handler|react-native-reanimated|react-native-vector-icons|@react-native-community|@react-native-camera-roll|camera-roll)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  testTimeout: 30000,
};
