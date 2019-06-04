describe('Basic test', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should have walled screen', async () => {
    await expect(element(by.label('Balances'))).toBeVisible();
  });

  it('should navigate without imported wallet', async () => {
    const importButton = element(by.label('Import Wallet')).atIndex(1)
    await expect(importButton).toBeVisible();
    await element(by.label('Balances')).swipe('left', 'fast', 0.5);
    await expect(element(by.label('Scan to send'))).toBeVisible();
    await element(by.label('Scan to send')).swipe('right', 'fast', 0.5);
    await expect(element(by.label('Import Wallet')).atIndex(1)).toBeVisible();
    await element(by.label('Balances')).swipe('right', 'fast', 0.5);
    await expect(element(by.label('Copy'))).toBeVisible();
    await expect(element(by.id('Gear icon'))).toBeVisible();
    await element(by.id('Gear icon')).tap();
    await element(by.label('Network')).tap();
    await element(by.label('Settings')).tap();
    await element(by.label('Done')).tap();
    await expect(element(by.label('Receive'))).toBeVisible();
    await element(by.label('Receive')).swipe('left', 'fast', 0.5);
    await expect(element(by.label('Balances'))).toBeVisible();
    await element(by.id('goToProfile')).tap();
    await expect(element(by.label('Copy'))).toBeVisible();
    await element(by.id('goToBalancesFromProfile')).tap();
    await expect(element(by.label('Balances'))).toBeVisible();
    await element(by.id('goToCamera')).tap();
    await expect(element(by.label('Scan to send'))).toBeVisible();
    await element(by.id('goToBalancesFromScanner')).tap();
    await expect(element(by.label('Balances'))).toBeVisible();

  });
});
