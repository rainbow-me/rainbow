describe('Basic test', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should have walled screen', async () => {
    await expect(element(by.label('Balances'))).toBeVisible();
  });
});
