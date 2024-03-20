import * as Helpers from './helpers';
import { device } from 'detox';

const android = device.getPlatform() === 'android';

describe('Import from private key flow', () => {
  afterAll(async () => {
    await device.clearKeychain();
  });
  it('with 0x - Should show the welcome screen', async () => {
    await Helpers.checkIfVisible('welcome-screen');
  });

  it('with 0x - Should show the "Add Wallet Sheet" after tapping on "I already have a wallet"', async () => {
    await Helpers.waitAndTap('already-have-wallet-button');
    await Helpers.checkIfExists('add-wallet-sheet');
  });

  it('with 0x - Show the "Import Sheet" when tapping on "Restore with a recovery phrase or private key"', async () => {
    await Helpers.waitAndTap('restore-with-key-button');
    await Helpers.checkIfExists('import-sheet');
  });

  it('with 0x - Should show the "Add wallet modal" after tapping import with a valid private key"', async () => {
    await Helpers.typeText('import-sheet-input', process.env.DEV_PKEY, false);
    await Helpers.checkIfElementHasString('import-sheet-button-label', 'Continue');
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.checkIfVisible('wallet-info-modal');
  });

  it('with 0x - Should navigate to the Wallet screen after tapping on "Import Wallet"', async () => {
    await Helpers.disableSynchronization();
    await Helpers.checkIfVisible('wallet-info-input');
    await Helpers.typeText('wallet-info-input', 'PKEY', false);
    await Helpers.waitAndTap('wallet-info-submit-button');
    if (android) {
      await Helpers.checkIfVisible('pin-authentication-screen');
      await Helpers.authenticatePin('1234');
      await Helpers.authenticatePin('1234');
    }
    await Helpers.checkIfVisible('wallet-screen', 40000);
    await Helpers.enableSynchronization();
  });
});
