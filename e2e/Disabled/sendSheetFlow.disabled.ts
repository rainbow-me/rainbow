import { device } from 'detox';
import {
  startHardhat,
  killHardhat,
  importWalletFlow,
  sendETHtoTestWallet,
  waitAndTap,
  checkIfVisible,
  checkIfElementByTextIsVisible,
  typeText,
  checkIfNotVisible,
  clearField,
  replaceTextInField,
} from '../helpers';

describe.skip('Send Sheet Interaction Flow', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
    await startHardhat();
  });
  afterAll(async () => {
    await device.clearKeychain();
    await killHardhat();
  });

  it('Import a wallet and go to welcome', async () => {
    await importWalletFlow();
  });

  it('Should send ETH to test wallet"', async () => {
    await sendETHtoTestWallet();
  });

  it('Should show Hardhat Toast after pressing Connect To Hardhat', async () => {
    await waitAndTap('dev-button-hardhat');
    await checkIfVisible('testnet-toast-Hardhat');
  });

  it('Should open send sheet after tapping send button', async () => {
    await waitAndTap('send-button');
    await checkIfVisible('send-asset-form-field');
  });

  it('Should do nothing on typing jibberish send address', async () => {
    await typeText('send-asset-form-field', 'gvuabefhiwdnomks', false);
    await checkIfNotVisible('send-asset-ETH-mainnet');
  });

  // FIXME: typing in address in sim has a glitch where the asset-list doesn't
  //        populate
  //
  //        SKIPPING all tests after this one, as the app is in the wrong state
  it('Should show show Contact Button & Asset List on valid public address', async () => {
    await clearField('send-asset-form-field');
    await checkIfVisible('send-asset-form-field');
    await replaceTextInField('send-asset-form-field', '0xF0f21ab2012731542731df194cfF6c77d29cB31A');
    await checkIfVisible('send-asset-list', 20000);
  });

  it('Should show show Contact Button & Asset List on valid ENS & Unstoppable addresses', async () => {
    await clearField('send-asset-form-field');
    await checkIfVisible('send-asset-form-field');
    await typeText('send-asset-form-field', 'neverselling.wallet\n', false);
    await checkIfVisible('send-asset-list');
    await clearField('send-asset-form-field');
    await device.disableSynchronization();
    await typeText('send-asset-form-field', 'rainbowwallet.eth\n', false);
    await device.enableSynchronization();
    await checkIfVisible('send-asset-list');
  });

  it('Should display Asset Form after tapping on asset', async () => {
    await checkIfVisible('send-asset-DAI-mainnet');
    await waitAndTap('send-asset-DAI-mainnet');
    await checkIfVisible('selected-asset-field-input');
  });

  it('Should display max button on asset input focus', async () => {
    await checkIfVisible('selected-asset-field-input');
    await waitAndTap('selected-asset-field-input');
    await checkIfElementByTextIsVisible('Max');
  });

  it('Should display max button on asset quantity input focus', async () => {
    await checkIfVisible('selected-asset-quantity-field-input');
    await waitAndTap('selected-asset-quantity-field-input');
    await checkIfElementByTextIsVisible('Max');
  });

  it('Should display Insufficient Funds button if exceeds asset balance', async () => {
    await checkIfVisible('selected-asset-field-input');
    await waitAndTap('selected-asset-field-input');
    await typeText('selected-asset-field-input', '9999', false);
    await checkIfElementByTextIsVisible('Insufficient Funds');
  });

  it('Should prepend a 0 to quantity field on input of .', async () => {
    await waitAndTap('send-asset-form-DAI-mainnet');
    await waitAndTap('send-asset-DAI-mainnet');
    await checkIfVisible('selected-asset-quantity-field-input');
    await waitAndTap('selected-asset-quantity-field-input');
    await typeText('selected-asset-quantity-field-input', '.', true);
    await checkIfElementByTextIsVisible('0.');
  });

  it('Should only show a max of 2 decimals in quantity field', async () => {
    await waitAndTap('send-asset-form-DAI-mainnet');
    await waitAndTap('send-asset-ETH-mainnet');
    await checkIfVisible('selected-asset-quantity-field-input');
    await waitAndTap('selected-asset-quantity-field-input');
    await typeText('selected-asset-quantity-field-input', '8.1219', true);
    await checkIfElementByTextIsVisible('8.12');
    await waitAndTap('send-asset-form-ETH-mainnet');
  });

  it('Should display Asset Form after tapping on asset ETH', async () => {
    await checkIfVisible('send-asset-ETH-mainnet');
    await waitAndTap('send-asset-ETH-mainnet');
    await checkIfVisible('selected-asset-field-input');
  });

  it('Should display max button on asset input focus ETH', async () => {
    await checkIfVisible('selected-asset-field-input');
    await waitAndTap('selected-asset-field-input');
    await checkIfElementByTextIsVisible('Max');
  });

  it('Should display max button on asset quantity input focus ETH', async () => {
    await checkIfVisible('selected-asset-quantity-field-input');
    await waitAndTap('selected-asset-quantity-field-input');
    await checkIfElementByTextIsVisible('Max');
  });

  it('Should display Insufficient Funds button if exceeds asset balance ETH', async () => {
    await checkIfVisible('selected-asset-field-input');
    await waitAndTap('selected-asset-field-input');
    await typeText('selected-asset-field-input', '9999', true);
    await checkIfElementByTextIsVisible('Insufficient Funds');
  });

  it('Should prepend a 0 to quantity field on input of . ETH', async () => {
    await waitAndTap('send-asset-form-ETH-mainnet');
    await waitAndTap('send-asset-ETH-mainnet');
    await checkIfVisible('selected-asset-quantity-field-input');
    await waitAndTap('selected-asset-quantity-field-input');
    await typeText('selected-asset-quantity-field-input', '.', true);
    await checkIfElementByTextIsVisible('0.');
  });

  it('Should only show a max of 2 decimals in quantity field ETH', async () => {
    await waitAndTap('send-asset-form-ETH-mainnet');
    await waitAndTap('send-asset-ETH-mainnet');
    await checkIfVisible('selected-asset-quantity-field-input');
    await waitAndTap('selected-asset-quantity-field-input');
    await typeText('selected-asset-quantity-field-input', '8.1219', true);
    await checkIfElementByTextIsVisible('8.12');
    await waitAndTap('send-asset-form-ETH-mainnet');
  });
});
