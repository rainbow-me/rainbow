/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

describe('Import from private key flow', () => {
  it('with 0x - Should show the welcome screen', async () => {
    await Helpers.checkIfVisible('welcome-screen');
  });

  it('with 0x - Should show the "Restore Sheet" after tapping on "I already have a wallet"', async () => {
    await Helpers.disableSynchronization();
    await Helpers.tap('already-have-wallet-button');
    await Helpers.delay(2000);
    await Helpers.checkIfExists('restore-sheet');
  });

  it('with 0x - Show the "Import Sheet" when tapping on "Restore with a recovery phrase or private key"', async () => {
    await Helpers.tap('restore-with-key-button');
    await Helpers.delay(2000);
    await Helpers.checkIfExists('import-sheet');
  });

  it('with 0x - Should show the "Add wallet modal" after tapping import with a valid private key"', async () => {
    await Helpers.typeText('import-sheet-input', process.env.DEV_PKEY, false);
    await Helpers.delay(1000);
    await Helpers.checkIfElementHasString(
      'import-sheet-button-label',
      'Import'
    );
    await Helpers.tap('import-sheet-button');
    await Helpers.checkIfVisible('wallet-info-modal');
  });

  it('with 0x - Should navigate to the Wallet screen after tapping on "Import Wallet"', async () => {
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('wallet-info-input');
    await Helpers.typeText('wallet-info-input', 'PKEY', false);
    await Helpers.tap('wallet-info-submit-button');
    if (device.getPlatform() === 'android') {
      await Helpers.checkIfVisible('pin-authentication-screen');
      // Set the pin
      await Helpers.authenticatePin('1234');
      // Confirm it
      await Helpers.authenticatePin('1234');
    }
    await Helpers.delay(4000);
    await Helpers.checkIfVisible('wallet-screen');
  });

  // Saving for now in case we want to test iCloud back up sheet
  // it('Should show the backup sheet', async () => {
  //   await Helpers.delay(3000);
  //   await Helpers.checkIfVisible('backup-sheet');
  //   await Helpers.tap('backup-sheet-imported-cancel-button');
  // });

  it('with 0x - Should say "PKEY" in the Profile Screen header', async () => {
    await Helpers.delay(1000);
    await Helpers.swipe('wallet-screen', 'right');
    await Helpers.delay(2000);
    if (device.getPlatform() === 'android') {
      await Helpers.checkIfExistsByText('PKEY');
    } else {
      await Helpers.checkIfElementByTextIsVisible('PKEY');
    }
  });

  it('Should navigate to Settings Modal after tapping Settings Button', async () => {
    await Helpers.tap('settings-button');
    await Helpers.delay(3000);
    await Helpers.checkIfVisible('settings-modal');
  });

  it('Should navigate to Developer Settings after tapping Developer Section', async () => {
    await Helpers.tap('developer-section');
    await Helpers.delay(3000);
    await Helpers.checkIfVisible('developer-settings-modal');
  });

  it('Should reset keychain & reopen app', async () => {
    await Helpers.tap('reset-keychain-section');
    await device.launchApp({ newInstance: true });
    await Helpers.disableSynchronization();
    await Helpers.delay(5000);
    await Helpers.checkIfVisible('welcome-screen');
  });

  it('without 0x - Should show the "Restore Sheet" after tapping on "I already have a wallet"', async () => {
    await Helpers.tap('already-have-wallet-button');
    await Helpers.delay(2000);
    await Helpers.checkIfExists('restore-sheet');
  });

  it('without 0x - Show the "Import Sheet" when tapping on "Restore with a recovery phrase or private key"', async () => {
    await Helpers.tap('restore-with-key-button');
    await Helpers.delay(2000);
    await Helpers.checkIfExists('import-sheet');
  });

  it('without 0x - Should show the "Add wallet modal" after tapping import with a valid private key"', async () => {
    await Helpers.typeText(
      'import-sheet-input',
      process.env.DEV_PKEY.substring(2),
      false
    );
    await Helpers.delay(1000);
    await Helpers.checkIfElementHasString(
      'import-sheet-button-label',
      'Import'
    );
    await Helpers.tap('import-sheet-button');
    await Helpers.checkIfVisible('wallet-info-modal');
  });

  it('without 0x - Should navigate to the Wallet screen after tapping on "Import Wallet"', async () => {
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('wallet-info-input');
    await Helpers.typeText('wallet-info-input', 'TKEY', false);
    await Helpers.tap('wallet-info-submit-button');
    if (device.getPlatform() === 'android') {
      await Helpers.checkIfVisible('pin-authentication-screen');
      // Set the pin
      await Helpers.authenticatePin('1234');
      // Confirm it
      await Helpers.authenticatePin('1234');
    }
    await Helpers.delay(4000);
    await Helpers.checkIfVisible('wallet-screen');
  });

  // Saving for now in case we want to test iCloud back up sheet
  // it('Should show the backup sheet', async () => {
  //   await Helpers.delay(3000);
  //   await Helpers.checkIfVisible('backup-sheet');
  //   await Helpers.tap('backup-sheet-imported-cancel-button');
  // });

  it('without 0x - Should say "TKEY" in the Profile Screen header', async () => {
    await Helpers.delay(1000);
    await Helpers.swipe('wallet-screen', 'right');
    await Helpers.delay(2000);
    if (device.getPlatform() === 'android') {
      await Helpers.checkIfExistsByText('TKEY');
    } else {
      await Helpers.checkIfElementByTextIsVisible('TKEY');
    }
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
  });
});
