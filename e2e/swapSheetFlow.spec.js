/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

describe('Swap Sheet Interaction Flow', () => {
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
    await Helpers.delay(1500);
    await Helpers.checkIfElementHasString(
      'import-sheet-button-label',
      'Import'
    );
    await Helpers.tap('import-sheet-button');
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

  it('Should display swap modal on swap-fab press', async () => {
    await Helpers.delay(5000);
    await Helpers.checkIfVisible('wallet-screen');
    await Helpers.tap('exchange-fab');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('exchange-modal-container');
  });

  it('Should focus on Asset Input on load', async () => {
    await Helpers.delay(1000);
    await Helpers.typeText('exchange-modal-input', '0.246\n', true);
    await Helpers.checkIfVisible('exchange-modal-input-0.246');
  });

  it('Should display enabled Choose Token Button for output token selection', async () => {
    await Helpers.delay(500);
    await Helpers.checkIfElementHasString(
      'exchange-modal-output-selection-button-text',
      'Choose Token'
    );
  });

  it('Should update input value after tapping Max Button', async () => {
    await Helpers.delay(1000);
    if (device.getPlatform() === 'android') {
      await device.pressBack();
    } else {
      await Helpers.swipe('exchange-modal-header', 'down', 'slow');
    }
    await Helpers.delay(1000);
    await Helpers.tap('exchange-fab');
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.delay(1000);
    await Helpers.tap('exchange-modal-input-max');
    await Helpers.delay(1000);
    await Helpers.checkIfNotVisible('exchange-modal-input');
  });

  it('Should display Swap Asset List after tapping Input Section Button', async () => {
    await Helpers.delay(1000);
    await Helpers.tap('exchange-modal-input-selection-button');
    await Helpers.delay(3000);
    await Helpers.checkIfVisible('currency-select-list');
    if (device.getPlatform() === 'android') {
      await device.pressBack();
      await device.pressBack();
    } else {
      await Helpers.tap('currency-select-header-back-button');
    }
  });

  it('Should reset all fields on selection of new input currency', async () => {
    await Helpers.delay(2000);
    await Helpers.tap('exchange-modal-input-selection-button');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.delay(2000);
    await Helpers.tap('exchange-coin-row-DAI');
    await Helpers.delay(1000);
  });

  it('Should display Receive Currency Select List after tapping Choose Token', async () => {
    await Helpers.delay(1000);
    //this where it gets stuck, with all the assets loading I imagine
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.delay(3000);
    await Helpers.checkIfVisible('currency-select-list');
    if (device.getPlatform() === 'android') {
      await device.pressBack();
      await device.pressBack();
    } else {
      await Helpers.tap('currency-select-header-back-button');
    }
  });

  it('Should change Currency Select List on search entry', async () => {
    await Helpers.delay(3000);
    await Helpers.tap('exchange-modal-input-selection-button');
    await Helpers.delay(8000);
    await Helpers.typeText('currency-select-search-input', 'SOCKS\n', true);
    await Helpers.delay(5000);
    await Helpers.checkIfNotVisible('exchange-coin-row-ETH');
  });

  it('Should reset Currency Select List on clearing search field', async () => {
    await Helpers.delay(2000);
    await Helpers.clearField('currency-select-search-input');
    await Helpers.delay(5000);
    await Helpers.checkIfVisible('exchange-coin-row-ETH');
    if (device.getPlatform() === 'android') {
      await device.pressBack();
      await device.pressBack();
    } else {
      await Helpers.tap('currency-select-header-back-button');
    }
    await Helpers.delay(2000);
  });

  it('Should show Choose Token Button if input & output are same token(ETH)', async () => {
    await Helpers.tap('exchange-modal-input-selection-button');
    await Helpers.delay(20000);
    await Helpers.checkIfVisible('exchange-coin-row-ETH');
    await Helpers.tap('exchange-coin-row-ETH');
    await Helpers.delay(2000);
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.delay(2000);
    await Helpers.typeText('currency-select-search-input', 'ETH\n', false);
    await Helpers.delay(5000);
    await Helpers.tap('exchange-coin-row-ETH');
    await Helpers.delay(3000);
    await Helpers.checkIfElementHasString(
      'exchange-modal-input-selection-button-text',
      'Choose Token'
    );
    await Helpers.delay(1000);
    if (device.getPlatform() === 'android') {
      await device.pressBack();
    } else {
      await Helpers.swipe('exchange-modal-header', 'down', 'slow');
    }
    await Helpers.delay(1000);
    await Helpers.tap('exchange-fab');
  });

  it('Should swap input & output and clear form on ETH -> ERC20 when selecting ETH as output', async () => {
    await Helpers.delay(2000);
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.delay(2000);
    await Helpers.typeText('currency-select-search-input', 'DAI\n', true);
    await Helpers.delay(5000);
    await Helpers.checkIfVisible('exchange-coin-row-DAI');
    await Helpers.tap('exchange-coin-row-DAI');
    await Helpers.delay(2000);
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.delay(2000);
    await Helpers.typeText('currency-select-search-input', 'ETH\n', true);
    await Helpers.delay(5000);
    await Helpers.tap('exchange-coin-row-ETH');
    await Helpers.delay(2000);
    await Helpers.checkIfElementHasString(
      'exchange-modal-input-selection-button-text',
      'DAI'
    );
    await Helpers.checkIfElementHasString(
      'exchange-modal-output-selection-button-text',
      'ETH'
    );
    await Helpers.delay(1000);
    if (device.getPlatform() === 'android') {
      await device.pressBack();
    } else {
      await Helpers.swipe('exchange-modal-header', 'down', 'slow');
    }
    await Helpers.delay(2000);
    await Helpers.tap('exchange-fab');
  });

  it('Should swap input & output and clear form on ETH -> ERC20 when selecting ERC20 as input', async () => {
    await Helpers.delay(2000);
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.delay(2000);
    await Helpers.typeText('currency-select-search-input', 'DAI\n', true);
    await Helpers.delay(5000);
    await Helpers.checkIfVisible('exchange-coin-row-DAI');
    await Helpers.tap('exchange-coin-row-DAI');
    await Helpers.delay(2000);
    await Helpers.tap('exchange-modal-input-selection-button');
    await Helpers.delay(2000);
    await Helpers.tap('exchange-coin-row-DAI');
    await Helpers.delay(2000);
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
    await Helpers.delay(1000);
    if (device.getPlatform() === 'android') {
      await device.pressBack();
    } else {
      await Helpers.swipe('exchange-modal-header', 'down', 'slow');
    }
    await Helpers.delay(2000);
    await Helpers.tap('exchange-fab');
    await Helpers.delay(2000);
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.delay(2000);
    await Helpers.typeText('currency-select-search-input', 'ZRX\n', false);
    await Helpers.delay(2000);
    await Helpers.tap('exchange-coin-row-ZRX');
    await Helpers.delay(5000);
    await Helpers.checkIfVisible('exchange-modal-input-native');
    await Helpers.checkIfVisible('exchange-modal-output');
    await Helpers.delay(2500);
    await Helpers.typeText('exchange-modal-input', '0.246\n', false);
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('exchange-modal-input-0.246');
    await Helpers.checkIfNotVisible('exchange-modal-input-native');
    await Helpers.checkIfNotVisible('exchange-modal-output');
    await Helpers.delay(2000);
  });

  it('Should update input & output after native input field change', async () => {
    if (device.getPlatform() === 'android') {
      await device.pressBack();
    } else {
      await Helpers.swipe('exchange-modal-header', 'down', 'slow');
    }
    await Helpers.delay(2000);
    await Helpers.tap('exchange-fab');
    await Helpers.delay(2000);
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.delay(2000);
    await Helpers.typeText('currency-select-search-input', 'ZRX', false);
    await Helpers.delay(5000);
    await Helpers.tap('exchange-coin-row-ZRX');
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.checkIfVisible('exchange-modal-output');
    await Helpers.delay(2000);
    await Helpers.typeText('exchange-modal-input-native', '0.246', false);
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('exchange-modal-input-native-0.24');
    await Helpers.checkIfNotVisible('exchange-modal-input');
    await Helpers.checkIfNotVisible('exchange-modal-output');
    await Helpers.delay(2000);
  });

  it('Should update input & native input after output field change', async () => {
    if (device.getPlatform() === 'android') {
      await device.pressBack();
    } else {
      await Helpers.swipe('exchange-modal-header', 'down', 'slow');
    }
    await Helpers.delay(2000);
    await Helpers.tap('exchange-fab');
    await Helpers.delay(2000);
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.delay(2000);
    await Helpers.typeText('currency-select-search-input', 'ZRX', false);
    await Helpers.delay(5000);
    await Helpers.tap('exchange-coin-row-ZRX');
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('exchange-modal-input');
    await Helpers.checkIfVisible('exchange-modal-input-native');
    await Helpers.delay(2000);
    await Helpers.typeText('exchange-modal-output', '0.246', false);
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('exchange-modal-output-0.246');
    await Helpers.checkIfNotVisible('exchange-modal-input');
    await Helpers.checkIfNotVisible('exchange-modal-input-native');
    await Helpers.delay(1000);
  });

  it('Should show Hold to Swap Button & Swap Info Button on completion of all input fields', async () => {
    await Helpers.checkForElementByLabel('Hold to Swap');
    await Helpers.checkIfVisible('swap-info-button');
  });

  it('Should show Swap Details State on Swap Info Button press', async () => {
    await Helpers.tap('swap-info-button');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('swap-details-state-container');
    await Helpers.swipe('swap-details-state-container', 'down', 'slow');
  });

  it('Should show Insufficient Funds on input greater than balance', async () => {
    await Helpers.delay(1000);
    if (device.getPlatform() === 'android') {
      await device.pressBack();
    } else {
      await Helpers.swipe('exchange-modal-header', 'down', 'slow');
    }
    await Helpers.delay(1000);
    await Helpers.tap('exchange-fab');
    await Helpers.delay(2000);
    await Helpers.typeText('exchange-modal-input', '0.546', false);
    await Helpers.delay(2000);
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.delay(2000);
    await Helpers.typeText('currency-select-search-input', 'ZRX', false);
    await Helpers.delay(5000);
    await Helpers.tap('exchange-coin-row-ZRX');
    await Helpers.delay(2000);
    await Helpers.checkForElementByLabel('Insufficient Funds');
  });

  it('Should prepend 0. to input field on typing .', async () => {
    await Helpers.delay(1000);
    if (device.getPlatform() === 'android') {
      await device.pressBack();
    } else {
      await Helpers.swipe('exchange-modal-header', 'down', 'slow');
    }
    await Helpers.delay(1000);
    await Helpers.tap('exchange-fab');
    await Helpers.delay(2000);
    await Helpers.typeText('exchange-modal-input', '.', false);
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('exchange-modal-input-0.');
  });

  it('Should prepend 0. to native input field on typing .', async () => {
    await Helpers.typeText('exchange-modal-input-native', '.', false);
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('exchange-modal-input-native-0.');
  });

  it('Should prepend 0. to output field on typing .', async () => {
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.delay(2000);
    await Helpers.typeText('currency-select-search-input', 'ZRX', false);
    await Helpers.delay(5000);
    await Helpers.tap('exchange-coin-row-ZRX');
    await Helpers.delay(2000);
    await Helpers.tap('exchange-modal-output');
    await Helpers.typeText('exchange-modal-output', '.', true);
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('exchange-modal-output-0.');
    await Helpers.delay(1000);
  });

  it('Should display Gas Button on Normal by default', async () => {
    if (device.getPlatform() === 'android') {
      await device.pressBack();
    } else {
      await Helpers.swipe('exchange-modal-header', 'down', 'slow');
    }
    await Helpers.delay(2000);
    await Helpers.tap('exchange-fab');
    await Helpers.delay(2000);
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.delay(2000);
    await Helpers.typeText('currency-select-search-input', 'ZRX', false);
    await Helpers.delay(5000);
    await Helpers.tap('exchange-coin-row-ZRX');
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('exchange-modal-gas');
    await Helpers.checkIfElementByTextIsVisible('Normal');
    await Helpers.delay(1000);
  });

  it('Should display warning on invalid custom gas price', async () => {
    await Helpers.tap('exchange-modal-gas');
    await Helpers.delay(1000);
    await Helpers.checkIfElementByTextIsVisible('Fast');
    await Helpers.tap('exchange-modal-gas');
    await Helpers.delay(1000);
    await Helpers.checkIfElementByTextIsVisible('Custom');
    await Helpers.tap('custom-gas-edit-button');
    await Helpers.clearField('custom-gas-input');
    await Helpers.delay(3000);
    await Helpers.typeText('custom-gas-input', '0\n', true);
    await Helpers.delay(3000);
    await Helpers.checkIfElementByTextIsVisible('Invalid Gas Price');
    await Helpers.delay(1000);
    await Helpers.tapAlertWithButton('OK');
    await Helpers.delay(2000);
  });

  it('Should display warning on high custom gas price', async () => {
    await Helpers.typeText('custom-gas-input', '9999\n', true);
    await Helpers.delay(3000);
    await Helpers.checkIfElementByTextIsVisible('High gas price!');
    await Helpers.tapAlertWithButton('Proceed Anyway');
    await Helpers.delay(2000);
  });

  it('Should display warning on low custom gas price', async () => {
    await Helpers.tap('custom-gas-edit-button');
    await Helpers.clearField('custom-gas-input');
    await Helpers.delay(3000);
    await Helpers.typeText('custom-gas-input', '1\n', true);
    await Helpers.delay(3000);
    await Helpers.checkIfElementByTextIsVisible(
      'Low gas price–transaction might get stuck!'
    );
    await Helpers.tapAlertWithButton('Proceed Anyway');
    await Helpers.delay(3000);
  });

  it('Should rotate between Slow, Normal, Fast, & Custom when Gas Button is Pressed', async () => {
    await Helpers.tap('exchange-modal-gas');
    await Helpers.delay(1000);
    await Helpers.checkIfElementByTextIsVisible('Slow');
    await Helpers.tap('exchange-modal-gas');
    await Helpers.delay(1000);
    await Helpers.checkIfElementByTextIsVisible('Normal');
    await Helpers.delay(1000);
    await Helpers.tap('exchange-modal-gas');
    await Helpers.delay(1000);
    await Helpers.checkIfElementByTextIsVisible('Fast');
    await Helpers.tap('exchange-modal-gas');
    await Helpers.delay(1000);
    await Helpers.checkIfElementByTextIsVisible('Custom');
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
  });
});
