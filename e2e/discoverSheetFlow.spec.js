/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

describe('Discover Sheet Flow', () => {
  it('Should show the welcome screen', async () => {
    await Helpers.disableSynchronization();
    await Helpers.checkIfVisible('welcome-screen');
  });

  it('Should show the "Restore Sheet" after tapping on "I already have a wallet"', async () => {
    await Helpers.tap('already-have-wallet-button');
    await Helpers.delay(2000);
    await Helpers.checkIfExists('restore-sheet');
  });

  it('show the "Import Sheet" when tapping on "Restore with a recovery phrase or private key"', async () => {
    await Helpers.tap('restore-with-key-button');
    await Helpers.delay(2000);
    await Helpers.checkIfExists('import-sheet');
  });

  it('Should show the "Add wallet modal" after tapping import with a valid seed"', async () => {
    await Helpers.clearField('import-sheet-input');
    await Helpers.typeText('import-sheet-input', process.env.TEST_SEEDS, false);
    await Helpers.delay(2000);
    await Helpers.checkIfElementHasString(
      'import-sheet-button-label',
      'Import'
    );
    await Helpers.tap('import-sheet-button');
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('wallet-info-modal');
  });

  it('Should navigate to the Wallet screen after tapping on "Import Wallet"', async () => {
    await Helpers.delay(5000);
    await Helpers.tap('wallet-info-submit-button');
    if (device.getPlatform() === 'android') {
      await Helpers.checkIfVisible('pin-authentication-screen');
      // Set the pin
      await Helpers.authenticatePin('1234');
      // Confirm it
      await Helpers.authenticatePin('1234');
    }
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('wallet-screen');
  });

  it('Should navigate to Discover screen after tapping Discover Button', async () => {
    await Helpers.delay(2000);
    await Helpers.tap('discover-button');
    await Helpers.delay(3000);
    await Helpers.checkIfVisible('discover-header');
  });

  it('Should show the camera if Discover is minimized', async () => {
    await Helpers.delay(1000);
    await Helpers.swipe('discover-header', 'down');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('scanner-header');
    await Helpers.checkIfNotVisible('lists-section');
  });

  it('Should open Discover Search on pressing search fab', async () => {
    await Helpers.delay(1000);
    await Helpers.tap('search-fab');
    await Helpers.swipe('discover-header', 'up');
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('done-button');
  });

  it('Should search and open expanded state for SOCKS', async () => {
    await Helpers.delay(1000);
    await Helpers.typeText('discover-search-input', 'SOCKS\n', true);
    await Helpers.delay(8000);
    await Helpers.checkIfVisible(
      'discover-currency-select-list-exchange-coin-row-SOCKS'
    );
    await Helpers.checkIfNotVisible(
      'discover-currency-select-list-exchange-coin-row-ETH'
    );
    await Helpers.tap('discover-currency-select-list-exchange-coin-row-SOCKS');
    await Helpers.delay(2500);
    await Helpers.checkIfVisible('chart-header-Unisocks');
  });

  it('Should add Unisocks to Watchlist & remove from Favorites', async () => {
    await Helpers.tap('add-to-list-button');
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('add-token-sheet');
    await Helpers.tap('add-to-watchlist');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('remove-from-watchlist');
    await Helpers.tap('remove-from-favorites');
    await Helpers.delay(1000);
    await Helpers.checkIfNotVisible('remove-from-favorites');

    await Helpers.delay(1000);
    await Helpers.tap('close-action-button');
  });

  it('Should close expanded state and return to search', async () => {
    await Helpers.delay(4000);
    await Helpers.swipe('expanded-state-header', 'down');
    await Helpers.delay(1000);
    await Helpers.checkIfNotVisible(
      'discover-currency-select-list-exchange-coin-row-ETH'
    );
  });

  it('Should close search and return to Discover Home on pressing Done', async () => {
    await Helpers.tap('done-button');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('top-movers-section');
  });

  it('Top Movers should be swipeable and open expanded states', async () => {
    await Helpers.tap('top-gainers-coin-row-0');
    await Helpers.delay(3000);
    await Helpers.swipe('expanded-state-header', 'down');
    await Helpers.swipe('top-gainers', 'left');
    await Helpers.checkIfNotVisible('top-gainers-coin-row-0');
    await Helpers.tap('top-losers-coin-row-0');
    await Helpers.delay(3000);
    await Helpers.swipe('expanded-state-header', 'down');
    await Helpers.swipe('top-losers', 'left');
    await Helpers.checkIfNotVisible('top-losers-coin-row-0');
  });

  it('Should open DPI expanded state on DPI press', async () => {
    await Helpers.tap('dpi-button');
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('index-expanded-state');
    await Helpers.checkIfVisible('index-underlying-assets');
    await Helpers.delay(3000);
  });

  it('Should open underlying asset expanded state', async () => {
    await Helpers.tap('underlying-asset-UNI');
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('chart-header-Uniswap');
    await Helpers.swipe('expanded-state-header', 'down');
  });

  it('Should close DPI expanded state and return to Discover Home', async () => {
    await Helpers.swipe('index-expanded-state-header', 'down');
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('discover-header');
  });

  it('Should cycle through token lists', async () => {
    await Helpers.checkIfVisible('lists-section-favorites');
    await Helpers.checkIfNotVisible('list-coin-row-Unisocks');
    await Helpers.tap('list-watchlist');
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('lists-section-watchlist');
    await Helpers.checkIfVisible('list-coin-row-Unisocks');
    await Helpers.tap('list-trending');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('lists-section-trending');
    await Helpers.tap('list-favorites');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('lists-section-favorites');
    await Helpers.tap('list-defi');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('lists-section-defi');
    await Helpers.tap('list-stablecoins');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('lists-section-stablecoins');
  });

  it('Should cycle through pools lists', async () => {
    await Helpers.swipe('dpi-button', 'up');
    await Helpers.delay(1000);
    await Helpers.tap('pools-list-liquidity');
    await Helpers.checkIfVisible('pools-section-liquidity');
    await Helpers.delay(5000);
    await Helpers.tap('pools-list-annualized_fees');
    await Helpers.checkIfVisible('pools-section-annualized_fees');
    await Helpers.delay(5000);
    await Helpers.tap('pools-list-profit30d');
    await Helpers.checkIfVisible('pools-section-profit30d');
    await Helpers.delay(5000);
    await Helpers.tap('pools-list-oneDayVolumeUSD');
    await Helpers.checkIfVisible('pools-section-oneDayVolumeUSD');

    await Helpers.delay(5000);
  });
  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
  });
});
