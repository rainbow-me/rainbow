import { device } from 'detox';
import {
  beforeAllcleanApp,
  importWalletFlow,
  sendETHtoTestWallet,
  waitAndTap,
  checkIfVisible,
  swipe,
  checkIfElementByTextIsVisible,
  clearField,
  typeText,
  tapByText,
  delayTime,
  afterAllcleanApp,
} from './helpers';

const android = device.getPlatform() === 'android';

describe('Send Sheet Interaction Flow Contacts', () => {
  beforeAll(async () => {
    await beforeAllcleanApp({ hardhat: true });
  });
  afterAll(async () => {
    await afterAllcleanApp({ hardhat: true });
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

  it('Should open send sheet after tapping send fab', async () => {
    await swipe('wallet-screen', 'down', 'slow', 0.4);
    await waitAndTap('send-button');
    await checkIfVisible('send-asset-form-field');
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

  it('Should show Add Contact Screen after tapping Add Contact Button', async () => {
    await checkIfVisible('add-contact-button');
    await waitAndTap('add-contact-button');
    await checkIfVisible('wallet-info-input');
  });

  it('Should do nothing on Add Contact cancel', async () => {
    await tapByText('Cancel');
    await checkIfVisible('add-contact-button');
    await waitAndTap('add-contact-button');
    await tapByText('Cancel');
  });

  it('Should update address field to show contact name & show edit contact button', async () => {
    await waitAndTap('add-contact-button');
    await clearField('wallet-info-input');
    await typeText('wallet-info-input', 'testcoin.test', true);
    await waitAndTap('wallet-info-submit-button');
    await checkIfElementByTextIsVisible('testcoin.test');
    await checkIfVisible('edit-contact-button');
  });

  it('Should show Asset List & Edit Contact Button on cancel', async () => {
    await checkIfVisible('edit-contact-button');
    await waitAndTap('edit-contact-button');
    await tapByText('Cancel');
  });

  it('Should updated contact name after edit contact', async () => {
    await checkIfVisible('edit-contact-button');
    await waitAndTap('edit-contact-button');
    await tapByText('Edit Contact');
    await clearField('wallet-info-input');
    await typeText('wallet-info-input', 'testcoin.eth', true);
    await waitAndTap('wallet-info-submit-button');
    await checkIfElementByTextIsVisible('testcoin.eth');
  });

  it('Should load contacts if contacts exist', async () => {
    if (android) {
      await device.pressBack();
    } else {
      await swipe('send-asset-form-field', 'down', 'slow');
    }
    await waitAndTap('send-button');
    await checkIfElementByTextIsVisible('testcoin.eth');
  });

  it('Should show Add Contact Button after deleting contact', async () => {
    await checkIfElementByTextIsVisible('testcoin.eth');
    await tapByText('testcoin.eth');
    await checkIfVisible('edit-contact-button');
    await waitAndTap('edit-contact-button');
    await tapByText('Delete Contact');
    await delayTime('medium');
    await tapByText('Delete Contact');
    await delayTime('medium');
    await checkIfVisible('add-contact-button');
  });
});
