/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

const RAINBOW_TEST_WALLET = 'rainbowtestwallet.eth';

describe('Home Screen', () => {
  it('imports wallet', async () => {
    await Helpers.checkIfVisible('welcome-screen');
    await Helpers.waitAndTap('already-have-wallet-button');
    await Helpers.checkIfExists('add-wallet-sheet');
    await Helpers.waitAndTap('restore-with-key-button');
    await Helpers.checkIfExists('import-sheet');
    await Helpers.clearField('import-sheet-input');
    await Helpers.typeText('import-sheet-input', process.env.TEST_SEEDS, false);
    await Helpers.checkIfElementHasString(
      'import-sheet-button-label',
      'Continue'
    );
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.checkIfVisible('wallet-info-modal');
    await Helpers.disableSynchronization();
    await Helpers.waitAndTap('wallet-info-submit-button');
    if (device.getPlatform() === 'android') {
      await Helpers.checkIfVisible('pin-authentication-screen');
      // Set the pin
      await Helpers.authenticatePin('1234');
      // Confirm it
      await Helpers.authenticatePin('1234');
    }
    await Helpers.checkIfVisible('wallet-screen', 80000);
    await Helpers.enableSynchronization();
  });

  it('show profile header', async () => {
    await Helpers.checkIfVisible('avatar-button');
    await Helpers.checkIfExists(`profile-name-${RAINBOW_TEST_WALLET}`);
    await Helpers.checkIfExistsByText(RAINBOW_TEST_WALLET);
    await Helpers.checkIfVisible('balance-text');
    await Helpers.checkIfVisible('buy-button');
    await Helpers.checkIfVisible('swap-button');
    await Helpers.checkIfVisible('send-button');
    await Helpers.checkIfVisible('more-button');
  });

  it('sticky header shows when scrolling down', async () => {
    await Helpers.swipe('wallet-screen', 'up', 'slow', 0.4);
    await Helpers.checkIfVisible('profile-sticky-header');
    await Helpers.checkIfExistsByText(RAINBOW_TEST_WALLET);
    await Helpers.swipe('wallet-screen', 'down', 'slow', 0.4);
  });

  it('tapping "Swap" opens the swap screen', async () => {
    await Helpers.waitAndTap('swap-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.swipe('currency-select-list', 'down');
  });

  it('tapping "Send" opens the send screen', async () => {
    await Helpers.waitAndTap('send-button');
    await Helpers.checkIfVisible('send-asset-form-field');
    await Helpers.swipe('send-asset-form-field', 'down');
  });

  it('tapping "More" opens action sheet', async () => {
    await Helpers.waitAndTap('more-button');
    await Helpers.checkIfExistsByText('Copy Address');
    await Helpers.checkIfExistsByText('My QR Code');
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
  });
});
