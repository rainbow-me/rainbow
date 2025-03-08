import {
  beforeAllcleanApp,
  importWalletFlow,
  checkIfVisible,
  checkIfExists,
  checkIfExistsByText,
  swipe,
  afterAllcleanApp,
  tap,
  delayTime,
} from '../helpers';

const RAINBOW_TEST_WALLET = 'rainbowtestwallet.eth';

describe('Home Screen', () => {
  beforeAll(async () => {
    await beforeAllcleanApp({ anvil: false });
  });
  afterAll(async () => {
    await afterAllcleanApp({ anvil: false });
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
    await tap('swap-button');
    await delayTime('long');
    await checkIfExists('swap-screen');
    await swipe('swap-screen', 'down', 'fast');
  });

  it('tapping "Send" opens the send screen', async () => {
    await tap('send-button');
    await checkIfVisible('send-asset-form-field');
    await swipe('send-asset-form-field', 'down', 'fast');
  });

  it('tapping "Copy" shows copy address toast', async () => {
    await tap('receive-button');
    await checkIfVisible('address-copied-toast');
  });
});
