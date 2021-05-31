/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

describe('Discover Sheet Flow', () => {
  it('Should show the welcome screen', async () => {
    await Helpers.checkIfVisible('welcome-screen');
  });

  it('Should show the "Restore Sheet" after tapping on "I already have a wallet"', async () => {
    await Helpers.waitAndTap('already-have-wallet-button');
    await Helpers.checkIfExists('restore-sheet');
  });

  it('show the "Import Sheet" when tapping on "Restore with a recovery phrase or private key"', async () => {
    await Helpers.waitAndTap('restore-with-key-button');
    await Helpers.checkIfExists('import-sheet');
  });

  it('Should show the "Add wallet modal" after tapping import with a valid seed"', async () => {
    await Helpers.clearField('import-sheet-input');
    await Helpers.typeText('import-sheet-input', process.env.TEST_SEEDS, false);
    await Helpers.checkIfElementHasString(
      'import-sheet-button-label',
      'Import'
    );
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.checkIfVisible('wallet-info-modal');
  });

  it('Should navigate to the Wallet screen after tapping on "Import Wallet"', async () => {
    await Helpers.disableSynchronization();
    await Helpers.waitAndTap('wallet-info-submit-button');
    if (device.getPlatform() === 'android') {
      await Helpers.checkIfVisible('pin-authentication-screen');
      // Set the pin
      await Helpers.authenticatePin('1234');
      // Confirm it
      await Helpers.authenticatePin('1234');
    }
    await Helpers.checkIfVisible('wallet-screen', 40000);
    await Helpers.enableSynchronization();
  });

  it('Should navigate to Discover screen after tapping Discover Button', async () => {
    await Helpers.waitAndTap('discover-button');
    await Helpers.checkIfVisible('discover-header');
  });

  it('Should show the camera if Discover is minimized', async () => {
    await Helpers.swipe('discover-header', 'down');
    await Helpers.checkIfVisible('scanner-header');
    await Helpers.checkIfNotVisible('lists-section');
  });

  it('Should open Discover Search on pressing search fab', async () => {
    await Helpers.swipe('discover-header', 'up');
    await Helpers.waitAndTap('search-fab');
    await Helpers.checkIfVisible('done-button');
  });

  it('Should search and open expanded state for SOCKS', async () => {
    await Helpers.typeText('discover-search-input', 'SOCKS\n', true);
    await Helpers.checkIfVisible(
      'discover-currency-select-list-exchange-coin-row-SOCKS'
    );
    await Helpers.checkIfNotVisible(
      'discover-currency-select-list-exchange-coin-row-ETH'
    );
    await Helpers.waitAndTap(
      'discover-currency-select-list-exchange-coin-row-SOCKS'
    );
    await Helpers.checkIfVisible('chart-header-Unisocks');
  });

  it('Should add Unisocks to Watchlist & remove from Favorites', async () => {
    await Helpers.waitAndTap('add-to-list-button');
    await Helpers.checkIfVisible('add-token-sheet');
    await Helpers.waitAndTap('add-to-watchlist');
    await Helpers.checkIfVisible('remove-from-watchlist');
    await Helpers.waitAndTap('remove-from-favorites');
    await Helpers.checkIfNotVisible('remove-from-favorites');

    await Helpers.waitAndTap('close-action-button');
  });

  it('Should close expanded state and return to search', async () => {
    await Helpers.swipe('expanded-state-header', 'down');
    await Helpers.checkIfNotVisible(
      'discover-currency-select-list-exchange-coin-row-ETH'
    );
  });

  it('Should close search and return to Discover Home on pressing Done', async () => {
    await Helpers.waitAndTap('done-button');
    await Helpers.checkIfVisible('top-movers-section');
  });

  it('Top Movers should be swipeable and open expanded states', async () => {
    await Helpers.waitAndTap('top-gainers-coin-row-0');
    await Helpers.swipe('expanded-state-header', 'down');
    await Helpers.swipe('top-gainers', 'left');
    await Helpers.checkIfNotVisible('top-gainers-coin-row-0');
    await Helpers.waitAndTap('top-losers-coin-row-0');
    await Helpers.swipe('expanded-state-header', 'down');
    await Helpers.swipe('top-losers', 'left');
    await Helpers.checkIfNotVisible('top-losers-coin-row-0');
  });

  it('Should open DPI expanded state on DPI press', async () => {
    await Helpers.waitAndTap('dpi-button');
    await Helpers.checkIfVisible('index-expanded-state');
    await Helpers.checkIfVisible('index-underlying-assets');
  });

  it('Should open underlying asset expanded state', async () => {
    await Helpers.waitAndTap('underlying-asset-UNI');
    await Helpers.checkIfVisible('chart-header-Uniswap');
    await Helpers.swipe('expanded-state-header', 'down');
  });

  it('Should close DPI expanded state and return to Discover Home', async () => {
    await Helpers.swipe('index-expanded-state-header', 'down');
    await Helpers.checkIfVisible('discover-header');
  });

  it('Should cycle through token lists', async () => {
    await Helpers.checkIfVisible('lists-section-favorites');
    await Helpers.checkIfNotVisible('list-coin-row-Unisocks');
    await Helpers.waitAndTap('list-watchlist');
    await Helpers.checkIfVisible('lists-section-watchlist');
    await Helpers.checkIfVisible('list-coin-row-Unisocks');
    await Helpers.waitAndTap('list-trending');
    await Helpers.checkIfVisible('lists-section-trending');
    await Helpers.waitAndTap('list-favorites');
    await Helpers.checkIfVisible('lists-section-favorites');
    await Helpers.waitAndTap('list-defi');
    await Helpers.checkIfVisible('lists-section-defi');
    await Helpers.waitAndTap('list-stablecoins');
    await Helpers.checkIfVisible('lists-section-stablecoins');
  });

  it('Should cycle through pools lists', async () => {
    await Helpers.swipe('dpi-button', 'up');
    await Helpers.waitAndTap('pools-list-liquidity');
    await Helpers.checkIfVisible('pools-section-liquidity');
    await Helpers.waitAndTap('pools-list-annualized_fees');
    await Helpers.checkIfVisible('pools-section-annualized_fees');
    await Helpers.waitAndTap('pools-list-profit30d');
    await Helpers.checkIfVisible('pools-section-profit30d');
    await Helpers.waitAndTap('pools-list-oneDayVolumeUSD');
    await Helpers.checkIfVisible('pools-section-oneDayVolumeUSD');
  });
  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
  });
});
