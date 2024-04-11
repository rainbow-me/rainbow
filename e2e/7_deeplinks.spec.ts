import { exec } from 'child_process';
import { device } from 'detox';
import {
  checkIfVisible,
  checkIfElementByTextIsVisible,
  swipe,
  tapAlertWithButton,
  beforeAllcleanApp,
  afterAllcleanApp,
  testEthereumDeeplink,
  importWalletFlow,
  openDeeplinkColdStart,
} from './helpers';

const RAINBOW_WALLET_ADDRESS = '0x7a3d05c70581bD345fe117c06e45f9669205384f';

const android = device.getPlatform() === 'android';

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
  await beforeAllcleanApp({ hardhat: false });
});
afterAll(async () => {
  await afterAllcleanApp({ hardhat: false });
});

describe('Deeplinks spec', () => {
  it('Should show the welcome screen', async () => {
    await importWalletFlow();
  });

  it('should reject ethereum urls for assets that are not in the wallet', async () => {
    const url = `ethereum:0xef2e9966eb61bb494e5375d5df8d67b7db8a780d@1/transfer?address=${RAINBOW_WALLET_ADDRESS}&uint256=1e15`;
    await openDeeplinkColdStart(url);
    await checkIfElementByTextIsVisible('Ooops!');
    await tapAlertWithButton('OK');
  });

  it('should show the Profile Sheet for rainbow.me universal links with ENS names', async () => {
    await openDeeplinkColdStart('https://rainbow.me/profile/rainbowwallet.eth');
    await checkIfVisible('profile-sheet');
    await checkIfElementByTextIsVisible('rainbowwallet.eth');
    await swipe('profile-sheet', 'down');
  });

  it('should show the Profile Sheet for rainbow.me universal links with 0x addresses', async () => {
    await openDeeplinkColdStart('https://rainbow.me/profile/0xE46aBAf75cFbFF815c0b7FfeD6F02B0760eA27f1');
    await checkIfVisible('profile-sheet');
    await checkIfElementByTextIsVisible('0xE46aBAf75cFbFF815c0b7FfeD6F02B0760eA27f1');
    await swipe('profile-sheet', 'down');
  });

  // these tests are really long running and add to the flakiness, so going
  // to skip everything below except 1 mainnet and one L2

  // FIXME: when doing open deeplinks with cold start, the account assets state
  // comes back empty, find a fix and then change these below tests to cold-start again
  it('should be able to handle ethereum payments urls for ETH (mainnet)', async () => {
    const url = escapeUrl(`ethereum:payment-${RAINBOW_WALLET_ADDRESS}@1?value=1e2`);
    await testEthereumDeeplink(url, false);
  });

  it('should be able to handle ethereum payments urls for ETH (optimism)', async () => {
    const url = escapeUrl(`ethereum:payment-${RAINBOW_WALLET_ADDRESS}@10?value=1e15`);
    await testEthereumDeeplink(url, false);
  });
});
