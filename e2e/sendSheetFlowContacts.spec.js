/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

const android = device.getPlatform() === 'android';

beforeAll(async () => {
  await Helpers.startHardhat();
});

describe('Send Sheet Interaction Flow Contacts', () => {
  it('Should show the welcome screen', async () => {
    await Helpers.checkIfVisible('welcome-screen');
  });

  it('Should show the "Add Wallet Sheet" after tapping on "I already have a wallet"', async () => {
    await Helpers.waitAndTap('already-have-wallet-button');
    await Helpers.checkIfExists('add-wallet-sheet');
  });

  it('show the "Import Sheet" when tapping on "Restore with a recovery phrase or private key"', async () => {
    await Helpers.waitAndTap('restore-with-key-button');
    await Helpers.checkIfExists('import-sheet');
  });

  it('Should show the "Add wallet modal" after tapping import with a valid seed"', async () => {
    await Helpers.clearField('import-sheet-input');
    await Helpers.typeText('import-sheet-input', process.env.TEST_SEEDS, false);
    await Helpers.checkIfElementHasString(
      'import-sheet-button-label',
      'Continue'
    );
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.checkIfVisible('wallet-info-modal');
  });

  it('Should navigate to the Wallet screen after tapping on "Import Wallet"', async () => {
    await Helpers.disableSynchronization();
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

  it('Should send ETH to test wallet"', async () => {
    await Helpers.sendETHtoTestWallet();
  });

  it('Should show Hardhat Toast after pressing Connect To Hardhat', async () => {
    await Helpers.waitAndTap('dev-button-hardhat');
    await Helpers.checkIfVisible('testnet-toast-Hardhat');
  });

  // Saving for now in case we want to test iCloud back up sheet
  // it('Should show the backup sheet', async () => {
  //   await Helpers.checkIfVisible('backup-sheet');
  //   await Helpers.waitAndTap('backup-sheet-imported-cancel-button');
  // });
  /*
  it('Should open expanded state', async () => {
    await Helpers.waitAndTap('balance-coin-row-Ethereum');
    ;

  it('Should tap through chart timeseries', async () => {
    await Helpers.waitAndTap('chart-timespan-h');
    await Helpers.waitAndTap('chart-timespan-d');
    await Helpers.waitAndTap('chart-timespan-w');
    await Helpers.waitAndTap('chart-timespan-m');
    await Helpers.waitAndTap('chart-timespan-y');
    ;

  it('Should close Expanded State and navigate to wallet screen', async () => {
    await Helpers.swipe('expanded-state-header', 'down');
    await Helpers.checkIfVisible('wallet-screen');
  });
  */
  it('Should show all wallet sections', async () => {
    await Helpers.swipe('wallet-screen', 'up');
    await Helpers.checkIfElementByTextIsVisible('Collectibles');
  });

  it('Should say correct address in the Profile Screen header', async () => {
    await Helpers.swipe('wallet-screen', 'right');
    await Helpers.checkIfVisible('profileAddress-rainbowtestwallet.eth');
    await Helpers.swipe('profile-screen', 'left');
  });

  it('Should open send sheet after tapping send fab', async () => {
    await Helpers.swipe('wallet-screen', 'down', 'slow', 0.4);
    await Helpers.waitAndTap('send-button');
    await Helpers.checkIfVisible('send-asset-form-field');
  });

  it('Should show show Contact Button & Asset List on valid ENS & Unstoppable addresses', async () => {
    await Helpers.clearField('send-asset-form-field');
    await Helpers.checkIfVisible('send-asset-form-field');
    await Helpers.typeText(
      'send-asset-form-field',
      'neverselling.wallet\n',
      false
    );
    await Helpers.checkIfVisible('send-asset-list');
    await Helpers.clearField('send-asset-form-field');
    await device.disableSynchronization();
    await Helpers.typeText(
      'send-asset-form-field',
      'rainbowwallet.eth\n',
      false
    );
    await device.enableSynchronization();
    // await Helpers.checkIfVisible('add-contact-button')
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
    // await Helpers.tapByText('Done');
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
    await Helpers.delay(2000);
    await Helpers.tapByText('Delete Contact');
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('add-contact-button');
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
    await Helpers.killHardhat();
  });
});
