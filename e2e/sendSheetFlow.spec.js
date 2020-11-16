/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

describe('Send Sheet Interaction Flow', () => {
  it('Should show the welcome screen', async () => {
    await Helpers.disableSynchronization();
    await Helpers.checkIfVisible('welcome-screen');
  });

  it('Should show the "Restore Sheet" after tapping on "I already have a wallet"', async () => {
    await Helpers.tap('already-have-wallet-button');
    await Helpers.delay(2000);
    await Helpers.checkIfExists('restore-sheet');
  });

  it('show the "Import Sheet" when tapping on "Restore with a recovery phrase or private key"', async () => {
    await Helpers.tap('restore-with-key-button');
    await Helpers.delay(2000);
    await Helpers.checkIfExists('import-sheet');
  });

  it("Shouldn't do anything when I type jibberish", async () => {
    await Helpers.tap('import-sheet-input');
    await Helpers.checkIfElementHasString('import-sheet-button-label', 'Paste');
    await Helpers.typeText('import-sheet-input', 'asdajksdlakjsd', false);
    await Helpers.checkIfElementHasString(
      'import-sheet-button-label',
      'Import'
    );
  });

  it('Should show the "Add wallet modal" after tapping import with a valid seed"', async () => {
    await Helpers.clearField('import-sheet-input');
    await Helpers.typeText('import-sheet-input', process.env.DEV_SEEDS, false);
    await Helpers.delay(1500);
    await Helpers.checkIfElementHasString(
      'import-sheet-button-label',
      'Import'
    );
    await Helpers.tap('import-sheet-button');
    await Helpers.checkIfVisible('wallet-info-modal');
  });

  it('Should navigate to the Wallet screen after tapping on "Import Wallet"', async () => {
    await Helpers.delay(2000);
    await Helpers.tap('wallet-info-submit-button');
    if (device.getPlatform() === 'android') {
      await Helpers.checkIfVisible('pin-authentication-screen');
      // Set the pin
      await Helpers.authenticatePin('1234');
      // Confirm it
      await Helpers.authenticatePin('1234');
    }
    await Helpers.delay(3000);
    await Helpers.checkIfVisible('wallet-screen');
  });

  // Saving for now in case we want to test iCloud back up sheet
  // it('Should show the backup sheet', async () => {
  //   await Helpers.delay(3000);
  //   await Helpers.checkIfVisible('backup-sheet');
  //   await Helpers.tap('backup-sheet-imported-cancel-button');
  // });
  /*
  it('Should open expanded state', async () => {
    await Helpers.delay(8000);
    await Helpers.tap('balance-coin-row-Ethereum');
    await Helpers.delay(8000);
  });

  it('Should tap through chart timeseries', async () => {
    await Helpers.tap('chart-timespan-h');
    await Helpers.delay(6000);
    await Helpers.tap('chart-timespan-d');
    await Helpers.delay(6000);
    await Helpers.tap('chart-timespan-w');
    await Helpers.delay(6000);
    await Helpers.tap('chart-timespan-m');
    await Helpers.delay(6000);
    await Helpers.tap('chart-timespan-y');
    await Helpers.delay(6000);
  });

  it('Should close Expanded State and navigate to wallet screen', async () => {
    await Helpers.delay(1000);
    await Helpers.swipe('expanded-state-header', 'down');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('wallet-screen');
  });
  */
  it('Should show all wallet sections', async () => {
    await Helpers.delay(5000);
    await Helpers.checkIfElementByTextIsVisible('Pools');
    await Helpers.swipe('wallet-screen', 'up');
    await Helpers.checkIfElementByTextIsVisible('Collectibles');
  });

  it('Should say "poopcoin.eth" in the Profile Screen header', async () => {
    await Helpers.delay(1000);
    await Helpers.swipe('wallet-screen', 'right');
    await Helpers.delay(2000);
    if (device.getPlatform() === 'android') {
      await Helpers.checkIfElementByTextToExist('poopcoin.eth');
    } else {
      await Helpers.checkIfElementByTextIsVisible('poopcoin.eth');
    }
    await Helpers.swipe('profile-screen', 'left');
  });

  it('Should open send sheet after tapping send fab', async () => {
    await Helpers.delay(1000);
    await Helpers.tap('send-fab');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('send-asset-form-field');
  });

  it('Should do nothing on typing jibberish send address', async () => {
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('send-asset-form-field');
    await Helpers.typeText('send-asset-form-field', 'gvuabefhiwdnomks', false);
    await Helpers.delay(2000);
    await Helpers.checkIfNotVisible('send-asset-ETH');
  });

  it('Should show show Contact Button & Asset List on valid public address', async () => {
    await Helpers.clearField('send-asset-form-field');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('send-asset-form-field');
    await Helpers.typeText(
      'send-asset-form-field',
      '0xF0f21ab2012731542731df194cfF6c77d29cB31A',
      false
    );
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('add-contact-button');
    await Helpers.checkIfVisible('send-asset-list');
  });

  it('Should show show Contact Button & Asset List on valid ENS address', async () => {
    await Helpers.clearField('send-asset-form-field');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('send-asset-form-field');
    await Helpers.typeText('send-asset-form-field', 'poopcoin.eth\n', false);
    await Helpers.checkIfVisible('add-contact-button');
    await Helpers.checkIfVisible('send-asset-list');
  });

  it('Should display Asset Form after tapping on savings asset', async () => {
    await Helpers.delay(1500);
    await Helpers.checkIfVisible('send-savings-cDAI');
    await Helpers.tap('send-savings-cDAI');
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('selected-asset-field-input');
  });

  it('Should go back to Asset List after tapping on savings asset', async () => {
    await Helpers.delay(1000);
    await Helpers.tap('send-asset-form-cDAI');
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('send-asset-list');
  });

  it('Should display Asset Form after tapping on asset', async () => {
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('send-asset-DAI');
    await Helpers.tap('send-asset-DAI');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('selected-asset-field-input');
  });

  it('Should display max button on asset input focus', async () => {
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('selected-asset-field-input');
    await Helpers.tap('selected-asset-field-input');
    await Helpers.delay(1000);
    await Helpers.checkIfElementByTextIsVisible('Max');
  });

  it('Should display max button on asset quantity input focus', async () => {
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('selected-asset-quantity-field-input');
    await Helpers.tap('selected-asset-quantity-field-input');
    await Helpers.delay(1000);
    await Helpers.checkIfElementByTextIsVisible('Max');
  });

  it('Should display Insufficient Funds button if exceeds asset balance', async () => {
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('selected-asset-field-input');
    await Helpers.tap('selected-asset-field-input');
    await Helpers.typeText('selected-asset-field-input', '9999', false);
    await Helpers.delay(1000);
    if (device.getPlatform() === 'android') {
      await Helpers.checkIfElementByTextToExist('Insufficient Funds');
    } else {
      await Helpers.checkIfElementByTextIsVisible('Insufficient Funds');
    }
  });

  it('Should prepend a 0 to quantity field on input of .', async () => {
    await Helpers.tap('send-asset-form-DAI');
    await Helpers.delay(3000);
    await Helpers.tap('send-asset-DAI');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('selected-asset-quantity-field-input');
    await Helpers.tap('selected-asset-quantity-field-input');
    await Helpers.typeText('selected-asset-quantity-field-input', '.', true);
    await Helpers.checkIfElementByTextIsVisible('0.');
  });

  it('Should only show a max of 2 decimals in quantity field', async () => {
    await Helpers.tap('send-asset-form-DAI');
    await Helpers.delay(3000);
    await Helpers.tap('send-asset-DAI');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('selected-asset-quantity-field-input');
    await Helpers.tap('selected-asset-quantity-field-input');
    await Helpers.typeText(
      'selected-asset-quantity-field-input',
      '8.1219',
      true
    );
    await Helpers.checkIfElementByTextIsVisible('8.12');
    await Helpers.tap('send-asset-form-DAI');
  });

  it('Should display Asset Form after tapping on asset ETH', async () => {
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('send-asset-ETH');
    await Helpers.tap('send-asset-ETH');
    await Helpers.delay(2000);
    await Helpers.checkIfVisible('selected-asset-field-input');
  });

  it('Should display max button on asset input focus ETH', async () => {
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('selected-asset-field-input');
    await Helpers.tap('selected-asset-field-input');
    await Helpers.delay(1000);
    await Helpers.checkIfElementByTextIsVisible('Max');
  });

  it('Should display max button on asset quantity input focus ETH', async () => {
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('selected-asset-quantity-field-input');
    await Helpers.tap('selected-asset-quantity-field-input');
    await Helpers.delay(1000);
    await Helpers.checkIfElementByTextIsVisible('Max');
  });

  it('Should display Insufficient Funds button if exceeds asset balance ETH', async () => {
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('selected-asset-field-input');
    await Helpers.tap('selected-asset-field-input');
    await Helpers.typeText('selected-asset-field-input', '9999', true);
    await Helpers.delay(1000);
    await Helpers.checkIfElementByTextIsVisible('Insufficient Funds');
  });

  it('Should prepend a 0 to quantity field on input of . ETH', async () => {
    await Helpers.tap('send-asset-form-ETH');
    await Helpers.delay(2000);
    await Helpers.tap('send-asset-ETH');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('selected-asset-quantity-field-input');
    await Helpers.tap('selected-asset-quantity-field-input');
    await Helpers.typeText('selected-asset-quantity-field-input', '.', true);
    await Helpers.checkIfElementByTextIsVisible('0.');
  });

  it('Should only show a max of 2 decimals in quantity field ETH', async () => {
    await Helpers.tap('send-asset-form-ETH');
    await Helpers.delay(3000);
    await Helpers.tap('send-asset-ETH');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('selected-asset-quantity-field-input');
    await Helpers.tap('selected-asset-quantity-field-input');
    await Helpers.typeText(
      'selected-asset-quantity-field-input',
      '8.1219',
      true
    );
    await Helpers.checkIfElementByTextIsVisible('8.12');
    await Helpers.tap('send-asset-form-ETH');
    await Helpers.delay(1000);
  });

  it('Should show Add Contact Screen after tapping Add Contact Button', async () => {
    await Helpers.checkIfVisible('add-contact-button');
    await Helpers.tap('add-contact-button');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('contact-profile-name-input');
  });

  it('Should do nothing on Add Contact cancel', async () => {
    await Helpers.tapByText('Cancel');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('add-contact-button');
    await Helpers.tap('add-contact-button');
    await Helpers.delay(2500);
    await Helpers.tapByText('Cancel');
  });

  it('Should update address field to show contact name & show edit contact button', async () => {
    await Helpers.delay(1000);
    await Helpers.tap('add-contact-button');
    await Helpers.delay(2000);
    await Helpers.typeText('contact-profile-name-input', 'testcoin.test', true);
    await Helpers.tap('contact-profile-add-button');
    await Helpers.checkIfElementByTextIsVisible('testcoin.test');
    await Helpers.checkIfVisible('edit-contact-button');
  });

  it('Should show Asset List & Edit Contact Button on cancel', async () => {
    await Helpers.checkIfVisible('edit-contact-button');
    await Helpers.tap('edit-contact-button');
    await Helpers.delay(3000);
    await Helpers.tapByText('Cancel');
    await Helpers.delay(2000);
  });

  it('Should updated contact name after edit contact', async () => {
    await Helpers.checkIfVisible('edit-contact-button');
    await Helpers.tap('edit-contact-button');
    await Helpers.delay(2000);
    await Helpers.tapByText('Edit Contact');
    await Helpers.delay(2000);
    await Helpers.clearField('contact-profile-name-input');
    await Helpers.typeText('contact-profile-name-input', 'testcoin.eth', true);
    await Helpers.tapByText('Done');
    await Helpers.delay(1000);
    await Helpers.checkIfElementByTextIsVisible('testcoin.eth');
  });

  it('Should load contacts if contacts exist', async () => {
    await Helpers.delay(5000);
    if (device.getPlatform() === 'android') {
      await device.pressBack();
    } else {
      await Helpers.swipe('send-asset-form-field', 'down', 'slow');
    }
    await Helpers.delay(1000);
    await Helpers.tap('send-fab');
    await Helpers.delay(2000);
    await Helpers.checkIfElementByTextIsVisible('testcoin.eth');
  });

  it('Should show Add Contact Button after deleting contact', async () => {
    await Helpers.checkIfElementByTextIsVisible('testcoin.eth');
    await Helpers.delay(1000);
    await Helpers.tapByText('testcoin.eth');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('edit-contact-button');
    await Helpers.tap('edit-contact-button');
    await Helpers.delay(2000);
    await Helpers.tapByText('Delete Contact');
    await Helpers.delay(2000);
    await Helpers.tapByText('Delete Contact');
    await Helpers.delay(1000);
    await Helpers.checkIfVisible('add-contact-button');
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
  });
});
