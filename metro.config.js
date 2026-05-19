const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const projectRoot = __dirname;

const defaultConfig = getDefaultConfig(projectRoot);

const config = {
  projectRoot,
  watchFolders: [path.resolve(projectRoot, 'src')],
  resolver: {
    alias: {
      '@': path.resolve(projectRoot, 'src'),
      '@app': path.resolve(projectRoot, 'src/app'),
      '@core': path.resolve(projectRoot, 'src/core'),
      '@features': path.resolve(projectRoot, 'src/features'),
      '@shared': path.resolve(projectRoot, 'src/shared'),
    },
    blockList: [/node_modules\/.*\/node_modules\/react-native\/.*/],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(defaultConfig, config);
