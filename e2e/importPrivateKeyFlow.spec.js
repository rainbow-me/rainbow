/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

const android = device.getPlatform() === 'android';

describe('Import from private key flow', () => {
  it('without 0x - Should show the welcome screen', async () => {
    await Helpers.checkIfVisible('welcome-screen');
  });

  it('without 0x - Should show the "Add Wallet Sheet" after tapping on "I already have a wallet"', async () => {
    await Helpers.waitAndTap('already-have-wallet-button');
    await Helpers.checkIfExists('add-wallet-sheet');
  });

  it('without 0x - Show the "Import Sheet" when tapping on "Restore with a recovery phrase or private key"', async () => {
    await Helpers.waitAndTap('restore-with-key-button');
    await Helpers.checkIfExists('import-sheet');
  });

  it('without 0x - Should show the "Add wallet modal" after tapping import with a valid private key"', async () => {
    await Helpers.typeText(
      'import-sheet-input',
      process.env.DEV_PKEY.substring(2),
      false
    );
    await Helpers.checkIfElementHasString(
      'import-sheet-button-label',
      'Continue'
    );
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.checkIfVisible('wallet-info-modal');
  });

  it('without 0x - Should navigate to the Wallet screen after tapping on "Import Wallet"', async () => {
    await Helpers.disableSynchronization();
    await Helpers.checkIfVisible('wallet-info-input');
    await Helpers.typeText('wallet-info-input', 'TKEY', false);
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

  // Saving for now in case we want to test iCloud back up sheet
  // it('Should show the backup sheet', async () => {
  //   await Helpers.checkIfVisible('backup-sheet');
  //   await Helpers.waitAndTap('backup-sheet-imported-cancel-button');
  // });

  it('without 0x - Should say "TKEY" in the Profile Screen header', async () => {
    await Helpers.swipe('wallet-screen', 'right');
    await Helpers.checkIfExistsByText('TKEY');
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
  });
});
