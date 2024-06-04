import {
  beforeAllcleanApp,
  afterAllcleanApp,
  importWalletFlow,
  waitAndTap,
  swipe,
  checkIfVisible,
  checkIfExistsByText,
  typeText,
  delayTime,
  tapAtPoint,
  checkIfExists,
} from './helpers';
import { WALLET_VARS } from './testVariables';

describe('Check malicious dapp warning', () => {
  beforeAll(async () => {
    await beforeAllcleanApp({ hardhat: false });
  });

  afterAll(async () => {
    await afterAllcleanApp({ hardhat: false });
  });

  it('Should be able to watch a wallet and load the wallet screen', async () => {
    await importWalletFlow(WALLET_VARS.SEED_WALLET.PK);
  });

  it('Should be able to navigate to the dapp browser', async () => {
    await swipe('wallet-screen', 'left', 'fast');
    await swipe('discover-sheet', 'left', 'fast');
    await checkIfVisible('browser-screen');
  });

  it('Should be able to type on search input and go to malicious dapp', async () => {
    await waitAndTap('browser-search-input');
    await checkIfExistsByText('Find apps and more');
    await typeText('browser-search-input', 'https://test-dap-welps.vercel.app/', true, false, true);
    // Waiting for webpage to load
    await delayTime('long');
  });

  it('Should attempt to connect to in browser dapp', async () => {
    // Detox can't query elements within a WebView within our app
    // Using tapAtPoint() to tap coordinates is a workaround for now

    // Tapping connect button
    await tapAtPoint('browser-screen', { x: 275, y: 80 });
    // Waiting for rainbowkit sheet to load / animate in
    await delayTime('medium');
    // Tapping Rainbow button
    await tapAtPoint('browser-screen', { x: 50, y: 325 });

    await checkIfExists('malicious-dapp-warning');
  });
});
