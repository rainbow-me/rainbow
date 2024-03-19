/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

const android = device.getPlatform() === 'android';

describe('Send Sheet Interaction Flow Contacts', () => {
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

  it('Should show all wallet sections', async () => {
    await Helpers.swipe('wallet-screen', 'up', 'slow', 0.4);
    await Helpers.checkIfElementByTextIsVisible('Collectibles');
  });

  it('Should open send sheet after tapping send fab', async () => {
    await Helpers.swipe('wallet-screen', 'down', 'slow', 0.4);
    await Helpers.waitAndTap('send-button');
    await Helpers.checkIfVisible('send-asset-form-field');
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

  it('Should show Add Contact Screen after tapping Add Contact Button', async () => {
    await Helpers.checkIfVisible('add-contact-button');
    await Helpers.waitAndTap('add-contact-button');
    await Helpers.checkIfVisible('wallet-info-input');
  });

  it('Should do nothing on Add Contact cancel', async () => {
    await Helpers.tapByText('Cancel');
    await Helpers.checkIfVisible('add-contact-button');
    await Helpers.waitAndTap('add-contact-button');
    await Helpers.tapByText('Cancel');
  });

  it('Should update address field to show contact name & show edit contact button', async () => {
    await Helpers.waitAndTap('add-contact-button');
    await Helpers.clearField('wallet-info-input');
    await Helpers.typeText('wallet-info-input', 'testcoin.test', true);
    await Helpers.waitAndTap('wallet-info-submit-button');
    await Helpers.checkIfElementByTextIsVisible('testcoin.test');
    await Helpers.checkIfVisible('edit-contact-button');
  });

  it('Should show Asset List & Edit Contact Button on cancel', async () => {
    await Helpers.checkIfVisible('edit-contact-button');
    await Helpers.waitAndTap('edit-contact-button');
    await Helpers.tapByText('Cancel');
  });

  it('Should updated contact name after edit contact', async () => {
    await Helpers.checkIfVisible('edit-contact-button');
    await Helpers.waitAndTap('edit-contact-button');
    await Helpers.tapByText('Edit Contact');
    await Helpers.clearField('wallet-info-input');
    await Helpers.typeText('wallet-info-input', 'testcoin.eth', true);
    await Helpers.waitAndTap('wallet-info-submit-button');
    await Helpers.checkIfElementByTextIsVisible('testcoin.eth');
  });

  it('Should load contacts if contacts exist', async () => {
    if (android) {
      await device.pressBack();
    } else {
      await Helpers.swipe('send-asset-form-field', 'down', 'slow');
    }
    await Helpers.waitAndTap('send-button');
    await Helpers.checkIfElementByTextIsVisible('testcoin.eth');
  });

  it('Should show Add Contact Button after deleting contact', async () => {
    await Helpers.checkIfElementByTextIsVisible('testcoin.eth');
    await Helpers.tapByText('testcoin.eth');
    await Helpers.checkIfVisible('edit-contact-button');
    await Helpers.waitAndTap('edit-contact-button');
    await Helpers.tapByText('Delete Contact');
    await Helpers.delayTime('medium');
    await Helpers.tapByText('Delete Contact');
    await Helpers.delayTime('medium');
    await Helpers.checkIfVisible('add-contact-button');
  });
});
