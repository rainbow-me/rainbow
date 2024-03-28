import { exec } from 'child_process';
import { device } from 'detox';
import {
  openDeeplinkColdStart,
  openDeeplinkFromBackground,
  checkIfVisible,
  checkIfElementByTextIsVisible,
  swipe,
  waitAndTap,
  checkIfExists,
  typeText,
  checkIfElementHasString,
  disableSynchronization,
  authenticatePin,
  enableSynchronization,
  tapAlertWithButton,
} from '../helpers';

const RAINBOW_WALLET_ADDRESS = '0x7a3d05c70581bD345fe117c06e45f9669205384f';

const android = device.getPlatform() === 'android';

const testEthereumDeeplink = async (url: string, coldStart = true) => {
  coldStart ? await openDeeplinkColdStart(url) : await openDeeplinkFromBackground(url);
  await checkIfVisible('send-sheet-confirm-action-button', 30000);
  // Because we don't have ETH in this wallet
  try {
    await checkIfElementByTextIsVisible('􀕹 Review', 15000);
  } catch (e) {
    try {
      await checkIfElementByTextIsVisible('Insufficient ETH', 15000);
    } catch (e) {
      await checkIfElementByTextIsVisible('Insufficient Funds', 15000);
    }
  }
  await swipe('send-sheet', 'down');
};

const escapeUrl = (url: string) => {
  if (android) {
    return url.replace(/&/g, '\\&');
  } else {
    return url;
  }
};

beforeAll(async () => {
  if (android) {
    // When opening deeplink to rainbow, Android asks if we want to do it in
    // Chrome or the app. Detox is only able to control tapping within the app,
    // so this blocks our tests. The only way we found to bypass this is to
    // uninstall Chrome before.
    exec('yarn adb-all shell pm disable-user com.android.chrome');
  }
  await device.reloadReactNative();
});
afterAll(async () => {
  await device.clearKeychain();
});

describe.skip('Deeplinks spec', () => {
  it('Should show the welcome screen', async () => {
    await checkIfVisible('welcome-screen');
  });

  it('Should show the "Add Wallet Sheet" after tapping on "I already have a wallet"', async () => {
    await waitAndTap('already-have-wallet-button');
    await checkIfExists('add-wallet-sheet');
  });

  it('Show the "Import Sheet" when tapping on "Restore with a recovery phrase or private key"', async () => {
    await waitAndTap('restore-with-key-button');
    await checkIfExists('import-sheet');
  });

  it('Should show the "Add wallet modal" after tapping import with a valid private key"', async () => {
    await typeText('import-sheet-input', process.env.TEST_SEEDS, false);
    await checkIfElementHasString('import-sheet-button-label', 'Continue');
    await waitAndTap('import-sheet-button');
    await checkIfVisible('wallet-info-modal');
  });

  it('Should navigate to the Wallet screen after tapping on "Import Wallet"', async () => {
    await disableSynchronization();
    await waitAndTap('wallet-info-submit-button');
    if (android) {
      await checkIfVisible('pin-authentication-screen');
      // Set the pin
      await authenticatePin('1234');
      // Confirm it
      await authenticatePin('1234');
    }
    await checkIfVisible('wallet-screen', 40000);
    await enableSynchronization();
  });

  it('should reject ethereum urls for assets that are not in the wallet', async () => {
    const url = `ethereum:0xef2e9966eb61bb494e5375d5df8d67b7db8a780d@1/transfer?address=${RAINBOW_WALLET_ADDRESS}&uint256=1e15`;
    await openDeeplinkFromBackground(url);
    await checkIfElementByTextIsVisible('Ooops!', 30000);
    await tapAlertWithButton('OK');
  });

  it('should show the Profile Sheet for rainbow.me universal links with ENS names', async () => {
    await openDeeplinkFromBackground('https://rainbow.me/profile/rainbowwallet.eth');
    await checkIfVisible('profile-sheet', 30000);
    await checkIfElementByTextIsVisible('rainbowwallet.eth', 30000);
    await swipe('profile-sheet', 'down');
  });

  it('should show the Profile Sheet for rainbow.me universal links with 0x addresses', async () => {
    await openDeeplinkFromBackground('https://rainbow.me/profile/0xE46aBAf75cFbFF815c0b7FfeD6F02B0760eA27f1');
    await checkIfVisible('profile-sheet', 30000);
    await checkIfElementByTextIsVisible('0xE46aBAf75cFbFF815c0b7FfeD6F02B0760eA27f1', 30000);
    await swipe('profile-sheet', 'down');
  });

  it.skip('should be able to handle ethereum payments urls for ETH (mainnet)', async () => {
    const url = escapeUrl(`ethereum:payment-${RAINBOW_WALLET_ADDRESS}@1?value=1e2`);
    await testEthereumDeeplink(url, false);
  });

  it.skip('should be able to handle ethereum payments urls for ETH (optimism)', async () => {
    const url = escapeUrl(`ethereum:payment-${RAINBOW_WALLET_ADDRESS}@10?value=1e15`);
    await testEthereumDeeplink(url, false);
  });

  // FIXME: when doing open deeplinks with cold start, the account assets state
  // comes back empty, find a fix and then change these tests to cold-start again
  it('should be able to handle ethereum payments urls for DAI (mainnet)', async () => {
    const url = escapeUrl(`ethereum:0x6b175474e89094c44da98b954eedeac495271d0f@1/transfer?address=${RAINBOW_WALLET_ADDRESS}&uint256=1e18`);
    await testEthereumDeeplink(url, false);
  });

  // FIXME: when doing open deeplinks with cold start, the account assets state
  // comes back empty, find a fix and then change these tests to cold-start again
  it.skip('should be able to handle ethereum payments urls for ETH (arbitrum)', async () => {
    const url = `ethereum:payment-${RAINBOW_WALLET_ADDRESS}@42161?value=1e15`;
    await testEthereumDeeplink(url, false);
  });

  // FIXME: when doing open deeplinks with cold start, the account assets state
  // comes back empty, find a fix and then change these tests to cold-start again
  it.skip('should be able to handle ethereum payments urls for DAI (optimism)', async () => {
    const url = escapeUrl(`ethereum:0xda10009cbd5d07dd0cecc66161fc93d7c9000da1@10/transfer?address=${RAINBOW_WALLET_ADDRESS}&uint256=1e15`);
    await testEthereumDeeplink(url, false);
  });

  // FIXME: when doing open deeplinks with cold start, the account assets state
  // comes back empty, find a fix and then change these tests to cold-start again
  it.skip('should be able to handle ethereum payments urls for MATIC (polygon)', async () => {
    const url = escapeUrl(`ethereum:payment-${RAINBOW_WALLET_ADDRESS}@137?value=1e15`);
    await testEthereumDeeplink(url, false);
  });
});
