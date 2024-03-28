import {
  beforeAllcleanApp,
  importWalletFlow,
  checkIfVisible,
  checkIfExists,
  checkIfExistsByText,
  swipe,
  waitAndTap,
  afterAllcleanApp,
} from './helpers';

const RAINBOW_TEST_WALLET = 'rainbowtestwallet.eth';

describe('Home Screen', () => {
  beforeAll(async () => {
    await beforeAllcleanApp({ hardhat: false });
  });
  afterAll(async () => {
    await afterAllcleanApp({ hardhat: false });
  });

  it('imports wallet', async () => {
    await importWalletFlow();
  });

  it('show profile header', async () => {
    await checkIfVisible('avatar-button');
    await checkIfExists(`profile-name-${RAINBOW_TEST_WALLET}`);
    await checkIfExistsByText(RAINBOW_TEST_WALLET);
    await checkIfVisible('balance-text');
    await checkIfVisible('buy-button');
    await checkIfVisible('swap-button');
    await checkIfVisible('send-button');
    await checkIfVisible('receive-button');
  });

  it('sticky header shows when scrolling down', async () => {
    await swipe('wallet-screen', 'up', 'slow', 0.4);
    await checkIfExistsByText(RAINBOW_TEST_WALLET);
    await swipe('wallet-screen', 'down', 'slow', 0.4);
  });

  it('tapping "Swap" opens the swap screen', async () => {
    await waitAndTap('swap-button');
    await checkIfExists('exchange-modal-input-selection-button');
    await swipe('exchange-modal-notch', 'down', 'slow');
  });

  it('tapping "Send" opens the send screen', async () => {
    await waitAndTap('send-button');
    await checkIfVisible('send-asset-form-field');
    await swipe('send-asset-form-field', 'down');
  });

  it('tapping "Copy" shows copy address toast', async () => {
    await waitAndTap('receive-button');
    await checkIfVisible('address-copied-toast');
  });
});
