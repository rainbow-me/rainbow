/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

const RAINBOW_TEST_WALLET = 'rainbowtestwallet.eth';

describe('Home Screen', () => {
  afterAll(async () => {
    await device.clearKeychain();
  });

  it('imports wallet', async () => {
    await Helpers.importWalletFlow();
  });

  it('show profile header', async () => {
    await Helpers.checkIfVisible('avatar-button');
    await Helpers.checkIfExists(`profile-name-${RAINBOW_TEST_WALLET}`);
    await Helpers.checkIfExistsByText(RAINBOW_TEST_WALLET);
    await Helpers.checkIfVisible('balance-text');
    await Helpers.checkIfVisible('buy-button');
    await Helpers.checkIfVisible('swap-button');
    await Helpers.checkIfVisible('send-button');
    await Helpers.checkIfVisible('receive-button');
  });

  it('sticky header shows when scrolling down', async () => {
    await Helpers.swipe('wallet-screen', 'up', 'slow', 0.4);
    await Helpers.checkIfExistsByText(RAINBOW_TEST_WALLET);
    await Helpers.swipe('wallet-screen', 'down', 'slow', 0.4);
  });

  it('tapping "Swap" opens the swap screen', async () => {
    await Helpers.waitAndTap('swap-button');
    await Helpers.checkIfExists('exchange-modal-input-selection-button');
    await Helpers.swipe('exchange-modal-notch', 'down', 'slow');
  });

  it('tapping "Send" opens the send screen', async () => {
    await Helpers.waitAndTap('send-button');
    await Helpers.checkIfVisible('send-asset-form-field');
    await Helpers.swipe('send-asset-form-field', 'down');
  });

  it('tapping "Copy" shows copy address toast', async () => {
    await Helpers.waitAndTap('receive-button');
    await Helpers.checkIfVisible('address-copied-toast');
  });
});
