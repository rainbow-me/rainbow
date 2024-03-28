import { device } from 'detox';
import {
  beforeAllcleanApp,
  checkIfVisible,
  waitAndTap,
  checkIfExists,
  typeText,
  checkIfElementHasString,
  authenticatePin,
  delayTime,
  afterAllcleanApp,
} from './helpers';
import { WALLET_VARS } from './testVariables';

const android = device.getPlatform() === 'android';

describe('Import from private key flow', () => {
  beforeAll(async () => {
    await beforeAllcleanApp({ hardhat: false });
  });
  afterAll(async () => {
    await afterAllcleanApp({ hardhat: false });
  });
  it('with 0x - Should show the welcome screen', async () => {
    await checkIfVisible('welcome-screen');
  });

  it('with 0x - Should show the "Add Wallet Sheet" after tapping on "I already have a wallet"', async () => {
    await waitAndTap('already-have-wallet-button');
    await checkIfExists('add-wallet-sheet');
  });

  it('with 0x - Show the "Import Sheet" when tapping on "Restore with a recovery phrase or private key"', async () => {
    await waitAndTap('restore-with-key-button');
    await checkIfExists('import-sheet');
  });

  it('with 0x - Should show the "Add wallet modal" after tapping import with a valid private key"', async () => {
    await typeText('import-sheet-input', process.env.DEV_PKEY);
    await checkIfElementHasString('import-sheet-button-label', 'Continue');
    await waitAndTap('import-sheet-button');
    await checkIfVisible('wallet-info-modal');
  });

  it('with 0x - Should navigate to the Wallet screen after tapping on "Import Wallet"', async () => {
    await checkIfVisible('wallet-info-input');
    await typeText('wallet-info-input', 'PKEY');
    await delayTime('medium');
    await waitAndTap('wallet-info-submit-button');
    if (android) {
      await checkIfVisible('pin-authentication-screen');
      await authenticatePin('1234');
      await authenticatePin('1234');
    }
    await checkIfVisible('wallet-screen');
  });

  it('open wallet switcher and then open import sheet', async () => {
    await waitAndTap('profile-name-PKEY');
    await waitAndTap('add-another-wallet-button');
  });

  it('without 0x - Show the "Import Sheet" when tapping on "Restore with a recovery phrase or private key"', async () => {
    await waitAndTap('restore-with-key-button');
    await checkIfExists('import-sheet');
  });

  it('without 0x - Should show the "Add wallet modal" after tapping import with a valid private key"', async () => {
    await typeText('import-sheet-input', WALLET_VARS.SEED_WALLET.PK.substring(2));
    await checkIfElementHasString('import-sheet-button-label', 'Continue');
    await waitAndTap('import-sheet-button');
    await checkIfVisible('wallet-info-modal');
  });

  it('without 0x - Should navigate to the Wallet screen after tapping on "Import Wallet"', async () => {
    await checkIfVisible('wallet-info-input');
    await typeText('wallet-info-input', 'PKEY2');
    await delayTime('medium');
    await waitAndTap('wallet-info-submit-button');
    await checkIfVisible('wallet-screen');
  });

  it('open wallet switcher and then open import sheet again', async () => {
    await waitAndTap('profile-name-PKEY2');
    await waitAndTap('add-another-wallet-button');
  });

  it('show the "Import Sheet" when tapping on "Watch an Ethereum address"', async () => {
    await waitAndTap('watch-address-button');
    await checkIfExists('import-sheet');
  });

  it('Should show the "Add wallet modal" after tapping import with a valid address', async () => {
    await typeText('import-sheet-input', 'test.eth');
    await checkIfElementHasString('import-sheet-button-label', 'Continue');
    await waitAndTap('import-sheet-button');
    await checkIfVisible('wallet-info-modal');
  });

  it('Should navigate to the Wallet screen after tapping on "Import Wallet"', async () => {
    await waitAndTap('wallet-info-submit-button');
    await checkIfVisible('wallet-screen');
  });

  it('open be able to open the wallet switcher', async () => {
    await waitAndTap('profile-name-test.eth');
    await waitAndTap('add-another-wallet-button');
  });
});
