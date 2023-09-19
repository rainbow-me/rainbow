/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

beforeAll(async () => {
  await Helpers.startHardhat();
});

const ios = device.getPlatform() === 'ios';
const android = device.getPlatform() === 'android';

// FIXME: Mainnet DAI doesn't show up in the swap search results
//        This might be related to @Jin's latest work on changes to hardhat as
//        part of the addy's REST API migration
//
//        marking the test as SKIP for now
describe.skip('Swap Sheet Interaction Flow', () => {
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

  it('Should connect to hardhat', async () => {
    await Helpers.swipe('wallet-screen', 'right', 'slow');
    await Helpers.checkIfVisible('profile-screen');
    await Helpers.waitAndTap('settings-button');
    await Helpers.checkIfVisible('settings-sheet');
    await Helpers.scrollTo('settings-menu-container', 'bottom');
    await Helpers.waitAndTap('developer-section');
    await Helpers.swipeUntilVisible(
      'alert-section',
      'developer-settings-sheet',
      'up'
    );
    await Helpers.waitAndTap('hardhat-section');
    await Helpers.checkIfVisible('testnet-toast-Hardhat');
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });

  it('Should go to swap and try different cross chain swaps', async () => {
    await Helpers.waitAndTap('swap-button');
    await Helpers.typeText('currency-select-search-input', 'DAI', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-DAI-token');
    await Helpers.waitAndTap('exchange-modal-input-max');
    await Helpers.checkIfVisible(`exchange-modal-input-DAI-token`);
    await Helpers.checkIfVisible(`exchange-modal-output-empty-empty`);
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.tap('network-switcher-item-optimism');
    await Helpers.typeText('currency-select-search-input', 'DAI', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-DAI-optimism');
    await Helpers.checkIfVisible(`exchange-modal-input-DAI-token`);
    await Helpers.checkIfVisible(`exchange-modal-output-DAI-optimism`);

    await Helpers.swipe('exchange-modal-notch', 'down', 'slow');
  });

  it('Should show explainer sheet when selecting output input for cross chain swaps', async () => {
    await Helpers.waitAndTap('swap-button');
    await Helpers.typeText('currency-select-search-input', 'DAI', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-DAI-token');
    await Helpers.waitAndTap('exchange-modal-input-max');
    await Helpers.checkIfVisible(`exchange-modal-input-DAI-token`);
    await Helpers.checkIfVisible(`exchange-modal-output-empty-empty`);
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.tap('network-switcher-item-optimism');
    await Helpers.typeText('currency-select-search-input', 'USDC', true);
    await Helpers.tap('currency-select-list-exchange-coin-row-USDC-optimism');
    await Helpers.checkIfVisible(`exchange-modal-input-DAI-token`);
    await Helpers.checkIfVisible(`exchange-modal-output-USDC-optimism`);
    await Helpers.waitAndTap('exchange-modal-output-USDC-optimism');
    await Helpers.waitAndTap('explainer-sheet-accent-action-button');
    await Helpers.tapAndLongPress('exchange-modal-confirm-button');
    await Helpers.checkIfVisible('swaps-details-value-row');
    await Helpers.checkIfNotVisible('swaps-details-refuel-row');
    await Helpers.waitAndTap('swaps-details-protocols-row');
    await Helpers.waitAndTap('swaps-details-protocols-row');
    await Helpers.checkIfVisible('swaps-details-fee-row');
    await Helpers.swipe('swap-details-header', 'down', 'slow');
    await Helpers.swipe('exchange-modal-notch', 'down', 'slow');
  });

  it('Should swap input & output and clear form on ETH -> ERC20 when selecting ETH as output', async () => {
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
    await Helpers.waitAndTap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.waitAndTap(
      'currency-select-list-exchange-coin-row-ETH-token'
    );
    await Helpers.checkIfElementHasString(
      'exchange-modal-input-selection-button-text',
      'DAI'
    );
    await Helpers.checkIfElementHasString(
      'exchange-modal-output-selection-button-text',
      'ETH'
    );
    await Helpers.swipe('exchange-modal-notch', 'down', 'slow');
  });

  it('Should swap input & output and clear form on ETH -> ERC20 when selecting ERC20 as input', async () => {
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
    await Helpers.delay(4000);
  });

  it('Should display Enter an Amount Button once input & output currencies are selected', async () => {
    if (ios) {
      // TODO
      await Helpers.checkForElementByLabel('Enter an Amount');
    }
    await Helpers.swipe('exchange-modal-notch', 'down', 'slow');
  });

  it('Should update native input & output after input field change', async () => {
    await Helpers.waitAndTap('swap-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.tap('currency-select-list-exchange-coin-row-ETH-token');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText('currency-select-search-input', 'ZRX\n', false);
    await Helpers.waitAndTap(
      'currency-select-list-exchange-coin-row-ZRX-token'
    );
    await Helpers.checkIfVisible('exchange-modal-input-native');
    await Helpers.checkIfVisible('exchange-modal-output');
    await Helpers.typeText('exchange-modal-input', '0.246\n', false);
    await Helpers.checkIfVisible('exchange-modal-input-0.246');
    await Helpers.checkIfNotVisible('exchange-modal-input-native');
    if (ios) {
      // TODO
      await Helpers.checkIfNotVisible('exchange-modal-output');
    }
    await Helpers.swipe('exchange-modal-notch', 'down', 'slow');
  });

  it('Should update input & output after native input field change', async () => {
    await Helpers.waitAndTap('swap-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.tap('currency-select-list-exchange-coin-row-ETH-token');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText('currency-select-search-input', 'ZRX', false);
    await Helpers.waitAndTap(
      'currency-select-list-exchange-coin-row-ZRX-token'
    );
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.checkIfVisible('exchange-modal-output');
    await Helpers.typeText('exchange-modal-input-native', '0.246', false);
    await Helpers.checkIfVisible('exchange-modal-input-native-0.24');
    if (ios) {
      // TODO
      await Helpers.checkIfNotVisible('exchange-modal-input');
      await Helpers.checkIfNotVisible('exchange-modal-output');
    }
    await Helpers.swipe('exchange-modal-notch', 'down', 'slow');
  });

  it('Should update input & output after native input field change and output DAI', async () => {
    await Helpers.waitAndTap('swap-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.tap('currency-select-list-exchange-coin-row-ETH-token');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText('currency-select-search-input', 'DAI', false);
    await Helpers.waitAndTap(
      'currency-select-list-exchange-coin-row-DAI-token'
    );
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.checkIfVisible('exchange-modal-output');
    await Helpers.typeText('exchange-modal-input-native', '246', false);
    await Helpers.checkIfVisible('exchange-modal-input-native-246');
    if (ios) {
      // TODO
      await Helpers.checkIfNotVisible('exchange-modal-input');
      await Helpers.checkIfNotVisible('exchange-modal-output');
    }
  });

  it('Should show Hold to Swap Button & Swap Info Button on completion of all input fields', async () => {
    await Helpers.checkIfVisible('exchange-modal-confirm-button');
    await Helpers.checkIfVisible('exchange-settings-button');
  });

  it('Should show Swap Settings State on Settings Button press', async () => {
    await Helpers.waitAndTap('exchange-settings-button');
    await Helpers.checkIfVisible('swap-settings-header');
  });

  it('Should show and toggle swap routes on Mainnet', async () => {
    await Helpers.waitAndTap('swap-settings-routes-label');
    await Helpers.checkIfVisible('explain-sheet-routeSwaps');
    await Helpers.swipe('explain-sheet-routeSwaps', 'down', 'fast');
    await Helpers.waitAndTap('swap-settings-routes-current-rainbow');
    await Helpers.tapByText('0x');
    await Helpers.checkIfVisible('swap-settings-routes-current-0x');
  });

  // skipping until flashbots is enabled again after the merge
  it.skip('Should show and toggle flashbots on Mainnet', async () => {
    await Helpers.waitAndTap('swap-settings-flashbots-switch-false');
    await Helpers.checkIfVisible('swap-settings-flashbots-switch-true');
    await Helpers.waitAndTap('swap-settings-flashbots-label');
    // await Helpers.checkIfVisible('explain-sheet-flashbots');
    await Helpers.swipe('explain-sheet-flashbots', 'down', 'fast');
  });

  it('Should show and update slippage on Mainnet', async () => {
    if (ios) {
      // TODO
      await Helpers.clearField('swap-slippage-input-2');
      await Helpers.typeText('swap-slippage-input-', '10', false);
      await Helpers.checkIfVisible('swap-slippage-input-10');
      await Helpers.waitAndTap('swap-slippage-label');
      await Helpers.checkIfVisible('explain-sheet-slippage');
      await Helpers.swipe('explain-sheet-slippage', 'down', 'fast');
    }
  });

  it('Should restore swap setting defaults on Mainnet', async () => {
    await Helpers.waitAndTap('swap-settings-defaults-button');
    await Helpers.checkIfVisible('swap-settings-routes-current-rainbow');
    // restore after merge etc.
    // await Helpers.checkIfVisible('swap-settings-flashbots-switch-false');
    if (ios) {
      // TODO
      await Helpers.checkIfVisible('swap-slippage-input-2');
    }

    await Helpers.swipe('swap-settings-header', 'down', 'fast');
    await Helpers.swipe('exchange-modal-notch', 'down', 'fast');
  });

  it('Should update input & native input after output field change', async () => {
    await Helpers.waitAndTap('swap-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.tap('currency-select-list-exchange-coin-row-ETH-token');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText('currency-select-search-input', 'ZRX', false);
    await Helpers.waitAndTap(
      'currency-select-list-exchange-coin-row-ZRX-token'
    );
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.checkIfVisible('exchange-modal-input-native');
    await Helpers.typeText('exchange-modal-output', '0.246', false);
    await Helpers.checkIfVisible('exchange-modal-output-0.246');
    if (ios) {
      // TODO
      await Helpers.checkIfNotVisible('exchange-modal-input');
      await Helpers.checkIfNotVisible('exchange-modal-input-native');
    }
    await Helpers.swipe('exchange-modal-notch', 'down', 'fast');
  });

  it('Should show Insufficient Funds on input greater than balance', async () => {
    await Helpers.waitAndTap('swap-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.tap('currency-select-list-exchange-coin-row-ETH-token');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText('currency-select-search-input', 'ZRX', false);
    await Helpers.waitAndTap(
      'currency-select-list-exchange-coin-row-ZRX-token'
    );
    if (ios) {
      // TODO
      await Helpers.typeText('exchange-modal-input', '500000000000', false);
      await Helpers.checkForElementByLabel('Insufficient Funds');
    }
    await Helpers.swipe('exchange-modal-notch', 'down', 'fast');
  });

  it('Should prepend 0. to input field on typing .', async () => {
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
    await Helpers.typeText('exchange-modal-input', '.', false);
    await Helpers.checkIfVisible('exchange-modal-input-0.');
    await Helpers.swipe('exchange-modal-notch', 'down', 'fast');
  });

  it('Should prepend 0. to native input field on typing .', async () => {
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
    await Helpers.typeText('exchange-modal-input-native', '.', false);
    await Helpers.checkIfVisible('exchange-modal-input-native-0.');
    await Helpers.swipe('exchange-modal-notch', 'down', 'fast');
  });

  it('Should prepend 0. to output field on typing .', async () => {
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
    await Helpers.typeText('exchange-modal-output', '.', false);
    await Helpers.checkIfVisible('exchange-modal-output-0.');
    await Helpers.swipe('exchange-modal-notch', 'down', 'fast');
  });

  it('Should display Gas Button on Fast by default', async () => {
    await Helpers.waitAndTap('swap-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.tap('currency-select-list-exchange-coin-row-ETH-token');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.typeText('currency-select-search-input', 'ZRX\n', false);
    await Helpers.waitAndTap(
      'currency-select-list-exchange-coin-row-ZRX-token'
    );
    await Helpers.checkIfVisible('exchange-modal-gas');
    await Helpers.checkIfElementByTextIsVisible('Fast');
  });

  it('Should display warning on invalid custom gas price', async () => {
    await Helpers.waitAndTap('gas-speed-custom');
    await Helpers.checkIfVisible('speed-pill-fast');
    await Helpers.checkIfVisible('speed-pill-custom');
    await Helpers.clearField('max-base-fee-input');
    await Helpers.typeText('max-base-fee-input', '\n', false);
    if (ios) {
      // TODO
      await Helpers.checkIfElementByTextIsVisible('Low · likely to fail');
    }
  });

  it('Should rotate between Normal, Fast, Urgent, & Custom', async () => {
    await Helpers.waitAndTap('speed-pill-fast');
    await Helpers.waitAndTap('speed-pill-urgent');
    await Helpers.waitAndTap('speed-pill-custom');
    await Helpers.waitAndTap('speed-pill-normal');
  });

  it.skip('Should display warning on high custom base fee price', async () => {
    await Helpers.clearField('max-base-fee-input');
    await Helpers.typeText('max-base-fee-input', '9999\n', false);
    await Helpers.checkIfElementByTextToExist('High · overpaying');
    await Helpers.waitAndTap('speed-pill-normal');
  });

  it.skip('Should display alert on high custom base fee price', async () => {
    await Helpers.waitAndTap('speed-pill-custom');
    await Helpers.waitAndTap('gas-speed-done-button');
    await Helpers.checkIfElementByTextToExist('High max base fee!');
    await Helpers.tapByText('Edit Max Base Fee');
    await Helpers.waitAndTap('speed-pill-normal');
    await Helpers.clearField('max-base-fee-input');
    await Helpers.typeText('max-base-fee-input', `200\n`, false);
    await Helpers.waitAndTap('speed-pill-normal');
  });

  it('Should display warning on low custom base fee price', async () => {
    await Helpers.clearField('max-base-fee-input');
    await Helpers.typeText('max-base-fee-input', '1\n', false);
    await Helpers.checkIfElementByTextToExist('Low · likely to fail');
  });

  it('Should display alert on low custom base fee price', async () => {
    await Helpers.waitAndTap('gas-speed-done-button');
    await Helpers.checkIfElementByTextToExist(
      'Low max base fee–transaction may get stuck!'
    );
    await Helpers.tapByText('Edit Max Base Fee');
    await Helpers.clearField('max-base-fee-input');
    await Helpers.typeText('max-base-fee-input', '200\n', false);
  });

  it.skip('Should display warning on high custom priority fee price', async () => {
    await Helpers.clearField('max-priority-fee-input');
    await Helpers.typeText('max-priority-fee-input', '999\n', false);
    await Helpers.checkIfElementByTextToExist('High · overpaying');
    await Helpers.waitAndTap('speed-pill-normal');
  });

  it.skip('Should display alert on high custom priority fee price', async () => {
    await Helpers.waitAndTap('speed-pill-custom');
    await Helpers.waitAndTap('gas-speed-done-button');
    await Helpers.checkIfElementByTextToExist('High miner tip!');
    await Helpers.tapByText('Edit Miner Tip');
    await Helpers.waitAndTap('speed-pill-normal');
    await Helpers.clearField('max-base-fee-input');
    await Helpers.typeText('max-base-fee-input', '200\n', false);
    await Helpers.clearField('max-priority-fee-input');
    await Helpers.typeText('max-priority-fee-input', `2\n`, false);
    await Helpers.waitAndTap('speed-pill-normal');
  });

  it.skip('Should display warning on low custom priority fee price', async () => {
    await Helpers.clearField('max-base-fee-input');
    await Helpers.typeText('max-base-fee-input', '200\n', false);
    await Helpers.clearField('max-priority-fee-input');
    await Helpers.typeText('max-priority-fee-input', '0.01\n', false);
    await Helpers.checkIfElementByTextToExist('Low · likely to fail');
  });

  it.skip('Should display alert on low custom priority fee price', async () => {
    await Helpers.swipe('custom-gas-header', 'down', 'fast');
    await Helpers.checkIfElementByTextToExist(
      'Low miner tip–transaction may get stuck!'
    );
    await Helpers.tapByText('Edit Miner Tip');
    await Helpers.clearField('max-priority-fee-input');
    await Helpers.typeText('max-priority-fee-input', '2\n', false);
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
    await Helpers.killHardhat();
  });
});
