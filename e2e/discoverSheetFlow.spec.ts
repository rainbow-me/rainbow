import { device } from 'detox';
import {
  tap,
  cleanApp,
  checkIfVisible,
  waitAndTap,
  checkIfExists,
  clearField,
  typeText,
  checkIfElementHasString,
  disableSynchronization,
  authenticatePin,
  enableSynchronization,
  swipe,
  checkIfNotVisible,
  delayTime,
} from './helpers';

const ios = device.getPlatform() === 'ios';
const android = device.getPlatform() === 'android';

describe('Discover Screen Flow', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
    await cleanApp();
  });
  afterAll(async () => {
    await device.clearKeychain();
  });
  it('Should show the welcome screen', async () => {
    await checkIfVisible('welcome-screen');
  });

  it('Should show the "Add Wallet Sheet" after tapping on "I already have a wallet"', async () => {
    await waitAndTap('already-have-wallet-button');
    await checkIfExists('add-wallet-sheet');
  });

  it('show the "Import Sheet" when tapping on "Restore with a recovery phrase or private key"', async () => {
    await waitAndTap('restore-with-key-button');
    await checkIfExists('import-sheet');
  });

  it('Should show the "Add wallet modal" after tapping import with a valid seed"', async () => {
    await clearField('import-sheet-input');
    await typeText('import-sheet-input', process.env.TEST_SEEDS, false);
    await checkIfElementHasString('import-sheet-button-label', 'Continue');
    await waitAndTap('import-sheet-button');
    await checkIfVisible('wallet-info-modal');
  });

  it('Should navigate to the Wallet screen after tapping on "Import Wallet"', async () => {
    await disableSynchronization();
    await waitAndTap('wallet-info-submit-button');
    if (android) {
      await checkIfVisible('pin-authentication-screen');
      // Set the pin
      await authenticatePin('1234');
      // Confirm it
      await authenticatePin('1234');
    }
    await checkIfVisible('wallet-screen', 40000);
    await enableSynchronization();
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
    await swipe('profile-screen', 'left', 'slow');
    await checkIfVisible('points-screen');
  });

  it('Should navigate back to Discover screen after swiping right twice', async () => {
    await swipe('points-screen', 'right', 'slow');
    await swipe('profile-screen', 'right', 'slow');
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
