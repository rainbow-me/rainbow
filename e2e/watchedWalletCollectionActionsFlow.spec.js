/* eslint-disable no-undef */
import * as Helpers from './helpers';

describe('Watched showcase and hidden actions flow', () => {
  it('hides actions for watched wallets', async () => {
    // Watch a wallet.
    await Helpers.waitAndTap('already-have-wallet-button');
    await Helpers.waitAndTap('watch-address-button');
    await Helpers.clearField('import-sheet-input');
    await Helpers.typeText(
      'import-sheet-input',
      'rainbowtestwallet.eth',
      false
    );
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.waitAndTap('wallet-info-submit-button');
    if (device.getPlatform() === 'android') {
      await Helpers.authenticatePin('1234');
      await Helpers.authenticatePin('1234');
    }
    await Helpers.enableSynchronization();

    await Helpers.tapByText('OK');
    // Tap an NFT.
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.tap('token-family-header-ENS');
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.waitAndTap('wrapped-nft-rainbowtestwallet.eth');

    // Check that showcase and hide buttons are hidden.
    await expect(element(by.label('Showcase')).atIndex(0)).toNotExist();
    await Helpers.waitAndTap('unique-token-expanded-state-context-menu-button');
    await expect(element(by.label('Unhide')).atIndex(0)).toNotExist();
  });

  afterAll(async () => {
    await device.clearKeychain();
  });
});
