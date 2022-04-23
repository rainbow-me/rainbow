/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import { exec } from 'child_process';
import { hash } from '@ensdomains/eth-ens-namehash';
import { Contract } from '@ethersproject/contracts';
import * as Helpers from './helpers';
import registrarABI from '@rainbow-me/references/ens/ENSETHRegistrarController.json';
import publicResolverABI from '@rainbow-me/references/ens/ENSPublicResolver.json';
const ensETHRegistrarControllerAddress =
  '0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5';
const ensPublicResolverAddress = '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41';

const RANDOM_NAME = 'somerandomname321';
const RANDOM_NAME_ETH = RANDOM_NAME + '.eth';
const RECORD_BIO = 'my bio';
const RECORD_NAME = 'random';

const nameIsAvailable = async name => {
  const provider = Helpers.getProvider();
  const registrarContract = new Contract(
    ensETHRegistrarControllerAddress,
    registrarABI,
    provider
  );
  const nameIsAvailable = await registrarContract.available(name);
  return !!nameIsAvailable;
};

const getRecords = async ensName => {
  const provider = Helpers.getProvider();
  const publicResolver = new Contract(
    ensPublicResolverAddress,
    publicResolverABI,
    provider
  );
  const hashName = hash(ensName);
  const description = await publicResolver.text(hashName, 'description');
  const displayName = await publicResolver.text(
    hashName,
    'me.rainbow.displayName'
  );
  return { description, displayName };
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
    await Helpers.swipe('developer-settings-modal', 'up', 'slow');
    await Helpers.tapByText('ENS Profiles');
  });

  it('Should show Hardhat Toast after pressing Connect To Hardhat', async () => {
    await Helpers.sendETHtoTestWallet();

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
    await Helpers.checkIfVisible('ens-intro-sheet');
  });

  it('Should be able to press a profile and continue to the ENS search screen', async () => {
    await Helpers.swipe('ens-names-marquee', 'left', 'slow');
    await Helpers.swipe('ens-names-marquee', 'right', 'slow');
    await Helpers.waitAndTap('ens-intro-sheet-search-new-name-button');
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
    await Helpers.checkIfVisible('ens-text-record-me.rainbow.displayName');
    await Helpers.typeText(
      'ens-text-record-me.rainbow.displayName',
      RECORD_NAME,
      false
    );
    await Helpers.tapByText('Got it');
    await Helpers.checkIfVisible('ens-text-record-description');
    await Helpers.typeText('ens-text-record-description', RECORD_BIO, false);
    await Helpers.clearField('ens-text-record-me.rainbow.displayName');
    await Helpers.checkIfVisible('ens-assign-records-review-action-button');
    await Helpers.waitAndTap('ens-assign-records-review-action-button');
  });

  it('Should display warning on invalid custom gas price', async () => {
    await Helpers.tapByText('Normal');
    await Helpers.tapByText('Urgent');
  });

  it('Should go to review registration and start it', async () => {
    await Helpers.checkIfVisible(`ens-transaction-action-COMMIT`);
    await Helpers.waitAndTap(`ens-transaction-action-COMMIT`);
    await Helpers.delay(5000);
    await Helpers.checkIfVisible(
      `ens-confirm-register-label-WAIT_ENS_COMMITMENT`
    );
    await Helpers.delay(60000);
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
    const ensAvailable = await nameIsAvailable(RANDOM_NAME);
    if (ensAvailable) throw new Error('ENS name is available');
  });

  it('Should confirm that the bio record is set', async () => {
    const { description, displayName } = await getRecords(RANDOM_NAME_ETH);
    if (description !== RECORD_BIO) throw new Error('ENS description is wrong');
    if (displayName === RECORD_NAME)
      throw new Error('ENS displayName is wrong');
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
    await exec('kill $(lsof -t -i:8545)');
    await Helpers.delay(2000);
  });
});
