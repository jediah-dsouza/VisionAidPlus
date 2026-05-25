describe('App Launch', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should launch app successfully', async () => {
    await expect(element(by.id('app-root'))).toBeVisible();
  });

  it('should show welcome elements', async () => {
    await expect(element(by.id('home-screen'))).toBeVisible();
    await expect(element(by.id('scan-button'))).toBeVisible();
  });

  it('should display device status section', async () => {
    await expect(element(by.id('device-status'))).toBeVisible();
  });
});
