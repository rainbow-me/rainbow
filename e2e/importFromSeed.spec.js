/* eslint-disable no-undef */
describe('Import From Seed', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show the import wallet screen', async () => {
    await expect(element(by.id('goToProfile'))).toBeVisible();
  });
});
