/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

const ios = device.getPlatform() === 'ios';
const android = device.getPlatform() === 'android';

describe('Discover Screen Flow', () => {
  it('Should show the welcome screen', async () => {
    await Helpers.checkIfVisible('welcome-screen');
  });

  it('Should show the "Add Wallet Sheet" after tapping on "I already have a wallet"', async () => {
    await Helpers.waitAndTap('already-have-wallet-button');
    await Helpers.checkIfExists('add-wallet-sheet');
  });

  it('show the "Import Sheet" when tapping on "Restore with a recovery phrase or private key"', async () => {
    await Helpers.waitAndTap('restore-with-key-button');
    await Helpers.checkIfExists('import-sheet');
  });

  it('Should show the "Add wallet modal" after tapping import with a valid seed"', async () => {
    await Helpers.clearField('import-sheet-input');
    await Helpers.typeText('import-sheet-input', process.env.TEST_SEEDS, false);
    await Helpers.checkIfElementHasString('import-sheet-button-label', 'Continue');
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.checkIfVisible('wallet-info-modal');
  });

  it('Should navigate to the Wallet screen after tapping on "Import Wallet"', async () => {
    await Helpers.disableSynchronization();
    await Helpers.waitAndTap('wallet-info-submit-button');
    if (android) {
      await Helpers.checkIfVisible('pin-authentication-screen');
      // Set the pin
      await Helpers.authenticatePin('1234');
      // Confirm it
      await Helpers.authenticatePin('1234');
    }
    await Helpers.checkIfVisible('wallet-screen', 40000);
    await Helpers.enableSynchronization();
  });

  it('Should navigate to Discover screen after swiping left', async () => {
    await Helpers.swipe('wallet-screen', 'left', 'slow');
    await Helpers.checkIfVisible('discover-header');
  });

  it('Should navigate to the Profile screen after swiping left', async () => {
    await Helpers.waitAndTap('tab-bar-icon-ProfileScreen');
    await Helpers.checkIfVisible('profile-screen');
  });

  it('Should navigate to the Points screen after swiping left', async () => {
    await Helpers.swipe('profile-screen', 'left', 'slow');
    await Helpers.checkIfVisible('points-screen');
  });

  it('Should navigate back to Discover screen after swiping right twice', async () => {
    await Helpers.swipe('points-screen', 'right', 'slow');
    await Helpers.swipe('profile-screen', 'right', 'slow');
    await Helpers.checkIfVisible('discover-header');
  });

  // TODO: doesn't work for unknown reason on Android.
  if (ios) {
    it('Should see the gas card', async () => {
      await Helpers.checkIfVisible('gas-button');
      await Helpers.tap('gas-button');
    });
  }

  it('Should open Discover Search on pressing search input', async () => {
    await Helpers.swipe('discover-header', 'up');
    await Helpers.swipe('discover-home', 'down');
    await Helpers.waitAndTap('discover-search-input');
    await Helpers.checkIfVisible('done-button');
  });

  it('Should search and open expanded state for SOCKS', async () => {
    await Helpers.typeText('discover-search-input', 'SOCKS\n', true);
    await Helpers.checkIfVisible('discover-currency-select-list-exchange-coin-row-SOCKS-mainnet');
    await Helpers.checkIfNotVisible('discover-currency-select-list-exchange-coin-row-ETH-mainnet');
    await Helpers.waitAndTap('discover-currency-select-list-exchange-coin-row-SOCKS-mainnet');
    await Helpers.checkIfVisible('chart-header-Unisocks');
  });

  it('Should close expanded state and return to search', async () => {
    if (ios) {
      // RNBW-4035
      await Helpers.swipe('expanded-state-header', 'down');
    }
    await Helpers.checkIfNotVisible('discover-currency-select-list-exchange-coin-row-ETH-mainnet');
  });

  it('Should display search results in the correct order', async () => {
    await Helpers.waitAndTap('discover-search-clear-input');
    await Helpers.typeText('discover-search-input', 'bitcoin', true);
    await Helpers.checkIfVisible('favorites-0');
    await Helpers.checkIfVisible('verified-1');
    await Helpers.checkIfExists('profiles-2');
    await Helpers.checkIfExists('highLiquidity-3');
  });

  it.skip('Should search and open Profile Sheet for rainbowwallet.eth', async () => {
    await Helpers.waitAndTap('discover-search-clear-input');
    await Helpers.typeText('discover-search-input', 'rainbowwallet.eth\n', true);
    await Helpers.checkIfVisible('discover-currency-select-list-contact-row-rainbowwallet.eth');
    await Helpers.checkIfNotVisible('discover-currency-select-list-exchange-coin-row-ETH-mainnet');
    await Helpers.waitAndTap('discover-currency-select-list-contact-row-rainbowwallet.eth');
    await Helpers.checkIfVisible('profile-sheet');
  });

  it.skip('Should watch wallet from Profile sheet', async () => {
    await Helpers.waitAndTap('profile-sheet-watch-button');
  });

  it.skip('Should close profile and return to Search on swiping down', async () => {
    await Helpers.swipe('profile-sheet', 'down');
    await Helpers.waitAndTap('discover-search-clear-input');
    await Helpers.checkIfVisible('discover-currency-select-list-exchange-coin-row-ETH-mainnet');
  });

  it('Should close search and return to Discover Home on pressing Done', async () => {
    await Helpers.waitAndTap('done-button');
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
  });
});
