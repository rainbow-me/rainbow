/* eslint-disable no-undef */
describe('Welcome Screen', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show the create wallet screen', async () => {
    await expect(element(by.id('create-wallet-button'))).toBeVisible();
  });
});
