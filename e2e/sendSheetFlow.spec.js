/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

const android = device.getPlatform() === 'android';

beforeAll(async () => {
  await Helpers.startHardhat();
});

describe('Send Sheet Interaction Flow', () => {
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
    await Helpers.swipe('wallet-screen', 'down', 'slow', 0.4);
  });

  it('Should say correct address in the Profile Screen header', async () => {
    await Helpers.swipe('wallet-screen', 'right');
    await Helpers.checkIfVisible('profileAddress-rainbowtestwallet.eth');
    await Helpers.swipe('profile-screen', 'left');
  });

  it('Should open send sheet after tapping send button', async () => {
    await Helpers.waitAndTap('send-button');
    await Helpers.checkIfVisible('send-asset-form-field');
  });

  it('Should do nothing on typing jibberish send address', async () => {
    await Helpers.typeText('send-asset-form-field', 'gvuabefhiwdnomks', false);
    await Helpers.checkIfNotVisible('send-asset-ETH-token');
  });

  // FIXME: typing in address in sim has a glitch where the asset-list doesn't
  //        populate
  //
  //        SKIPPING all tests after this one, as the app is in the wrong state
  it.skip('Should show show Contact Button & Asset List on valid public address', async () => {
    await Helpers.clearField('send-asset-form-field');
    await Helpers.checkIfVisible('send-asset-form-field');
    await Helpers.typeText(
      'send-asset-form-field',
      '0xF0f21ab2012731542731df194cfF6c77d29cB31A',
      false
    );
    // await Helpers.checkIfVisible('add-contact-button');
    await Helpers.checkIfVisible('send-asset-list', 20000);
  });

  it.skip('Should show show Contact Button & Asset List on valid ENS & Unstoppable addresses', async () => {
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

  /*
  it('Should display Asset Form after tapping on savings asset', async () => {
    await Helpers.checkIfVisible('send-savings-cDAI');
    await Helpers.waitAndTap('send-savings-cDAI');
    await Helpers.checkIfVisible('selected-asset-field-input');
  });

  it('Should go back to Asset List after tapping on savings asset', async () => {
    await Helpers.waitAndTap('send-asset-form-cDAI-token');
    await Helpers.checkIfVisible('send-asset-list');
  });*/

  it.skip('Should display Asset Form after tapping on asset', async () => {
    await Helpers.checkIfVisible('send-asset-DAI-token');
    await Helpers.waitAndTap('send-asset-DAI-token');
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
    await Helpers.waitAndTap('send-asset-form-DAI-token');
    await Helpers.waitAndTap('send-asset-DAI-token');
    await Helpers.checkIfVisible('selected-asset-quantity-field-input');
    await Helpers.waitAndTap('selected-asset-quantity-field-input');
    await Helpers.typeText('selected-asset-quantity-field-input', '.', true);
    await Helpers.checkIfElementByTextIsVisible('0.');
  });

  it.skip('Should only show a max of 2 decimals in quantity field', async () => {
    await Helpers.waitAndTap('send-asset-form-DAI-token');
    await Helpers.waitAndTap('send-asset-ETH-token');
    await Helpers.checkIfVisible('selected-asset-quantity-field-input');
    await Helpers.waitAndTap('selected-asset-quantity-field-input');
    await Helpers.typeText(
      'selected-asset-quantity-field-input',
      '8.1219',
      true
    );
    await Helpers.checkIfElementByTextIsVisible('8.12');
    await Helpers.waitAndTap('send-asset-form-ETH-token');
  });

  it.skip('Should display Asset Form after tapping on asset ETH', async () => {
    await Helpers.checkIfVisible('send-asset-ETH-token');
    await Helpers.waitAndTap('send-asset-ETH-token');
    await Helpers.checkIfVisible('selected-asset-field-input');
  });

  it.skip('Should display max button on asset input focus ETH', async () => {
    await Helpers.checkIfVisible('selected-asset-field-input');
    await Helpers.waitAndTap('selected-asset-field-input');
    await Helpers.checkIfElementByTextIsVisible('Max');
  });

  it.skip('Should display max button on asset quantity input focus ETH', async () => {
    await Helpers.checkIfVisible('selected-asset-quantity-field-input');
    await Helpers.waitAndTap('selected-asset-quantity-field-input');
    await Helpers.checkIfElementByTextIsVisible('Max');
  });

  it.skip('Should display Insufficient Funds button if exceeds asset balance ETH', async () => {
    await Helpers.checkIfVisible('selected-asset-field-input');
    await Helpers.waitAndTap('selected-asset-field-input');
    await Helpers.typeText('selected-asset-field-input', '9999', true);
    await Helpers.checkIfElementByTextIsVisible('Insufficient Funds');
  });

  it.skip('Should prepend a 0 to quantity field on input of . ETH', async () => {
    await Helpers.waitAndTap('send-asset-form-ETH-token');
    await Helpers.waitAndTap('send-asset-ETH-token');
    await Helpers.checkIfVisible('selected-asset-quantity-field-input');
    await Helpers.waitAndTap('selected-asset-quantity-field-input');
    await Helpers.typeText('selected-asset-quantity-field-input', '.', true);
    await Helpers.checkIfElementByTextIsVisible('0.');
  });

  it.skip('Should only show a max of 2 decimals in quantity field ETH', async () => {
    await Helpers.waitAndTap('send-asset-form-ETH-token');
    await Helpers.waitAndTap('send-asset-ETH-token');
    await Helpers.checkIfVisible('selected-asset-quantity-field-input');
    await Helpers.waitAndTap('selected-asset-quantity-field-input');
    await Helpers.typeText(
      'selected-asset-quantity-field-input',
      '8.1219',
      true
    );
    await Helpers.checkIfElementByTextIsVisible('8.12');
    await Helpers.waitAndTap('send-asset-form-ETH-token');
  });
  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
    await Helpers.killHardhat();
  });
});
