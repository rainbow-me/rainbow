/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

describe('Import from seed flow', () => {
  it('Should show the welcome screen', async () => {
    await device.disableSynchronization();
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
    await Helpers.typeText('import-sheet-input', process.env.DEV_SEEDS, false);
    await Helpers.delay(1500);
    await Helpers.checkIfHasText('import-sheet-button-label', 'Import');
    await Helpers.tap('import-sheet-button');
    await Helpers.checkIfVisible('wallet-info-modal');
  });

  it('Should navigate to the Wallet screen after tapping on "Import Wallet"', async () => {
    await Helpers.delay(1000);
    await Helpers.tap('wallet-info-submit-button');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('wallet-screen');
  });

  it('Should show all wallet sections', async () => {
    await Helpers.delay(1000);
    await Helpers.checkIfElementByTextIsVisible('Investments');
    await Helpers.swipe('wallet-screen', 'up');
    await Helpers.checkIfElementByTextIsVisible('Collectibles');
  });

  it('Should display swap modal on swap-fab press', async () => {
    await Helpers.delay(5000);
    await Helpers.checkIfVisible('wallet-screen');
    await Helpers.tap('exchange-fab');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('exchange-modal-container');
    //await Helpers.checkIfElementByTextIsVisible('Swap');
  });

  it('Should focus on Asset Input on load', async () => {
    await Helpers.delay(500);
    await Helpers.typeText('exchange-modal-input-field', '1.356', true);
    await Helpers.checkIfElementByTextIsVisible('1.356');
  });

  it('Should display enabled Choose a Coin Button', async () => {
    await Helpers.delay(500);
    await Helpers.checkIfVisible(
      'exchange-modal-output-field-selection-button'
    );
    //await Helpers.checkIfElementByTextIsVisible('1.356');
  });

  it('Should update input value after tapping Max Button', async () => {
    await Helpers.delay(1000);
    await Helpers.tap('exchange-modal-input-field-max');
    //Need to add helper function
  });

  it('Should display Swap Asset List after tapping Input Section Button', async () => {
    await Helpers.delay(1000);
    await Helpers.tap('exchange-modal-input-field-selection-button');
    await Helpers.delay(3000);
    await Helpers.checkIfVisible('currency-select-list');
    await Helpers.tap('currency-select-header-back-button');

    //await Helpers.checkIfElementByTextIsVisible('1.356');
  });

  it('Should display Swap Asset List after tapping Choose a Coin', async () => {
    await Helpers.delay(1000);
    await Helpers.tap('exchange-modal-output-field-selection-button');
    await Helpers.delay(3000);
    await Helpers.tap('currency-select-header-back-button');
    //await Helpers.checkIfElementByTextIsVisible('1.356');
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
  });
});
