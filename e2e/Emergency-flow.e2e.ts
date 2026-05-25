describe('Emergency Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should display emergency button on home', async () => {
    await expect(element(by.id('emergency-fab'))).toBeVisible();
  });

  it('should show countdown on emergency trigger', async () => {
    await element(by.id('emergency-fab')).tap();
    await expect(element(by.id('emergency-countdown'))).toBeVisible();
  });

  it('should cancel emergency on cancel tap', async () => {
    await element(by.id('cancel-emergency')).tap();
    await expect(element(by.id('emergency-fab'))).toBeVisible();
  });
});
