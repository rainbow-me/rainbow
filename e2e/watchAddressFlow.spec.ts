import { device } from 'detox';
import { cleanApp, checkIfVisible, waitAndTap, checkIfExists, clearField, typeText, checkIfElementHasString } from './helpers';

describe('Watch address flow', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
    await cleanApp();
  });
  afterAll(async () => {
    await device.clearKeychain();
  });

  it('Should show the welcome screen', async () => {
    await checkIfVisible('welcome-screen');
  });

  it('with 0x - Should show the "Add Wallet Sheet" after tapping on "I already have a wallet"', async () => {
    await waitAndTap('already-have-wallet-button');
    await checkIfExists('add-wallet-sheet');
  });

  it('show the "Import Sheet" when tapping on "Watch an Ethereum address"', async () => {
    await waitAndTap('watch-address-button');
    await checkIfExists('import-sheet');
  });

  it('Should show the "Add wallet modal" after tapping import with a valid address', async () => {
    await clearField('import-sheet-input');
    await typeText('import-sheet-input', 'test.eth', false);
    await checkIfElementHasString('import-sheet-button-label', 'Continue');
    await waitAndTap('import-sheet-button');
    await checkIfVisible('wallet-info-modal');
  });

  it('Should navigate to the Wallet screen after tapping on "Import Wallet"', async () => {
    await waitAndTap('wallet-info-submit-button');
    await checkIfVisible('wallet-screen');
  });
});
