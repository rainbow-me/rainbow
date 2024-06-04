import { device } from 'detox';
import {
  importWalletFlow,
  sendETHtoTestWallet,
  waitAndTap,
  checkIfVisible,
  beforeAllcleanApp,
  afterAllcleanApp,
  checkIfExistsByText,
  fetchElementAttributes,
  swipe,
  typeText,
  delayTime,
  tapByText,
  tap,
  tapAtPoint,
  disableSynchronization,
  enableSynchronization,
} from './helpers';

import { expect } from '@jest/globals';
import { delay } from 'lodash';

const ios = device.getPlatform() === 'ios';
const android = device.getPlatform() === 'android';

describe('Swap Sheet Interaction Flow', () => {
  beforeAll(async () => {
    await beforeAllcleanApp({ hardhat: true });
  });
  afterAll(async () => {
    await afterAllcleanApp({ hardhat: true });
  });

  // works 100% of the time
  it('Import a wallet and go to welcome', async () => {
    await importWalletFlow({ seedPhrase: true });
  });

  // works 100% of the time
  it('Should send ETH to test wallet', async () => {
    await sendETHtoTestWallet();
  });

  // works 100% of the time
  it('Should show Hardhat Toast after pressing Connect To Hardhat', async () => {
    await tap('dev-button-hardhat');
    await checkIfVisible('testnet-toast-Hardhat');
    await checkIfExistsByText('Ether');

    // validate it has funds to swap w/
    const attributes = await fetchElementAttributes('fast-coin-info');
    expect(attributes.label).toContain('Ether' && '20');
  });

  // THIS IS WHERE ISSUES ARISE

  // TODO: fix default currency selection.
  // so the wallet i am using has DAI as it's highest value-balance currency
  // so when it goes to the swap screen it is still selecting DAI
  // there is no DAI in this wallet on hardhat chain for this wallet

  // TODO: use testId to select options
  // these are not working at the moment. Logging is enabled for the testIDs rn
  // await tap('token-to-buy-ethereum-1');
  // await tap('token-to-sell-0x6b175474e89094c44da98b954eedeac495271d0f_1');

  it('Should go to swap and open review sheet on mainnet swap 1', async () => {
    await disableSynchronization();
    await tap('swap-button');

    // times out without desync
    await disableSynchronization();

    // this works fine, but isn't great. the asset list order changes sometimes
    await tapAtPoint('swap-screen', { x: 200, y: 450 });

    // the swap screen sometimes freezes on fetching ??? rerun the tests multiple times and watch
    await tapByText('Review' || 'Fetching'); // await tap('swap-action-button');

    // this works fine as well (when desynced). prefer testID tho.
    await tapByText('Tap to Swap');
    await enableSynchronization();
    // tests time out again as soon as sync is reenabled.

    //
    //
    //

    // works
    // await tapByText('Find a token to buy');

    // broke
    // await typeText('token-to-buy-input', 'Ethereum\n');

    // broke
    // await tap('token-to-buy-ethereum-1')
    // await getElementAttributes('token-to-buy-ethereum-1');
  });
});
