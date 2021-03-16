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

  it('Should navigate to Discover screen after tapping Discover Button', async () => {
    await Helpers.delay(2000);
    await Helpers.tap('discover-button');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('top-movers-section');
    await Helpers.checkIfVisible('dpi-button');
    await Helpers.checkIfVisible('lists-section');
    await Helpers.checkIfVisible('pools-section');
  });

  it('Should show the camera if Discover is minimized', async () => {
    await Helpers.delay(1000);
    await Helpers.swipe('discover-header', 'down');
    await Helpers.delay(1000);
    await Helpers.tapAlertWithButton('OK');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('scanner-header');
    await Helpers.checkIfNotVisible('pools-section');
  });

  it('Should open Discover Search on pressing search fab', async () => {
    await Helpers.delay(1000);
    await Helpers.tap('search-fab');
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('done-button-text');
  });
  /*
  it('Should navigate to Discover screen after Dsicover Button', async () => {
    await Helpers.delay(1000);
  });

  it('Should navigate to Discover screen after Dsicover Button', async () => {
    await Helpers.delay(1000);
  });

  it('Should navigate to Discover screen after Dsicover Button', async () => {
    await Helpers.delay(1000);
  });

  it('Should navigate to Discover screen after Dsicover Button', async () => {
    await Helpers.delay(1000);
  });

  it('Should navigate to Discover screen after Dsicover Button', async () => {
    await Helpers.delay(1000);
  });

  it('Should navigate to Discover screen after Dsicover Button', async () => {
    await Helpers.delay(1000);
  });

  it('Should navigate to Discover screen after Dsicover Button', async () => {
    await Helpers.delay(1000);
  });

  it('Should navigate to Discover screen after Dsicover Button', async () => {
    await Helpers.delay(1000);
  });

  it('Should navigate to Discover screen after Dsicover Button', async () => {
    await Helpers.delay(1000);
  });

  it('Should navigate to Discover screen after Dsicover Button', async () => {
    await Helpers.delay(1000);
  });

  it('Should navigate to Discover screen after Dsicover Button', async () => {
    await Helpers.delay(1000);
  });

  it('Should navigate to Discover screen after Dsicover Button', async () => {
    await Helpers.delay(1000);
  });

  it('Should navigate to Discover screen after Dsicover Button', async () => {
    await Helpers.delay(1000);
  });

  it('Should navigate to Discover screen after Dsicover Button', async () => {
    await Helpers.delay(1000);
  });
  */
});
