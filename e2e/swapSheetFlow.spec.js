/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import { exec } from 'child_process';
import * as Helpers from './helpers';

beforeAll(async () => {
  // Connect to hardhat
  await exec('yarn hardhat');
});

describe('Swap Sheet Interaction Flow', () => {
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

  it('Should send ETH to test wallet"', async () => {
    await Helpers.sendETHtoTestWallet();
  });

  it('Should connect to hardhat', async () => {
    await Helpers.swipe('wallet-screen', 'right', 'slow');
    await Helpers.checkIfVisible('profile-screen');
    await Helpers.waitAndTap('settings-button');
    await Helpers.checkIfVisible('settings-modal');
    await Helpers.waitAndTap('developer-section');
    await Helpers.checkIfVisible('developer-settings-modal');
    await Helpers.waitAndTap('hardhat-section');
    await Helpers.checkIfVisible('testnet-toast-Hardhat');
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });

  it('Should display swap modal on swap-fab press', async () => {
    await Helpers.checkIfVisible('wallet-screen');
    await Helpers.waitAndTap('exchange-fab');
    await Helpers.checkIfVisible('exchange-modal-container');
  });

  it('Should focus on Asset Input on load', async () => {
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.typeText('exchange-modal-input', '0.246\n', true);
    await Helpers.checkIfVisible('exchange-modal-input-0.246');
  });

  it('Should display enabled Choose Token Button for output token selection', async () => {
    await Helpers.checkIfElementHasString(
      'exchange-modal-output-selection-button-text',
      'Choose Token'
    );
  });

  it('Should update input value after tapping Max Button', async () => {
    if (device.getPlatform() === 'android') {
      await device.pressBack();
    } else {
      await Helpers.swipe('exchange-modal-header', 'down', 'slow');
    }
    await Helpers.waitAndTap('exchange-fab');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.waitAndTap('exchange-modal-input-max');
    await Helpers.checkIfNotVisible('exchange-modal-input');
  });

  it('Should display token depletion alert after tapping the Max Button', async () => {
    await Helpers.tapAlertWithButton('No thanks');
  });

  it('Should display Swap Asset List after tapping Input Section Button', async () => {
    await Helpers.waitAndTap('exchange-modal-input-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    if (device.getPlatform() === 'android') {
      await device.pressBack();
      await device.pressBack();
    } else {
      await Helpers.waitAndTap('currency-select-header-back-button');
    }
  });

  it('Should reset all fields on selection of new input currency', async () => {
    await Helpers.waitAndTap('exchange-modal-input-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.waitAndTap('currency-select-list-exchange-coin-row-DAI');
  });

  it('Should display Receive Currency Select List after tapping Choose Token', async () => {
    //this where it gets stuck, with all the assets loading I imagine
    await Helpers.waitAndTap('exchange-modal-output-selection-button');
    await Helpers.checkIfVisible('currency-select-list');
    if (device.getPlatform() === 'android') {
      await device.pressBack();
      await device.pressBack();
    } else {
      await Helpers.waitAndTap('currency-select-header-back-button');
    }
  });

  it('Should change Currency Select List on search entry', async () => {
    await Helpers.waitAndTap('exchange-modal-input-selection-button');
    await Helpers.typeText('currency-select-search-input', 'SOCKS\n', true);
    await Helpers.checkIfNotVisible(
      'currency-select-list-exchange-coin-row-ETH'
    );
  });

  it('Should reset Currency Select List on clearing search field', async () => {
    await Helpers.clearField('currency-select-search-input');
    await Helpers.checkIfVisible('currency-select-list-exchange-coin-row-ETH');
    if (device.getPlatform() === 'android') {
      await device.pressBack();
      await device.pressBack();
    } else {
      await Helpers.waitAndTap('currency-select-header-back-button');
    }
  });

  it('Should show Choose Token Button if input & output are same token(ETH)', async () => {
    await Helpers.waitAndTap('exchange-modal-input-selection-button');
    await Helpers.checkIfVisible('currency-select-list-exchange-coin-row-ETH');
    await Helpers.waitAndTap('currency-select-list-exchange-coin-row-ETH');
    await Helpers.waitAndTap('exchange-modal-output-selection-button');
    await Helpers.typeText('currency-select-search-input', 'ETH\n', false);
    await Helpers.waitAndTap('currency-select-list-exchange-coin-row-ETH');
    await Helpers.checkIfElementHasString(
      'exchange-modal-input-selection-button-text',
      'Choose Token'
    );
    if (device.getPlatform() === 'android') {
      await device.pressBack();
    } else {
      await Helpers.swipe('exchange-modal-header', 'down', 'slow');
    }
    await Helpers.waitAndTap('exchange-fab');
  });

  it('Should swap input & output and clear form on ETH -> ERC20 when selecting ETH as output', async () => {
    await Helpers.waitAndTap('exchange-modal-output-selection-button');
    await Helpers.typeText('currency-select-search-input', 'DAI\n', true);
    await Helpers.checkIfVisible('currency-select-list-exchange-coin-row-DAI');
    await Helpers.waitAndTap('currency-select-list-exchange-coin-row-DAI');
    await Helpers.waitAndTap('exchange-modal-output-selection-button');
    await Helpers.typeText('currency-select-search-input', 'ETH\n', true);
    await Helpers.waitAndTap('currency-select-list-exchange-coin-row-ETH');
    await Helpers.checkIfElementHasString(
      'exchange-modal-input-selection-button-text',
      'DAI'
    );
    await Helpers.checkIfElementHasString(
      'exchange-modal-output-selection-button-text',
      'ETH'
    );
    if (device.getPlatform() === 'android') {
      await device.pressBack();
    } else {
      await Helpers.swipe('exchange-modal-header', 'down', 'slow');
    }
    await Helpers.waitAndTap('exchange-fab');
  });

  it('Should swap input & output and clear form on ETH -> ERC20 when selecting ERC20 as input', async () => {
    await Helpers.waitAndTap('exchange-modal-output-selection-button');
    await Helpers.typeText('currency-select-search-input', 'DAI\n', true);
    await Helpers.checkIfVisible('currency-select-list-exchange-coin-row-DAI');
    await Helpers.waitAndTap('currency-select-list-exchange-coin-row-DAI');
    await Helpers.waitAndTap('exchange-modal-input-selection-button');
    await Helpers.waitAndTap('currency-select-list-exchange-coin-row-DAI');
    await Helpers.checkIfElementHasString(
      'exchange-modal-input-selection-button-text',
      'DAI'
    );
    await Helpers.checkIfElementHasString(
      'exchange-modal-output-selection-button-text',
      'ETH'
    );
  });

  it('Should display Enter an Amount Button once input & output currencies are selected', async () => {
    await Helpers.checkForElementByLabel('Enter an Amount');
  });

  it('Should update native input & output after input field change', async () => {
    if (device.getPlatform() === 'android') {
      await device.pressBack();
    } else {
      await Helpers.swipe('exchange-modal-header', 'down', 'slow');
    }
    await Helpers.waitAndTap('exchange-fab');
    await Helpers.waitAndTap('exchange-modal-output-selection-button');
    await Helpers.typeText('currency-select-search-input', 'ZRX\n', false);
    await Helpers.waitAndTap('currency-select-list-exchange-coin-row-ZRX');
    await Helpers.checkIfVisible('exchange-modal-input-native');
    await Helpers.checkIfVisible('exchange-modal-output');
    await Helpers.typeText('exchange-modal-input', '0.246\n', false);
    await Helpers.checkIfVisible('exchange-modal-input-0.246');
    await Helpers.checkIfNotVisible('exchange-modal-input-native');
    await Helpers.checkIfNotVisible('exchange-modal-output');
  });

  it('Should update input & output after native input field change', async () => {
    if (device.getPlatform() === 'android') {
      await device.pressBack();
    } else {
      await Helpers.swipe('exchange-modal-header', 'down', 'slow');
    }
    await Helpers.waitAndTap('exchange-fab');
    await Helpers.waitAndTap('exchange-modal-output-selection-button');
    await Helpers.typeText('currency-select-search-input', 'ZRX', false);
    await Helpers.waitAndTap('currency-select-list-exchange-coin-row-ZRX');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.checkIfVisible('exchange-modal-output');
    await Helpers.typeText('exchange-modal-input-native', '0.246', false);
    await Helpers.checkIfVisible('exchange-modal-input-native-0.24');
    await Helpers.checkIfNotVisible('exchange-modal-input');
    await Helpers.checkIfNotVisible('exchange-modal-output');
  });

  it('Should update input & native input after output field change', async () => {
    if (device.getPlatform() === 'android') {
      await device.pressBack();
    } else {
      await Helpers.swipe('exchange-modal-header', 'down', 'slow');
    }
    await Helpers.waitAndTap('exchange-fab');
    await Helpers.waitAndTap('exchange-modal-output-selection-button');
    await Helpers.typeText('currency-select-search-input', 'ZRX', false);
    await Helpers.waitAndTap('currency-select-list-exchange-coin-row-ZRX');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.checkIfVisible('exchange-modal-input-native');
    await Helpers.typeText('exchange-modal-output', '0.246', false);
    await Helpers.checkIfVisible('exchange-modal-output-0.246');
    await Helpers.checkIfNotVisible('exchange-modal-input');
    await Helpers.checkIfNotVisible('exchange-modal-input-native');
  });

  it('Should show Hold to Swap Button & Swap Info Button on completion of all input fields', async () => {
    await Helpers.checkIfVisible('exchange-modal-confirm-button');
    await Helpers.checkIfVisible('exchange-details-button');
  });

  it('Should show Swap Details State on Swap Info Button press', async () => {
    await Helpers.waitAndTap('exchange-details-button');
    await Helpers.checkIfVisible('swap-details-state');
    await Helpers.swipe('swap-details-state', 'down', 'slow');
  });

  it('Should show Insufficient Funds on input greater than balance', async () => {
    if (device.getPlatform() === 'android') {
      await device.pressBack();
    } else {
      await Helpers.swipe('exchange-modal-header', 'down', 'slow');
    }
    await Helpers.waitAndTap('exchange-fab');
    await Helpers.waitAndTap('exchange-modal-output-selection-button');
    await Helpers.typeText('currency-select-search-input', 'ZRX', false);
    await Helpers.waitAndTap('currency-select-list-exchange-coin-row-ZRX');
    await Helpers.typeText('exchange-modal-input', '500000000000', false);
    await Helpers.checkForElementByLabel('Insufficient Funds');
  });

  it('Should prepend 0. to input field on typing .', async () => {
    if (device.getPlatform() === 'android') {
      await device.pressBack();
    } else {
      await Helpers.swipe('exchange-modal-header', 'down', 'slow');
    }
    await Helpers.waitAndTap('exchange-fab');
    await Helpers.typeText('exchange-modal-input', '.', false);
    await Helpers.checkIfVisible('exchange-modal-input-0.');
  });

  it('Should prepend 0. to native input field on typing .', async () => {
    if (device.getPlatform() === 'android') {
      await device.pressBack();
    } else {
      await Helpers.swipe('exchange-modal-header', 'down', 'slow');
    }
    await Helpers.waitAndTap('exchange-fab');
    await Helpers.typeText('exchange-modal-input-native', '.', false);
    await Helpers.checkIfVisible('exchange-modal-input-native-0.');
  });

  it('Should prepend 0. to output field on typing .', async () => {
    await Helpers.waitAndTap('exchange-modal-output-selection-button');
    await Helpers.typeText('currency-select-search-input', 'ZRX', false);
    await Helpers.waitAndTap('currency-select-list-exchange-coin-row-ZRX');
    await Helpers.waitAndTap('exchange-modal-output');
    await Helpers.typeText('exchange-modal-output', '.', true);
    await Helpers.checkIfVisible('exchange-modal-output-0.');
  });

  it('Should display Gas Button on Normal by default', async () => {
    if (device.getPlatform() === 'android') {
      await device.pressBack();
    } else {
      await Helpers.swipe('exchange-modal-header', 'down', 'slow');
    }
    await Helpers.waitAndTap('exchange-fab');
    await Helpers.waitAndTap('exchange-modal-output-selection-button');
    await Helpers.typeText('currency-select-search-input', 'ZRX', false);
    await Helpers.waitAndTap('currency-select-list-exchange-coin-row-ZRX');
    await Helpers.checkIfVisible('exchange-modal-gas');
    await Helpers.checkIfElementByTextIsVisible('Normal');
  });

  it('Should display warning on invalid custom gas price', async () => {
    await Helpers.waitAndTap('gas-speed-custom');
    await Helpers.checkIfElementByTextIsVisible('Fast');
    await Helpers.checkIfElementByTextIsVisible('Custom');
    await Helpers.clearField('max-base-fee-input');
    await Helpers.typeText('max-base-fee-input', '\n', false);
    await Helpers.checkIfElementByTextIsVisible('Low · likely to fail');
  });

  it('Should rotate between Normal, Fast, Urgent, & Custom', async () => {
    await Helpers.waitAndTap('speed-pill-normal');
    await Helpers.waitAndTap('speed-pill-fast');
    await Helpers.waitAndTap('speed-pill-urgent');
    await Helpers.waitAndTap('speed-pill-custom');
  });

  xit('Should display warning on high custom base fee price', async () => {
    await Helpers.clearField('max-base-fee-input');
    await Helpers.typeText('max-base-fee-input', '9999\n', false);
    await Helpers.checkIfElementByTextToExist('High · overpaying');
    await Helpers.waitAndTap('speed-pill-normal');
  });

  xit('Should display alert on high custom base fee price', async () => {
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

  xit('Should display warning on high custom priority fee price', async () => {
    await Helpers.clearField('max-priority-fee-input');
    await Helpers.typeText('max-priority-fee-input', '999\n', false);
    await Helpers.checkIfElementByTextToExist('High · overpaying');
    await Helpers.waitAndTap('speed-pill-normal');
  });

  xit('Should display alert on high custom priority fee price', async () => {
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

  xit('Should display warning on low custom priority fee price', async () => {
    await Helpers.clearField('max-base-fee-input');
    await Helpers.typeText('max-base-fee-input', '200\n', false);
    await Helpers.clearField('max-priority-fee-input');
    await Helpers.typeText('max-priority-fee-input', '0.01\n', false);
    await Helpers.checkIfElementByTextToExist('Low · likely to fail');
  });

  xit('Should display alert on low custom priority fee price', async () => {
    await Helpers.swipe('custom-gas-header', 'down', 'slow');
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
    await exec('kill $(lsof -t -i:8545)');
  });
});
