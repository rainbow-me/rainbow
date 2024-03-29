import { device } from 'detox';
import {
  cleanApp,
  checkIfVisible,
  waitAndTap,
  checkIfExists,
  typeText,
  checkIfElementHasString,
  disableSynchronization,
  authenticatePin,
  enableSynchronization,
} from './helpers';

const android = device.getPlatform() === 'android';

describe('Import from private key flow', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
    await cleanApp();
  });
  afterAll(async () => {
    await device.clearKeychain();
  });
  it('without 0x - Should show the welcome screen', async () => {
    await checkIfVisible('welcome-screen');
  });

  it('without 0x - Should show the "Add Wallet Sheet" after tapping on "I already have a wallet"', async () => {
    await waitAndTap('already-have-wallet-button');
    await checkIfExists('add-wallet-sheet');
  });

  it('without 0x - Show the "Import Sheet" when tapping on "Restore with a recovery phrase or private key"', async () => {
    await waitAndTap('restore-with-key-button');
    await checkIfExists('import-sheet');
  });

  it('without 0x - Should show the "Add wallet modal" after tapping import with a valid private key"', async () => {
    process.env.DEV_PKEY && (await typeText('import-sheet-input', process.env.DEV_PKEY.substring(2), false));
    await checkIfElementHasString('import-sheet-button-label', 'Continue');
    await waitAndTap('import-sheet-button');
    await checkIfVisible('wallet-info-modal');
  });

  it('without 0x - Should navigate to the Wallet screen after tapping on "Import Wallet"', async () => {
    await disableSynchronization();
    await checkIfVisible('wallet-info-input');
    await typeText('wallet-info-input', 'TKEY', false);
    await waitAndTap('wallet-info-submit-button');
    if (android) {
      await checkIfVisible('pin-authentication-screen');
      await authenticatePin('1234');
      await authenticatePin('1234');
    }
    await checkIfVisible('wallet-screen', 40000);
    await enableSynchronization();
  });
});
