import * as Helpers from './helpers';
import { device } from 'detox';

describe('Send Sheet Interaction Flow', () => {
  beforeAll(async () => {
    await Helpers.startHardhat();
  });
  afterAll(async () => {
    await device.clearKeychain();
    await Helpers.killHardhat();
  });

  it('Import a wallet and go to welcome', async () => {
    await Helpers.importWalletFlow();
  });

  it('Should send ETH to test wallet"', async () => {
    await Helpers.sendETHtoTestWallet();
  });

  it('Should show Hardhat Toast after pressing Connect To Hardhat', async () => {
    await Helpers.waitAndTap('dev-button-hardhat');
    await Helpers.checkIfVisible('testnet-toast-Hardhat');
  });

  it.skip('Should show all wallet sections', async () => {
    await Helpers.swipe('wallet-screen', 'up');
    await Helpers.checkIfElementByTextIsVisible('Collectibles');
    await Helpers.swipe('wallet-screen', 'down', 'slow', 0.4);
  });

  it('Should open send sheet after tapping send button', async () => {
    await Helpers.waitAndTap('send-button');
    await Helpers.checkIfVisible('send-asset-form-field');
  });

  it('Should do nothing on typing jibberish send address', async () => {
    await Helpers.typeText('send-asset-form-field', 'gvuabefhiwdnomks', false);
    await Helpers.checkIfNotVisible('send-asset-ETH-mainnet');
  });

  // FIXME: typing in address in sim has a glitch where the asset-list doesn't
  //        populate
  //
  //        SKIPPING all tests after this one, as the app is in the wrong state
  it('Should show show Contact Button & Asset List on valid public address', async () => {
    await Helpers.clearField('send-asset-form-field');
    await Helpers.checkIfVisible('send-asset-form-field');
    await Helpers.replaceTextInField('send-asset-form-field', '0xF0f21ab2012731542731df194cfF6c77d29cB31A');
    await Helpers.checkIfVisible('send-asset-list', 20000);
  });

  it('Should show show Contact Button & Asset List on valid ENS & Unstoppable addresses', async () => {
    await Helpers.clearField('send-asset-form-field');
    await Helpers.checkIfVisible('send-asset-form-field');
    await Helpers.typeText('send-asset-form-field', 'neverselling.wallet\n', false);
    await Helpers.checkIfVisible('send-asset-list');
    await Helpers.clearField('send-asset-form-field');
    await device.disableSynchronization();
    await Helpers.typeText('send-asset-form-field', 'rainbowwallet.eth\n', false);
    await device.enableSynchronization();
    await Helpers.checkIfVisible('send-asset-list');
  });

  it.skip('Should display Asset Form after tapping on asset', async () => {
    await Helpers.checkIfVisible('send-asset-DAI-mainnet');
    await Helpers.waitAndTap('send-asset-DAI-mainnet');
    await Helpers.checkIfVisible('selected-asset-field-input');
  });

  it.skip('Should display max button on asset input focus', async () => {
    await Helpers.checkIfVisible('selected-asset-field-input');
    await Helpers.waitAndTap('selected-asset-field-input');
    await Helpers.checkIfElementByTextIsVisible('Max');
  });

  it.skip('Should display max button on asset quantity input focus', async () => {
    await Helpers.checkIfVisible('selected-asset-quantity-field-input');
    await Helpers.waitAndTap('selected-asset-quantity-field-input');
    await Helpers.checkIfElementByTextIsVisible('Max');
  });

  it.skip('Should display Insufficient Funds button if exceeds asset balance', async () => {
    await Helpers.checkIfVisible('selected-asset-field-input');
    await Helpers.waitAndTap('selected-asset-field-input');
    await Helpers.typeText('selected-asset-field-input', '9999', false);
    await Helpers.checkIfElementByTextIsVisible('Insufficient Funds');
  });

  it.skip('Should prepend a 0 to quantity field on input of .', async () => {
    await Helpers.waitAndTap('send-asset-form-DAI-mainnet');
    await Helpers.waitAndTap('send-asset-DAI-mainnet');
    await Helpers.checkIfVisible('selected-asset-quantity-field-input');
    await Helpers.waitAndTap('selected-asset-quantity-field-input');
    await Helpers.typeText('selected-asset-quantity-field-input', '.', true);
    await Helpers.checkIfElementByTextIsVisible('0.');
  });

  it.skip('Should only show a max of 2 decimals in quantity field', async () => {
    await Helpers.waitAndTap('send-asset-form-DAI-mainnet');
    await Helpers.waitAndTap('send-asset-ETH-mainnet');
    await Helpers.checkIfVisible('selected-asset-quantity-field-input');
    await Helpers.waitAndTap('selected-asset-quantity-field-input');
    await Helpers.typeText('selected-asset-quantity-field-input', '8.1219', true);
    await Helpers.checkIfElementByTextIsVisible('8.12');
    await Helpers.waitAndTap('send-asset-form-ETH-mainnet');
  });

  it('Should display Asset Form after tapping on asset ETH', async () => {
    await Helpers.checkIfVisible('send-asset-ETH-mainnet');
    await Helpers.waitAndTap('send-asset-ETH-mainnet');
    await Helpers.checkIfVisible('selected-asset-field-input');
  });

  it('Should display max button on asset input focus ETH', async () => {
    await Helpers.checkIfVisible('selected-asset-field-input');
    await Helpers.waitAndTap('selected-asset-field-input');
    await Helpers.checkIfElementByTextIsVisible('Max');
  });

  it('Should display max button on asset quantity input focus ETH', async () => {
    await Helpers.checkIfVisible('selected-asset-quantity-field-input');
    await Helpers.waitAndTap('selected-asset-quantity-field-input');
    await Helpers.checkIfElementByTextIsVisible('Max');
  });

  it('Should display Insufficient Funds button if exceeds asset balance ETH', async () => {
    await Helpers.checkIfVisible('selected-asset-field-input');
    await Helpers.waitAndTap('selected-asset-field-input');
    await Helpers.typeText('selected-asset-field-input', '9999', true);
    await Helpers.checkIfElementByTextIsVisible('Insufficient Funds');
  });

  it('Should prepend a 0 to quantity field on input of . ETH', async () => {
    await Helpers.waitAndTap('send-asset-form-ETH-mainnet');
    await Helpers.waitAndTap('send-asset-ETH-mainnet');
    await Helpers.checkIfVisible('selected-asset-quantity-field-input');
    await Helpers.waitAndTap('selected-asset-quantity-field-input');
    await Helpers.typeText('selected-asset-quantity-field-input', '.', true);
    await Helpers.checkIfElementByTextIsVisible('0.');
  });

  it('Should only show a max of 2 decimals in quantity field ETH', async () => {
    await Helpers.waitAndTap('send-asset-form-ETH-mainnet');
    await Helpers.waitAndTap('send-asset-ETH-mainnet');
    await Helpers.checkIfVisible('selected-asset-quantity-field-input');
    await Helpers.waitAndTap('selected-asset-quantity-field-input');
    await Helpers.typeText('selected-asset-quantity-field-input', '8.1219', true);
    await Helpers.checkIfElementByTextIsVisible('8.12');
    await Helpers.waitAndTap('send-asset-form-ETH-mainnet');
  });
});
