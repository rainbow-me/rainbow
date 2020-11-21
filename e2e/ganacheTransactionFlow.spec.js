/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import { exec } from 'child_process';
import * as Helpers from './helpers';

beforeAll(async () => {
  // Reset the app state
  await exec('yarn ganache');
  await Helpers.delay(10000);
});

describe('Ganache Transaction Flow', () => {
  it('Should show the welcome screen', async () => {
    await Helpers.disableSynchronization();
    await Helpers.checkIfVisible('welcome-screen');
  });

  it('Should show the "Restore Sheet" after tapping on "I already have a wallet"', async () => {
    await Helpers.tap('already-have-wallet-button');
    await Helpers.delay(3000);
    await Helpers.checkIfExists('restore-sheet');
  });

  it('show the "Import Sheet" when tapping on "Restore with a recovery phrase or private key"', async () => {
    await Helpers.tap('restore-with-key-button');
    await Helpers.delay(3000);
    await Helpers.checkIfExists('import-sheet');
  });

  it('Should show the "Add wallet modal" after tapping import with a valid seed"', async () => {
    await Helpers.typeText('import-sheet-input', process.env.TEST_SEEDS, false);
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
    await Helpers.delay(5000);
  });

  it('Should navigate to the Profile screen after swiping right', async () => {
    await Helpers.delay(1000);
    await Helpers.swipe('wallet-screen', 'right', 'slow');
    await Helpers.delay(3000);
    await Helpers.checkIfVisible('profile-screen');
    await Helpers.delay(3000);
  });

  it('Should navigate to Settings Modal after tapping Settings Button', async () => {
    await Helpers.tap('settings-button');
    await Helpers.delay(3000);
    await Helpers.checkIfVisible('settings-modal');
  });

  it('Should navigate to Developer Settings after tapping Developer Section', async () => {
    await Helpers.tap('developer-section');
    await Helpers.delay(3000);
    await Helpers.checkIfVisible('developer-settings-modal');
  });

  it('Should show Ganache Toast after pressing Connect To Ganache', async () => {
    await Helpers.tap('ganache-section');
    await Helpers.delay(10000);
    await Helpers.checkIfVisible('testnet-toast-Ganache');
    await Helpers.swipe('profile-screen', 'left', 'slow');
    await Helpers.delay(3000);
  });

  /*
  it('Should swap ETH -> ERC20 (DAI)', async () => {
    await Helpers.tap('exchange-fab');
    await Helpers.delay(3000);
    await Helpers.typeText('exchange-modal-input', '0.01', true);
    await Helpers.delay(3000);
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.delay(3000);
    await Helpers.typeText('currency-select-search-input', 'DAI', true);
    await Helpers.delay(3000);
    await Helpers.tap('exchange-coin-row-DAI');
    await Helpers.delay(5000);
    await Helpers.tapAndLongPress('exchange-modal-confirm');
    await Helpers.delay(10000);
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });

  it('Should swap ERC20 (BAT) -> ERC20 (ZRX)', async () => {
    await Helpers.delay(3000);
    await Helpers.tap('exchange-fab');
    await Helpers.delay(3000);
    await Helpers.tap('exchange-modal-input-selection-button');
    await Helpers.delay(3000);
    await Helpers.tap('exchange-coin-row-BAT');
    await Helpers.delay(3000);
    await Helpers.typeText('exchange-modal-input', '5', true);
    await Helpers.delay(3000);
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.delay(3000);
    await Helpers.tap('exchange-coin-row-ZRX');
    await Helpers.delay(5000);
    await Helpers.tapAndLongPress('exchange-modal-confirm');
    await Helpers.delay(10000);
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });

  it('Should swap ERC20 (USDC)-> ETH', async () => {
    await Helpers.delay(3000);
    await Helpers.tap('exchange-fab');
    await Helpers.delay(3000);
    await Helpers.tap('exchange-modal-input-selection-button');
    await Helpers.delay(3000);
    await Helpers.tap('exchange-coin-row-USDC');
    await Helpers.delay(3000);
    await Helpers.typeText('exchange-modal-input', '2', true);
    await Helpers.delay(3000);
    await Helpers.tap('exchange-modal-output-selection-button');
    await Helpers.delay(3000);
    await Helpers.typeText('currency-select-search-input', 'ETH', true);
    await Helpers.delay(3000);
    await Helpers.tap('exchange-coin-row-ETH');
    await Helpers.delay(5000);
    await Helpers.tapAndLongPress('exchange-modal-confirm');
    await Helpers.delay(10000);
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });*/

  it('Should send ERC20 (cSAI)', async () => {
    await Helpers.delay(3000);
    await Helpers.tap('send-fab');
    await Helpers.delay(3000);
    await Helpers.typeText('send-asset-form-field', 'poopcoin.eth', false);
    await Helpers.delay(3000);
    await Helpers.tap('send-savings-cSAI');
    await Helpers.delay(3000);
    await Helpers.typeText('selected-asset-field-input', '1', true);
    await Helpers.delay(5000);
    await Helpers.tapAndLongPress('send-sheet-confirm');
    await Helpers.delay(10000);
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });

  /*it('Should show completed swap ETH -> ERC20 (DAI)', async () => {
    try {
      await Helpers.checkIfVisible('Swapped-Ethereum');
    } catch (e) {
      await Helpers.checkIfVisible('Swapping-Ethereum');
    }
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });*/

  it('Should send (Cryptokitties)', async () => {
    await Helpers.delay(3000);
    await Helpers.tap('send-fab');
    await Helpers.delay(3000);
    await Helpers.typeText('send-asset-form-field', 'poopcoin.eth', false);
    await Helpers.delay(3000);
    await Helpers.tap('CryptoKitties-family-header');
    await Helpers.delay(2000);
    await Helpers.tapByText('Arun Cattybinky');
    await Helpers.delay(3000);
    await Helpers.tapAndLongPress('send-sheet-confirm');
    await Helpers.delay(10000);
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });

  it('Should send ERC20 (BAT)', async () => {
    await Helpers.delay(3000);
    await Helpers.tap('send-fab');
    await Helpers.delay(3000);
    await Helpers.typeText('send-asset-form-field', 'poopcoin.eth', false);
    await Helpers.delay(3000);
    await Helpers.tap('send-asset-BAT');
    await Helpers.delay(3000);
    await Helpers.typeText('selected-asset-field-input', '2', true);
    await Helpers.delay(3000);
    await Helpers.tapAndLongPress('send-sheet-confirm');
    await Helpers.delay(10000);
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });

  it('Should send ETH', async () => {
    await Helpers.delay(3000);
    await Helpers.tap('send-fab');
    await Helpers.delay(3000);
    await Helpers.typeText('send-asset-form-field', 'poopcoin.eth', false);
    await Helpers.delay(3000);
    await Helpers.tap('send-asset-ETH');
    await Helpers.delay(3000);
    await Helpers.typeText('selected-asset-field-input', '.01', true);
    await Helpers.delay(3000);
    await Helpers.tapAndLongPress('send-sheet-confirm');
    await Helpers.delay(10000);
  });

  /*
  it('Should show completed swap ERC20 (BAT) -> ERC20 (ZRX)', async () => {
    await Helpers.delay(3000);
    try {
      await Helpers.checkIfVisible('Swapped-Basic Attention Token');
    } catch (e) {
      await Helpers.checkIfVisible('Swapping-Basic Attention Token');
    }
  });

  it('Should show completed swap ERC20 (USDC) -> ETH', async () => {
    try {
      await Helpers.checkIfVisible('Swapped-USD Coin');
    } catch (e) {
      await Helpers.checkIfVisible('Swapping-USD Coin');
    }
    try {
      await Helpers.checkIfVisible('Sent-Compound Sai');
    } catch (e) {
      await Helpers.checkIfVisible('Sending-Compound Sai');
    }
  });*/
  it('Should show completed send ERC20 (cSAI)', async () => {
    try {
      await Helpers.checkIfVisible('Sent-Compound SAI');
    } catch (e) {
      await Helpers.checkIfVisible('Sending-Compound SAI');
    }
  });

  it('Should show completed send NFT (Cryptokitties)', async () => {
    try {
      await Helpers.checkIfVisible('Sent-Arun Cattybinky');
    } catch (e) {
      await Helpers.checkIfVisible('Sending-Arun Cattybinky');
    }
  });

  it('Should show completed send ERC20 (BAT)', async () => {
    try {
      await Helpers.checkIfVisible('Sent-Basic Attention Token');
    } catch (e) {
      await Helpers.checkIfVisible('Sending-Basic Attention Token');
    }
  });

  it('Should show completed send ETH', async () => {
    try {
      await Helpers.checkIfVisible('Sent-Ethereum');
    } catch (e) {
      await Helpers.checkIfVisible('Sending-Ethereum');
    }
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
    await exec('kill $(lsof -t -i:7545)');
  });
});
