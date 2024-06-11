import { device } from 'detox';
import {
  tap,
  beforeAllcleanApp,
  checkIfVisible,
  waitAndTap,
  checkIfExists,
  typeText,
  swipe,
  checkIfNotVisible,
  delayTime,
  importWalletFlow,
  afterAllcleanApp,
} from './helpers';

const ios = device.getPlatform() === 'ios';

describe('Discover Screen Flow', () => {
  beforeAll(async () => {
    await beforeAllcleanApp({ hardhat: false });
  });
  afterAll(async () => {
    await afterAllcleanApp({ hardhat: false });
  });
  it('Should import wallet and go to wallet screen', async () => {
    await importWalletFlow();
  });

  it('Should navigate to Discover screen after swiping left', async () => {
    await swipe('wallet-screen', 'left', 'slow');
    await checkIfVisible('discover-header');
  });

  it('Should navigate to the Profile screen after swiping left', async () => {
    await waitAndTap('tab-bar-icon-ProfileScreen');
    await checkIfVisible('profile-screen');
  });

  it('Should navigate to the Points screen after swiping left', async () => {
    await swipe('profile-screen', 'left', 'fast');
    await checkIfVisible('points-screen');
  });

  it('Should navigate back to Discover screen after tapping Discover icon', async () => {
    await waitAndTap('tab-bar-icon-DiscoverScreen');
    await checkIfVisible('discover-header');
  });

  // TODO: doesn't work for unknown reason on Android.
  if (ios) {
    it('Should see the gas card', async () => {
      await checkIfVisible('gas-button');
      await tap('gas-button');
    });
  }

  it('Should open Discover Search on pressing search input', async () => {
    await swipe('discover-header', 'up');
    await swipe('discover-home', 'down');
    await waitAndTap('discover-search-input');
    await checkIfVisible('done-button');
  });

  it('Should search and open expanded state for SOCKS', async () => {
    await typeText('discover-search-input', 'SOCKS\n', true);
    await delayTime('very-long');
    await checkIfVisible('discover-currency-select-list-exchange-coin-row-SOCKS-mainnet');
    await checkIfNotVisible('discover-currency-select-list-exchange-coin-row-ETH-mainnet');
    await waitAndTap('discover-currency-select-list-exchange-coin-row-SOCKS-mainnet');
    await checkIfVisible('chart-header-Unisocks');
  });

  it('Should close expanded state and return to search', async () => {
    if (ios) {
      // RNBW-4035
      await swipe('expanded-state-header', 'down');
    }
    await checkIfNotVisible('discover-currency-select-list-exchange-coin-row-ETH-mainnet');
  });

  it('Should display search results in the correct order', async () => {
    await waitAndTap('discover-search-clear-input');
    await typeText('discover-search-input', 'bitcoin', true);
    await delayTime('long');
    await checkIfVisible('favorites-0');
    await checkIfVisible('verified-1');
    await checkIfExists('profiles-2');
    await checkIfExists('highLiquidity-3');
  });

  it.skip('Should search and open Profile Sheet for rainbowwallet.eth', async () => {
    await waitAndTap('discover-search-clear-input');
    await typeText('discover-search-input', 'rainbowwallet.eth\n', true);
    await checkIfVisible('discover-currency-select-list-contact-row-rainbowwallet.eth');
    await checkIfNotVisible('discover-currency-select-list-exchange-coin-row-ETH-mainnet');
    await waitAndTap('discover-currency-select-list-contact-row-rainbowwallet.eth');
    await checkIfVisible('profile-sheet');
  });

  it.skip('Should watch wallet from Profile sheet', async () => {
    await waitAndTap('profile-sheet-watch-button');
  });

  it.skip('Should close profile and return to Search on swiping down', async () => {
    await swipe('profile-sheet', 'down');
    await waitAndTap('discover-search-clear-input');
    await checkIfVisible('discover-currency-select-list-exchange-coin-row-ETH-mainnet');
  });

  it('Should close search and return to Discover Home on pressing Done', async () => {
    await waitAndTap('done-button');
  });
});
