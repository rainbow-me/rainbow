/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import { exec } from 'child_process';
import { Contract } from '@ethersproject/contracts';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { ethers } from 'ethers';
import * as Helpers from './helpers';
import registratABI from '@rainbow-me/references/ens/ENSETHRegistrarController.json';

const TESTING_WALLET = '0x3Cb462CDC5F809aeD0558FBEe151eD5dC3D3f608';

const RANDOM_NAME = 'somerandomname321';
const ensETHRegistrarControllerAddress =
  '0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5';

const getProvider = () => {
  if (!getProvider._instance) {
    getProvider._instance = new JsonRpcProvider(
      device.getPlatform() === 'ios'
        ? process.env.HARDHAT_URL_IOS
        : process.env.HARDHAT_URL_ANDROID,
      'any'
    );
  }
  return getProvider._instance;
};

const isAvailable = async name => {
  const provider = getProvider();
  const registrarContract = new Contract(
    ensETHRegistrarControllerAddress,
    registratABI,
    provider
  );
  const isAvailable = await registrarContract.available(name);
  return !!isAvailable;
};

const sendETHtoTestWallet = async () => {
  const provider = getProvider();
  // Hardhat account 0 that has 10000 ETH
  const wallet = new Wallet(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    provider
  );
  // Sending 20 ETH so we have enough to pay the tx fees even when the gas is too high
  await wallet.sendTransaction({
    to: TESTING_WALLET,
    value: ethers.utils.parseEther('20'),
  });
  return true;
};

beforeAll(async () => {
  // Connect to hardhat
  await exec('yarn hardhat');
  await exec(
    'open /Applications/Xcode.app/Contents/Developer/Applications/Simulator.app/'
  );
});

describe('Register ENS Flow', () => {
  it('Should show the welcome screen', async () => {
    await Helpers.checkIfVisible('welcome-screen');
  });

  it('Should show the "Restore Sheet" after tapping on "I already have a wallet"', async () => {
    await Helpers.waitAndTap('already-have-wallet-button');
    await Helpers.checkIfExists('restore-sheet');
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
    await Helpers.checkIfVisible('wallet-screen', 80000);
    await Helpers.enableSynchronization();
  });

  it('Should navigate to the Profile screen after swiping right', async () => {
    await Helpers.swipe('wallet-screen', 'right', 'slow');
    await Helpers.checkIfVisible('profile-screen');
  });

  it('Should navigate to Settings Modal after tapping Settings Button', async () => {
    await Helpers.waitAndTap('settings-button');
    await Helpers.checkIfVisible('settings-modal');
  });

  it('Should navigate to Developer Settings after tapping Developer Section', async () => {
    await Helpers.waitAndTap('developer-section');
    await Helpers.checkIfVisible('developer-settings-modal');
  });

  it('Should make ENS Profiles available', async () => {
    await Helpers.tapByText('ENS Profiles');
  });

  it('Should show Hardhat Toast after pressing Connect To Hardhat', async () => {
    await sendETHtoTestWallet();

    await Helpers.waitAndTap('hardhat-section');
    await Helpers.checkIfVisible('testnet-toast-Hardhat');
  });

  it('Should navigate to the Wallet screen after swiping left', async () => {
    await Helpers.swipe('profile-screen', 'left', 'slow');
    await Helpers.checkIfVisible('wallet-screen');
  });

  it('Should navigate to the Discover sheet screen after tapping Discover Button', async () => {
    await Helpers.waitAndTap('discover-button');
    await Helpers.checkIfVisible('discover-header');
  });

  it('Should go to ENS flow pressing the ENS banner', async () => {
    await Helpers.waitAndTap('ens-register-name-banner');
  });

  it('Should be able to type a name that is not available', async () => {
    await Helpers.checkIfVisible('ens-search-input');
    await Helpers.typeText('ens-search-input', 'rainbowwallet', false);
    await Helpers.delay(3000);
    await Helpers.waitAndTap('ens-search-clear-button');
  });

  it('Should be able to type a name that is available and wait for fees', async () => {
    await Helpers.checkIfVisible('ens-search-input');
    await Helpers.typeText('ens-search-input', RANDOM_NAME, false);
  });

  it('Should be able to see network fees and name rent price', async () => {
    await Helpers.checkIfVisible('ens-search-input');
    await Helpers.checkIfVisible('ens-registration-fees');
    await Helpers.checkIfVisible('ens-registration-price');
  });

  it('Should go to view to set records and skip it', async () => {
    await Helpers.checkIfVisible('ens-search-continue-action-button');
    await Helpers.waitAndTap('ens-search-continue-action-button');
    await Helpers.checkIfVisible('ens-assign-records-skip');
    await Helpers.waitAndTap('ens-assign-records-skip');
  });

  it('Should go to come back to records view and add some', async () => {
    await Helpers.checkIfVisible('ens-confirm-register-sheet');
    // await Helpers.swipe('ens-confirm-register-sheet', 'down', 'slow');
    // await Helpers.tapByText('Email');
    // await Helpers.tapByText('Twitter');
    const ensAvailable = await isAvailable(RANDOM_NAME);
    if (!ensAvailable) throw new Error('ENS name not available');
    // await Helpers.typeText('ens-text-record-name', RANDOM_NAME);
    // await Helpers.typeText('ens-text-record-bio', 'this is my bio');
    // await Helpers.waitAndTap('ens-assign-records-review-action-button');
  });

  it('Should go to review registration and start it', async () => {
    await Helpers.checkIfVisible(`ens-transaction-action-COMMIT`);
    await Helpers.disableSynchronization();
    await Helpers.delay(5000);
    await Helpers.waitAndTap(`ens-transaction-action-COMMIT`);
    await Helpers.delay(2000);
    await Helpers.checkIfVisible(
      `ens-confirm-register-label-WAIT_COMMIT_CONFIRMATION`
    );
    await Helpers.delay(10000);
    await Helpers.checkIfVisible(
      `ens-confirm-register-label-WAIT_ENS_COMMITMENT`
    );
    await Helpers.delay(60000);
    await Helpers.enableSynchronization();
  });

  it('Should see confirm registration screen and set reverse records', async () => {
    await Helpers.checkIfVisible(`ens-reverse-record-switch`);
    await Helpers.waitAndTap('ens-reverse-record-switch');
    await Helpers.waitAndTap('ens-reverse-record-switch');
    await Helpers.checkIfVisible(`ens-transaction-action-REGISTER`);
    await Helpers.waitAndTap(`ens-transaction-action-REGISTER`);
  });

  it('Should confirm that the name is not available anymore', async () => {
    await Helpers.delay(2000);
    const ensAvailable = await isAvailable(RANDOM_NAME);
    if (ensAvailable) throw new Error('ENS name is available');
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
    await exec('kill $(lsof -t -i:8545)');
    await Helpers.delay(2000);
  });
});
