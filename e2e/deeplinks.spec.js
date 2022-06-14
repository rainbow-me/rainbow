/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import * as Helpers from './helpers';

const openDeeplink = async url => {
  await device.terminateApp();
  await device.launchApp({
    launchArgs: { detoxEnableSynchronization: 0 },
    newInstance: true,
    url,
  });
};

const testEthereumDeeplink = async url => {
  await openDeeplink(url);
  await Helpers.checkIfVisible('send-sheet-confirm-action-button', 30000);
  await Helpers.checkIfElementByTextIsVisible('􀕹 Review', 15000);
};

describe('Deeplinks spec', () => {
  it('Should show the welcome screen', async () => {
    await Helpers.checkIfVisible('welcome-screen');
  });

  it('Should show the "Restore Sheet" after tapping on "I already have a wallet"', async () => {
    await Helpers.waitAndTap('already-have-wallet-button');
    await Helpers.checkIfExists('restore-sheet');
  });

  it('Show the "Import Sheet" when tapping on "Restore with a recovery phrase or private key"', async () => {
    await Helpers.waitAndTap('restore-with-key-button');
    await Helpers.checkIfExists('import-sheet');
  });

  it('Should show the "Add wallet modal" after tapping import with a valid private key"', async () => {
    await Helpers.typeText('import-sheet-input', process.env.TEST_SEEDS, false);
    await Helpers.checkIfElementHasString(
      'import-sheet-button-label',
      'Import'
    );
    await Helpers.waitAndTap('import-sheet-button');
    await Helpers.checkIfVisible('wallet-info-modal');
  });

  it('Should navigate to the Wallet screen after tapping on "Import Wallet"', async () => {
    await Helpers.disableSynchronization();
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

  xit('should be able to handle ethereum payments urls for ETH (mainnet)', async () => {
    const url = 'ethereum:payment-brunobarbieri.eth@1?value=1e15';
    await testEthereumDeeplink(url);
  });

  xit('should be able to handle ethereum payments urls for ETH (arbitrum)', async () => {
    const url = 'ethereum:payment-brunobarbieri.eth@42161?value=1e15';
    await testEthereumDeeplink(url);
  });

  xit('should be able to handle ethereum payments urls for ETH (optimism)', async () => {
    const url = 'ethereum:payment-brunobarbieri.eth@10?value=1e15';
    await testEthereumDeeplink(url);
  });

  xit('should be able to handle ethereum payments urls for DAI (mainnet)', async () => {
    const url =
      'ethereum:0x6b175474e89094c44da98b954eedeac495271d0f@1/transfer?address=brunobarbieri.eth&uint256=1e18';
    await testEthereumDeeplink(url);
  });

  xit('should be able to handle ethereum payments urls for DAI (optimism)', async () => {
    const url =
      'ethereum:0xda10009cbd5d07dd0cecc66161fc93d7c9000da1@10/transfer?address=brunobarbieri.eth&uint256=1e15';
    await testEthereumDeeplink(url);
  });

  xit('should be able to handle ethereum payments urls for MATIC (polygon)', async () => {
    const url = 'ethereum:payment-brunobarbieri.eth@137?value=1e15';
    await testEthereumDeeplink(url);
  });

  it('should reject ethereum urls for assets that are not in the wallet', async () => {
    const url =
      'ethereum:0xef2e9966eb61bb494e5375d5df8d67b7db8a780d@1/transfer?address=brunobarbieri.eth&uint256=1e15';
    await openDeeplink(url);
    await Helpers.checkIfElementByTextIsVisible('Ooops!', 30000);
  });

  it('should show the Showcase Sheet for rainbow.me universal links with ENS names', async () => {
    await openDeeplink('https://rainbow.me/rainbowwallet.eth');
    await Helpers.checkIfVisible('showcase-sheet', 30000);
    await Helpers.checkIfElementByTextIsVisible('rainbowwallet.eth', 30000);
  });
  it('should show the Showcase Sheet for rainbow.me universal links with 0x addresses', async () => {
    await openDeeplink(
      'https://rainbow.me/0xE46aBAf75cFbFF815c0b7FfeD6F02B0760eA27f1'
    );
    await Helpers.checkIfVisible('showcase-sheet', 30000);
    await Helpers.checkIfElementByTextIsVisible('0xE46aBAf7...27f1', 30000);
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
  });
});
