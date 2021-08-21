/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

const testEthereumDeeplink = async url => {
  await Helpers.disableSynchronization();
  await device.sendToHome();
  await Helpers.enableSynchronization();

  await device.launchApp({
    newInstance: false,
    url,
  });
  await Helpers.checkIfVisible('send-sheet-confirm-action-button', 15000);
  await Helpers.checkIfElementByTextIsVisible('􀕹 Review');
  await Helpers.swipe('send-asset-form-field', 'down', 'slow');
};

describe('Deeplinks spec', () => {
  it('with 0x - Should show the welcome screen', async () => {
    await Helpers.checkIfVisible('welcome-screen');
  });

  it('with 0x - Should show the "Restore Sheet" after tapping on "I already have a wallet"', async () => {
    await Helpers.waitAndTap('already-have-wallet-button');
    await Helpers.checkIfExists('restore-sheet');
  });

  it('with 0x - Show the "Import Sheet" when tapping on "Restore with a recovery phrase or private key"', async () => {
    await Helpers.waitAndTap('restore-with-key-button');
    await Helpers.checkIfExists('import-sheet');
  });

  it('with 0x - Should show the "Add wallet modal" after tapping import with a valid private key"', async () => {
    await Helpers.typeText('import-sheet-input', process.env.PROD_PKEY, false);
    await Helpers.checkIfElementHasString(
      'import-sheet-button-label',
      'Import'
    );
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.checkIfVisible('wallet-info-modal');
  });

  it('with 0x - Should navigate to the Wallet screen after tapping on "Import Wallet"', async () => {
    await Helpers.disableSynchronization();
    await Helpers.checkIfVisible('wallet-info-input');
    await Helpers.typeText('wallet-info-input', 'PKEY', false);
    await Helpers.waitAndTap('wallet-info-submit-button');
    if (device.getPlatform() === 'android') {
      await Helpers.checkIfVisible('pin-authentication-screen');
      // Set the pin
      await Helpers.authenticatePin('1234');
      // Confirm it
      await Helpers.authenticatePin('1234');
    }
    await Helpers.checkIfVisible('wallet-screen', 40000);
    await Helpers.enableSynchronization();
  });

  it('should be able to handle ethereum payments urls for ETH (mainnet)', async () => {
    const url = 'ethereum:payment-brunobarbieri.eth@1?value=1e15';
    await testEthereumDeeplink(url);
  });

  it('should be able to handle ethereum payments urls for ETH (arbitrum)', async () => {
    const url = 'ethereum:payment-brunobarbieri.eth@42161?value=1e15';
    await testEthereumDeeplink(url);
  });

  it('should be able to handle ethereum payments urls for ETH (optimism)', async () => {
    const url = 'ethereum:payment-brunobarbieri.eth@10?value=1e15';
    await testEthereumDeeplink(url);
  });

  it('should be able to handle ethereum payments urls for DAI (mainnet)', async () => {
    const url =
      'ethereum:0x6b175474e89094c44da98b954eedeac495271d0f@1/transfer?address=brunobarbieri.eth&uint256=1e18';
    await testEthereumDeeplink(url);
  });

  it('should be able to handle ethereum payments urls for DAI (optimism)', async () => {
    const url =
      'ethereum:0xda10009cbd5d07dd0cecc66161fc93d7c9000da1@10/transfer?address=brunobarbieri.eth&uint256=1e18';
    await testEthereumDeeplink(url);
  });

  it('should be able to handle ethereum payments urls for MATIC (polygon)', async () => {
    const url = 'ethereum:payment-brunobarbieri.eth@137?value=1e15';
    await testEthereumDeeplink(url);
  });

  it('should be able to handle ethereum payments urls for WETH (polygon)', async () => {
    const url =
      'ethereum:0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619@137/transfer?address=brunobarbieri.eth&uint256=1e15';
    await testEthereumDeeplink(url);
  });

  it('should reject ethereum urls for assets that are not in the wallet', async () => {
    const url =
      'ethereum:0xef2e9966eb61bb494e5375d5df8d67b7db8a780d@1/transfer?address=brunobarbieri.eth&uint256=1e15';
    await Helpers.disableSynchronization();
    await device.sendToHome();
    await Helpers.enableSynchronization();

    await device.launchApp({
      newInstance: false,
      url,
    });
    await Helpers.checkIfElementByTextIsVisible('Ooops!');
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
  });
});
