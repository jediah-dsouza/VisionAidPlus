describe('BLE Device Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should open device screen', async () => {
    await element(by.id('devices-tab')).tap();
    await expect(element(by.id('device-screen'))).toBeVisible();
  });

  it('should start scanning for devices', async () => {
    await element(by.id('scan-button')).tap();
    await expect(element(by.id('scanning-indicator'))).toBeVisible();
  });

  it('should discover and connect to device', async () => {
    await element(by.id('device-card-0')).tap();
    await expect(element(by.id('connection-status'))).toBeVisible();
    await expect(element(by.text('Connected'))).toBeVisible();
  });
});
