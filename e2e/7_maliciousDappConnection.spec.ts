/* eslint-disable @typescript-eslint/no-explicit-any */
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
  tapByText,
  tapAtPoint,
} from './helpers';

describe('Check malicious dapp warning', () => {
  beforeAll(async () => {
    await beforeAllcleanApp({ hardhat: false });
  });

  afterAll(async () => {
    await afterAllcleanApp({ hardhat: false });
  });

  it('Should be able to watch a wallet and load the wallet screen', async () => {
    await importWalletFlow();
  });

  it('Should be able to navigate to the app browser', async () => {
    await swipe('wallet-screen', 'left', 'fast');
    await swipe('discover-sheet', 'left', 'fast');
    await checkIfVisible('browser-screen');
  });

  it('Should be able to type on search input and go to malicious dapp', async () => {
    await waitAndTap('browser-search-input');
    await checkIfExistsByText('Find apps and more');
    await typeText('browser-search-input', 'https://test-dap-welps.vercel.app/', true, false, true);
  });

  it('Should attempt to connect to in browser dapp', async () => {
    console.log('tapping! 250 200');
    await delayTime('medium');
    await tapAtPoint('browser-screen', { x: 250, y: 200 });
    await delayTime('medium');
    // 'browser-screen'
    // 'in-app-dapp-browser'
  });
});
