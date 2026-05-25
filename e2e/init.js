const detox = require('detox');
const adapter = require('detox/runners/jest/adapter');
const specReporter = require('detox/runners/jest/specReporter');

beforeAll(async () => {
  await detox.init();
  await device.launchApp({
    newInstance: true,
    permissions: { location: 'always', bluetooth: 'always' },
  });
}, 300000);

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
}, 300000);

jasmine.getEnv().addReporter(specReporter);
