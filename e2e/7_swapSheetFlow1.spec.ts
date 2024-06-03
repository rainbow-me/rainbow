import { device } from 'detox';
import {
  importWalletFlow,
  sendETHtoTestWallet,
  waitAndTap,
  checkIfVisible,
  typeText,
  swipe,
  checkIfNotVisible,
  clearField,
  checkIfElementHasString,
  checkForElementByLabel,
  beforeAllcleanApp,
  afterAllcleanApp,
} from './helpers';

const ios = device.getPlatform() === 'ios';
const android = device.getPlatform() === 'android';

describe('Swap Sheet Interaction Flow', () => {
  beforeAll(async () => {
    await beforeAllcleanApp({ hardhat: true });
  });
  afterAll(async () => {
    await afterAllcleanApp({ hardhat: true });
  });

  it('Import a wallet and go to welcome', async () => {
    await importWalletFlow();
  });

  it('Should send ETH to test wallet', async () => {
    await sendETHtoTestWallet();
  });

  it('Should show Hardhat Toast after pressing Connect To Hardhat', async () => {
    await waitAndTap('dev-button-hardhat');
    await checkIfVisible('testnet-toast-Hardhat');
  });

  // FIXME: Mainnet DAI doesn't show up in the swap search results
  //        This might be related to @Jin's latest work on changes to hardhat as
  //        part of the addy's REST API migration
  //
  //        marking the test as SKIP for now
  it('Should go to swap and open review sheet on mainnet swap', async () => {
    await waitAndTap('swap-button');
    await waitAndTap('exchange-modal-input-selection-button');
    await typeText('currency-select-search-input', 'DAI', true);
    await waitAndTap('currency-select-list-exchange-coin-row-DAI-mainnet');
    await waitAndTap('exchange-modal-input-max');
    await waitAndTap('exchange-modal-output-selection-button');
    await waitAndTap('currency-select-list-exchange-coin-row-ETH-mainnet');
    await checkIfVisible('exchange-modal-confirm-button');
    await waitAndTap('exchange-modal-confirm-button');
    await checkIfVisible('swaps-details-value-row');
    await checkIfVisible('swaps-details-fee-row');
    await waitAndTap('swaps-details-show-details-button');
    await checkIfVisible('swaps-details-price-row');
    await swipe(ios ? 'swap-details-sheet' : 'swap-details-header', 'down', 'fast');
    await swipe('exchange-modal-notch', 'down', 'fast');
  });

  // FIXME: This test doesn't clear the "currency-select-search-input" when
  // coming back from exchange modal and then fails to actually tap the review
  // button
  it('Should go to swap and open review sheet on optimism swap', async () => {
    await waitAndTap('swap-button');
    await waitAndTap('exchange-modal-input-selection-button');
    await typeText('currency-select-search-input', 'OP', true);
    await waitAndTap('currency-select-list-exchange-coin-row-OP-optimism');
    await waitAndTap('exchange-modal-input-max');
    await waitAndTap('exchange-modal-output-selection-button');
    await typeText('currency-select-search-input', 'ETH', true);
    await waitAndTap('currency-select-list-exchange-coin-row-ETH-optimism');
    await checkIfVisible('exchange-modal-confirm-button');
    await waitAndTap('exchange-modal-confirm-button');
    await checkIfVisible('swaps-details-value-row');
    await checkIfVisible('swaps-details-fee-row');
    await waitAndTap('swaps-details-show-details-button');
    await checkIfVisible('swaps-details-price-row');
    await swipe(ios ? 'swap-details-sheet' : 'swap-details-header', 'down', 'fast');
    await swipe('exchange-modal-notch', 'down', 'fast');
  });

  // FIXME: This test doesn't clear the "currency-select-search-input" when
  // coming back from exchange modal and then fails to actually tap the review
  // button
  it('Should go to swap and open review sheet on polygon swap', async () => {
    await waitAndTap('swap-button');
    await waitAndTap('exchange-modal-input-selection-button');
    await typeText('currency-select-search-input', 'DAI', true);
    await waitAndTap('currency-select-list-exchange-coin-row-DAI-polygon');
    await waitAndTap('exchange-modal-input-max');
    await waitAndTap('exchange-modal-output-selection-button');
    await typeText('currency-select-search-input', 'WETH', true);
    await waitAndTap('currency-select-list-exchange-coin-row-WETH-polygon');
    await checkIfVisible('exchange-modal-confirm-button');
    await waitAndTap('exchange-modal-confirm-button');
    await checkIfVisible('swaps-details-value-row');
    await checkIfVisible('swaps-details-fee-row');
    await waitAndTap('swaps-details-show-details-button');
    await checkIfVisible('swaps-details-price-row');
    await swipe(ios ? 'swap-details-sheet' : 'swap-details-header', 'down', 'fast');
    await swipe('exchange-modal-notch', 'down', 'fast');
  });

  // FIXME: This test doesn't clear the "currency-select-search-input" when
  // coming back from exchange modal and then fails to actually tap the review
  // button
  it('Should go to swap and open review sheet on arbitrum swap', async () => {
    await waitAndTap('swap-button');
    await waitAndTap('exchange-modal-input-selection-button');
    await typeText('currency-select-search-input', 'DAI', true);
    await waitAndTap('currency-select-list-exchange-coin-row-DAI-arbitrum');
    await waitAndTap('exchange-modal-input-max');
    await waitAndTap('exchange-modal-output-selection-button');
    await typeText('currency-select-search-input', 'ETH', true);
    await waitAndTap('currency-select-list-exchange-coin-row-ETH-arbitrum');
    await checkIfVisible('exchange-modal-confirm-button');
    await waitAndTap('exchange-modal-confirm-button');
    await checkIfVisible('swaps-details-value-row');
    await checkIfVisible('swaps-details-fee-row');
    await waitAndTap('swaps-details-show-details-button');
    await checkIfVisible('swaps-details-price-row');
    await swipe(ios ? 'swap-details-sheet' : 'swap-details-header', 'down', 'fast');
    await swipe('exchange-modal-notch', 'down', 'fast');
  });

  // FIXME: Dependent on a state from the previous test
  it('Should display currency selection screen on swap-button press', async () => {
    await checkIfVisible('wallet-screen');
    await waitAndTap('swap-button');
    await waitAndTap('exchange-modal-input-selection-button');
    await checkIfVisible('currency-select-list');
  });

  // FIXME: Dependent on a state from the previous test
  it('Should toggle through token networks and show the respective tokens', async () => {
    await waitAndTap('currency-select-list-exchange-coin-row-ETH-mainnet');
    await checkIfVisible('exchange-modal-input');
    await waitAndTap('exchange-modal-output-selection-button');
    await checkIfVisible('currency-select-list');
    await checkIfVisible('network-switcher-1');
    await waitAndTap('network-switcher-item-optimism');
    await checkIfVisible('network-switcher-10');
    await waitAndTap('network-switcher-item-arbitrum');
    await checkIfVisible('network-switcher-42161');
    await waitAndTap('currency-select-header-back-button');
    await waitAndTap('exchange-modal-output-selection-button');
    await checkIfVisible('currency-select-list');
    await checkIfVisible('network-switcher-1');
  });

  // FIXME: Dependent on a state from the previous test
  it('Should update input value after tapping Max Button', async () => {
    await typeText('currency-select-search-input', 'BAT', true);
    await waitAndTap('currency-select-list-exchange-coin-row-BAT-mainnet');
    await checkIfVisible('exchange-modal-input');
    await waitAndTap('exchange-modal-input-max');
  });

  // FIXME: Dependent on a state from the previous test
  it('Should display Swap Asset List after tapping Input Section Button', async () => {
    await waitAndTap('exchange-modal-input-selection-button');
    await checkIfVisible('currency-select-list');
    if (android) {
      await device.pressBack();
      await device.pressBack();
    } else {
      await waitAndTap('currency-select-header-back-button');
    }
  });

  // FIXME: Dependent on a state from the previous test
  it('Should reset all fields on selection of new input currency', async () => {
    await waitAndTap('exchange-modal-input-selection-button');
    await checkIfVisible('currency-select-list');
    await waitAndTap('currency-select-list-exchange-coin-row-DAI-mainnet');
  });

  // FIXME: Dependent on a state from the previous test
  it('Should change Currency Select List on search entry', async () => {
    await waitAndTap('exchange-modal-input-selection-button');
    await typeText('currency-select-search-input', 'SOCKS\n', true);
    await checkIfNotVisible('currency-select-list-exchange-coin-row-ETH-mainnet');
  });

  // FIXME: Dependent on a state from the previous test
  it('Should reset Currency Select List on clearing search field', async () => {
    await clearField('currency-select-search-input');
    await checkIfVisible('currency-select-list-exchange-coin-row-ETH-mainnet');
    if (android) {
      await device.pressBack();
      await device.pressBack();
    } else {
      await waitAndTap('currency-select-header-back-button');
    }
    await swipe('exchange-modal-notch', 'down', 'fast');
  });

  // FIXME: Dependent on a state from the previous test
  it('Should show Choose Token Button if input & output are same token(ETH)', async () => {
    if (!ios) {
      // TODO
      return;
    }
    await waitAndTap('balance-coin-row-Ethereum');
    await waitAndTap('swap-action-button');
    await waitAndTap('currency-select-list-exchange-coin-row-ETH-mainnet');
    await checkIfVisible('exchange-modal-input');
    await checkIfElementHasString('exchange-modal-input-selection-button-text', 'Choose Token');
    await waitAndTap('exchange-modal-output-selection-button');
    if (android) {
      await device.pressBack();
    } else {
      await waitAndTap('currency-select-header-back-button');
    }
    await swipe('exchange-modal-notch', 'down', 'fast');
  });

  // FIXME: Dependent on a state from the previous test
  it('Should clear inputs when typing a number in inputs and then clearing it', async () => {
    await waitAndTap('swap-button');
    await waitAndTap('exchange-modal-input-selection-button');
    await checkIfVisible('currency-select-list');
    await waitAndTap('currency-select-list-exchange-coin-row-ETH-mainnet');
    await checkIfVisible('exchange-modal-input');
    await waitAndTap('exchange-modal-output-selection-button');
    await checkIfVisible('currency-select-list');
    await typeText('currency-select-search-input', 'DAI\n', true);
    await checkIfVisible('currency-select-list-exchange-coin-row-DAI-mainnet');
    await waitAndTap('currency-select-list-exchange-coin-row-DAI-mainnet');
    await waitAndTap('exchange-modal-input-selection-button');
    await checkIfVisible('currency-select-list');
    await waitAndTap('currency-select-list-exchange-coin-row-DAI-mainnet');

    await checkIfElementHasString('exchange-modal-input-selection-button-text', 'DAI');
    await checkIfElementHasString('exchange-modal-output-selection-button-text', 'ETH');
    await checkIfVisible('exchange-modal-input');
    await typeText('exchange-modal-input', '24', true);
    await clearField('exchange-modal-input-24');
    await checkIfVisible('exchange-modal-output');
    await typeText('exchange-modal-output', '24', true);
    await clearField('exchange-modal-output-24');
    await checkIfVisible('exchange-modal-input');
    await typeText('exchange-modal-input-native', '24', true);
    await clearField('exchange-modal-input-native-24');
    await checkIfVisible('exchange-modal-input');
    await checkIfVisible('exchange-modal-output');
    await swipe('exchange-modal-notch', 'down', 'fast');
  });

  // FIXME: Dependent on a state from the previous test
  it('Should clear inputs when typing a number in inputs and then clearing it optimism', async () => {
    await waitAndTap('swap-button');
    await waitAndTap('exchange-modal-input-selection-button');
    await checkIfVisible('currency-select-list');
    await typeText('currency-select-search-input', 'ETH\n', true);
    await waitAndTap('currency-select-list-exchange-coin-row-ETH-optimism');
    await checkIfVisible('exchange-modal-input');
    await waitAndTap('exchange-modal-output-selection-button');
    await checkIfVisible('network-switcher-10');
    await waitAndTap('currency-select-list-exchange-coin-row-OP-optimism');
    await checkIfVisible('exchange-modal-input');
    await typeText('exchange-modal-input', '24', false);
    await clearField('exchange-modal-input-24');
    await checkIfVisible('exchange-modal-output');
    await typeText('exchange-modal-output', '24', false);
    await clearField('exchange-modal-output-24');
    await checkIfVisible('exchange-modal-input');
    if (ios) {
      await checkForElementByLabel('Enter an Amount');
    }
    await typeText('exchange-modal-input-native', '24', false);
    await clearField('exchange-modal-input-native-24');
    await checkIfVisible('exchange-modal-input');
    await checkIfVisible('exchange-modal-output');
  });

  // FIXME: Dependent on a state from the previous test
  it('Should show settings routes picker but not flashbots on Optimism', async () => {
    await waitAndTap('exchange-settings-button');
    await checkIfVisible('swap-settings-header');
    await checkIfVisible('swap-settings-routes-label');
    await checkIfNotVisible('swap-settings-flashbots-label');
    await swipe('swap-settings-header', 'down', 'fast');
    await swipe('exchange-modal-notch', 'down', 'fast');
  });

  // FIXME: Dependent on a state from the previous test
  it('Should clear inputs when typing a number in inputs and then clearing it arbitrum', async () => {
    await waitAndTap('swap-button');
    await waitAndTap('exchange-modal-input-selection-button');
    await checkIfVisible('currency-select-list');
    await typeText('currency-select-search-input', 'ETH\n', true);
    await waitAndTap('currency-select-list-exchange-coin-row-ETH-arbitrum');
    await waitAndTap('exchange-modal-output-selection-button');
    await checkIfVisible('network-switcher-42161');
    await waitAndTap('currency-select-list-exchange-coin-row-DAI-arbitrum');
    await checkIfVisible('exchange-modal-input');
    await typeText('exchange-modal-input', '24\n', false);
    await clearField('exchange-modal-input-24');
    await checkIfVisible('exchange-modal-output');
    await typeText('exchange-modal-input-native', '24\n', false);
    await clearField('exchange-modal-input-native-24');
    await checkIfVisible('exchange-modal-input');
    await checkIfVisible('exchange-modal-output');
    await swipe('exchange-modal-notch', 'down', 'fast');
  });

  // FIXME: Dependent on a state from the previous test
  it('Should clear inputs when typing a number in inputs and then clearing it polygon', async () => {
    await waitAndTap('swap-button');
    await waitAndTap('exchange-modal-input-selection-button');
    await checkIfVisible('currency-select-list');
    await typeText('currency-select-search-input', 'WETH', true);
    await waitAndTap('currency-select-list-exchange-coin-row-WETH-polygon');
    await waitAndTap('exchange-modal-output-selection-button');
    await checkIfVisible('network-switcher-137');
    await waitAndTap('currency-select-list-exchange-coin-row-MATIC-polygon');
    await checkIfVisible('exchange-modal-input');
    await typeText('exchange-modal-input', '24', false);
    await clearField('exchange-modal-input-24');
    await checkIfVisible('exchange-modal-output');
    await typeText('exchange-modal-output', '24', false);
    await clearField('exchange-modal-output-24');
    await checkIfVisible('exchange-modal-input');
    await typeText('exchange-modal-input-native', '24', false);
    await clearField('exchange-modal-input-native-24');
    await checkIfVisible('exchange-modal-input');
    await checkIfVisible('exchange-modal-output');
  });

  // FIXME: Dependent on a state from the previous test
  it('Should show settings routes picker but notflashbots on Polygon', async () => {
    await waitAndTap('exchange-settings-button');
    await checkIfVisible('swap-settings-header');
    await checkIfVisible('swap-settings-routes-label');
    await checkIfNotVisible('swap-settings-flashbots-label');
    await swipe('swap-settings-header', 'down', 'fast');
    await swipe('exchange-modal-notch', 'down', 'fast');
  });
});
