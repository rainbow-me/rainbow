/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

beforeAll(async () => {
  await Helpers.startHardhat();
});

const ios = device.getPlatform() === 'ios';
const android = device.getPlatform() === 'android';

describe('Swap Sheet Interaction Flow', () => {
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
    await Helpers.checkIfElementHasString(
      'import-sheet-button-label',
      'Continue'
    );
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

  it('Should send ETH to test wallet"', async () => {
    await Helpers.sendETHtoTestWallet();
  });

  it('Should show Hardhat Toast after pressing Connect To Hardhat', async () => {
    // need to wait for balances to be fetched
    await Helpers.delay(10000);
    await Helpers.waitAndTap('dev-button-hardhat');
    await Helpers.checkIfVisible('testnet-toast-Hardhat');
  });

  // FIXME: Mainnet DAI doesn't show up in the swap search results
  //        This might be related to @Jin's latest work on changes to hardhat as
  //        part of the addy's REST API migration
  //
  //        marking the test as SKIP for now
  it.skip('Should go to swap and open review sheet on mainnet swap', async () => {
    await Helpers.waitAndTap('swap-button');
    await Helpers.typeText('currency-select-search-input', 'DAI', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-DAI-token');
    await Helpers.waitAndTap('exchange-modal-input-max');
    await Helpers.tap('exchange-modal-output-selection-button');
    // await Helpers.typeText('currency-select-search-input', 'ETH', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-ETH-token');
    await Helpers.delay(ios ? 2000 : 5000);
    await Helpers.checkIfVisible('exchange-modal-confirm-button');
    await Helpers.waitAndTap('exchange-modal-confirm-button');
    await Helpers.checkIfVisible('swaps-details-value-row');
    await Helpers.checkIfVisible('swaps-details-fee-row');
    await Helpers.waitAndTap('swaps-details-show-details-button');
    await Helpers.checkIfVisible('swaps-details-price-row');
    await Helpers.swipe(
      ios ? 'swap-details-sheet' : 'swap-details-header',
      'down',
      'fast'
    );
    await Helpers.swipe('exchange-modal-notch', 'down', 'fast');
  });

  // FIXME: This test doesn't clear the "currency-select-search-input" when
  // coming back from exchange modal and then fails to actually tap the review
  // button
  it.skip('Should go to swap and open review sheet on optimism swap', async () => {
    await Helpers.waitAndTap('swap-button');
    await Helpers.typeText('currency-select-search-input', 'OP', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-OP-optimism');
    await Helpers.waitAndTap('exchange-modal-input-max');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.typeText('currency-select-search-input', 'ETH', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-ETH-optimism');
    await Helpers.delay(ios ? 2000 : 5000);
    await Helpers.checkIfVisible('exchange-modal-confirm-button');
    await Helpers.waitAndTap('exchange-modal-confirm-button');
    await Helpers.checkIfVisible('swaps-details-value-row');
    await Helpers.checkIfVisible('swaps-details-fee-row');
    await Helpers.waitAndTap('swaps-details-show-details-button');
    await Helpers.checkIfVisible('swaps-details-price-row');
    await Helpers.swipe(
      ios ? 'swap-details-sheet' : 'swap-details-header',
      'down',
      'fast'
    );
    await Helpers.swipe('exchange-modal-notch', 'down', 'fast');
  });

  // FIXME: This test doesn't clear the "currency-select-search-input" when
  // coming back from exchange modal and then fails to actually tap the review
  // button
  it.skip('Should go to swap and open review sheet on polygon swap', async () => {
    await Helpers.waitAndTap('swap-button');
    await Helpers.typeText('currency-select-search-input', 'DAI', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-DAI-polygon');
    await Helpers.waitAndTap('exchange-modal-input-max');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.typeText('currency-select-search-input', 'WETH', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-WETH-polygon');
    await Helpers.delay(ios ? 2000 : 5000);
    await Helpers.checkIfVisible('exchange-modal-confirm-button');
    await Helpers.waitAndTap('exchange-modal-confirm-button');
    await Helpers.checkIfVisible('swaps-details-value-row');
    await Helpers.checkIfVisible('swaps-details-fee-row');
    await Helpers.waitAndTap('swaps-details-show-details-button');
    await Helpers.checkIfVisible('swaps-details-price-row');
    await Helpers.swipe(
      ios ? 'swap-details-sheet' : 'swap-details-header',
      'down',
      'fast'
    );
    await Helpers.swipe('exchange-modal-notch', 'down', 'fast');
  });

  // FIXME: This test doesn't clear the "currency-select-search-input" when
  // coming back from exchange modal and then fails to actually tap the review
  // button
  it.skip('Should go to swap and open review sheet on arbitrum swap', async () => {
    await Helpers.waitAndTap('swap-button');
    await Helpers.typeText('currency-select-search-input', 'DAI', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-DAI-arbitrum');
    await Helpers.waitAndTap('exchange-modal-input-max');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.typeText('currency-select-search-input', 'ETH', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-ETH-arbitrum');
    await Helpers.delay(ios ? 2000 : 5000);
    await Helpers.checkIfVisible('exchange-modal-confirm-button');
    await Helpers.waitAndTap('exchange-modal-confirm-button');
    await Helpers.checkIfVisible('swaps-details-value-row');
    await Helpers.checkIfVisible('swaps-details-fee-row');
    await Helpers.waitAndTap('swaps-details-show-details-button');
    await Helpers.checkIfVisible('swaps-details-price-row');
    await Helpers.swipe(
      ios ? 'swap-details-sheet' : 'swap-details-header',
      'down',
      'fast'
    );
    await Helpers.swipe('exchange-modal-notch', 'down', 'fast');
  });

  // FIXME: Dependent on a state from the previous test
  it.skip('Should display currency selection screen on swap-button press', async () => {
    await Helpers.checkIfVisible('wallet-screen');
    await Helpers.waitAndTap('swap-button');
    await Helpers.checkIfVisible('currency-select-list');
  });

  // FIXME: Dependent on a state from the previous test
  it.skip('Should toggle through token networks and show the respective tokens', async () => {
    await Helpers.tap('currency-select-list-exchange-coin-row-ETH-token');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.checkIfVisible('network-switcher-1');
    await Helpers.waitAndTap('network-switcher-item-optimism');
    await Helpers.checkIfVisible('network-switcher-10');
    await Helpers.waitAndTap('network-switcher-item-arbitrum');
    await Helpers.checkIfVisible('network-switcher-42161');
    await Helpers.waitAndTap('currency-select-header-back-button');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.checkIfVisible('network-switcher-1');
  });

  // FIXME: Dependent on a state from the previous test
  it.skip('Should update input value after tapping Max Button', async () => {
    await Helpers.typeText('currency-select-search-input', 'BAT', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-BAT-token');
    await Helpers.delay(ios ? 2000 : 5000);
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.waitAndTap('exchange-modal-input-max');
  });

  // FIXME: Dependent on a state from the previous test
  it.skip('Should display Swap Asset List after tapping Input Section Button', async () => {
    await Helpers.waitAndTap('exchange-modal-input-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    if (android) {
      await device.pressBack();
      await device.pressBack();
    } else {
      await Helpers.waitAndTap('currency-select-header-back-button');
    }
  });

  // FIXME: Dependent on a state from the previous test
  it.skip('Should reset all fields on selection of new input currency', async () => {
    await Helpers.waitAndTap('exchange-modal-input-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.waitAndTap(
      'currency-select-list-exchange-coin-row-DAI-token'
    );
  });

  // FIXME: Dependent on a state from the previous test
  it.skip('Should change Currency Select List on search entry', async () => {
    await Helpers.waitAndTap('exchange-modal-input-selection-button');
    await Helpers.typeText('currency-select-search-input', 'SOCKS\n', true);
    await Helpers.checkIfNotVisible(
      'currency-select-list-exchange-coin-row-ETH-token'
    );
  });

  // FIXME: Dependent on a state from the previous test
  it.skip('Should reset Currency Select List on clearing search field', async () => {
    await Helpers.clearField('currency-select-search-input');
    await Helpers.checkIfVisible(
      'currency-select-list-exchange-coin-row-ETH-token'
    );
    if (android) {
      await device.pressBack();
      await device.pressBack();
    } else {
      await Helpers.waitAndTap('currency-select-header-back-button');
    }
    await Helpers.swipe('exchange-modal-notch', 'down', 'fast');
  });

  // FIXME: Dependent on a state from the previous test
  it.skip('Should show Choose Token Button if input & output are same token(ETH)', async () => {
    if (!ios) {
      // TODO
      return;
    }
    await Helpers.waitAndTap('balance-coin-row-Ethereum');
    await Helpers.waitAndTap('swap-action-button');
    await Helpers.waitAndTap(
      'currency-select-list-exchange-coin-row-ETH-token'
    );
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.checkIfElementHasString(
      'exchange-modal-input-selection-button-text',
      'Choose Token'
    );
    await Helpers.tap('exchange-modal-output-selection-button');
    if (android) {
      await device.pressBack();
    } else {
      await Helpers.waitAndTap('currency-select-header-back-button');
    }
    await Helpers.swipe('exchange-modal-notch', 'down', 'fast');
  });

  // FIXME: Dependent on a state from the previous test
  it.skip('Should clear inputs when typing a number in inputs and then clearing it', async () => {
    await Helpers.waitAndTap('swap-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.tap('currency-select-list-exchange-coin-row-ETH-token');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText('currency-select-search-input', 'DAI\n', true);
    await Helpers.checkIfVisible(
      'currency-select-list-exchange-coin-row-DAI-token'
    );
    await Helpers.waitAndTap(
      'currency-select-list-exchange-coin-row-DAI-token'
    );
    await Helpers.waitAndTap('exchange-modal-input-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.waitAndTap(
      'currency-select-list-exchange-coin-row-DAI-token'
    );

    await Helpers.checkIfElementHasString(
      'exchange-modal-input-selection-button-text',
      'DAI'
    );
    await Helpers.checkIfElementHasString(
      'exchange-modal-output-selection-button-text',
      'ETH'
    );
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.typeText('exchange-modal-input', '24', true);
    await Helpers.clearField('exchange-modal-input-24');
    await Helpers.checkIfVisible('exchange-modal-output');
    await Helpers.typeText('exchange-modal-output', '24', true);
    await Helpers.clearField('exchange-modal-output-24');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.typeText('exchange-modal-input-native', '24', true);
    await Helpers.clearField('exchange-modal-input-native-24');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.checkIfVisible('exchange-modal-output');
    await Helpers.swipe('exchange-modal-notch', 'down', 'fast');
  });

  // FIXME: Dependent on a state from the previous test
  it.skip('Should clear inputs when typing a number in inputs and then clearing it optimism', async () => {
    await Helpers.waitAndTap('swap-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText('currency-select-search-input', 'ETH\n', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-ETH-optimism');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('network-switcher-10');
    await Helpers.tap('currency-select-list-exchange-coin-row-OP-optimism');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.typeText('exchange-modal-input', '24', false);
    await Helpers.clearField('exchange-modal-input-24');
    await Helpers.checkIfVisible('exchange-modal-output');
    await Helpers.typeText('exchange-modal-output', '24', false);
    await Helpers.clearField('exchange-modal-output-24');
    await Helpers.checkIfVisible('exchange-modal-input');
    if (ios) {
      await Helpers.checkForElementByLabel('Enter an Amount');
    }
    await Helpers.typeText('exchange-modal-input-native', '24', false);
    await Helpers.clearField('exchange-modal-input-native-24');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.checkIfVisible('exchange-modal-output');
  });

  // FIXME: Dependent on a state from the previous test
  it.skip('Should show settings routes picker but not flashbots on Optimism', async () => {
    await Helpers.waitAndTap('exchange-settings-button');
    await Helpers.checkIfVisible('swap-settings-header');
    await Helpers.checkIfVisible('swap-settings-routes-label');
    await Helpers.checkIfNotVisible('swap-settings-flashbots-label');
    await Helpers.swipe('swap-settings-header', 'down', 'fast');
    await Helpers.swipe('exchange-modal-notch', 'down', 'fast');
  });

  // FIXME: Dependent on a state from the previous test
  it.skip('Should clear inputs when typing a number in inputs and then clearing it arbitrum', async () => {
    await Helpers.waitAndTap('swap-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText('currency-select-search-input', 'ETH\n', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-ETH-arbitrum');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('network-switcher-42161');
    await Helpers.tap('currency-select-list-exchange-coin-row-DAI-arbitrum');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.typeText('exchange-modal-input', '24\n', false);
    await Helpers.clearField('exchange-modal-input-24');
    await Helpers.checkIfVisible('exchange-modal-output');
    await Helpers.typeText('exchange-modal-input-native', '24\n', false);
    await Helpers.clearField('exchange-modal-input-native-24');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.checkIfVisible('exchange-modal-output');
    await Helpers.swipe('exchange-modal-notch', 'down', 'fast');
  });

  // FIXME: Dependent on a state from the previous test
  it.skip('Should clear inputs when typing a number in inputs and then clearing it polygon', async () => {
    await Helpers.waitAndTap('swap-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText('currency-select-search-input', 'WETH', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-WETH-polygon');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('network-switcher-137');
    await Helpers.tap('currency-select-list-exchange-coin-row-MATIC-polygon');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.typeText('exchange-modal-input', '24', false);
    await Helpers.clearField('exchange-modal-input-24');
    await Helpers.checkIfVisible('exchange-modal-output');
    await Helpers.typeText('exchange-modal-output', '24', false);
    await Helpers.clearField('exchange-modal-output-24');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.typeText('exchange-modal-input-native', '24', false);
    await Helpers.clearField('exchange-modal-input-native-24');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.checkIfVisible('exchange-modal-output');
  });

  // FIXME: Dependent on a state from the previous test
  it.skip('Should show settings routes picker but notflashbots on Polygon', async () => {
    await Helpers.waitAndTap('exchange-settings-button');
    await Helpers.checkIfVisible('swap-settings-header');
    await Helpers.checkIfVisible('swap-settings-routes-label');
    await Helpers.checkIfNotVisible('swap-settings-flashbots-label');
    await Helpers.swipe('swap-settings-header', 'down', 'fast');
    await Helpers.swipe('exchange-modal-notch', 'down', 'fast');
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
    await Helpers.killHardhat();
  });
});
