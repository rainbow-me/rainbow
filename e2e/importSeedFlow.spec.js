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

  it("Shouldn't do anything when I type jibberish", async () => {
    await Helpers.tap('import-sheet-input');
    await Helpers.checkIfHasText('import-sheet-button-label', 'Paste');
    await Helpers.typeText('import-sheet-input', 'asdajksdlakjsd', false);
    await Helpers.checkIfHasText('import-sheet-button-label', 'Import');
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

  // it('Should show the backup sheet', async () => {
  //   await Helpers.delay(3000);
  //   await Helpers.checkIfVisible('backup-sheet');
  //   await Helpers.tap('backup-sheet-imported-cancel-button');
  // });

  it('Should say "poopcoin.eth" in the Profile Screen header', async () => {
    await Helpers.delay(1000);
    await Helpers.swipe('wallet-screen', 'right');
    await Helpers.delay(2000);
    await Helpers.checkIfElementByTextIsVisible('poopcoin.eth');
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
  });
});
