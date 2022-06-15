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
const RAINBOW_TEST_WALLET_NAME = 'rainbowtestwallet.eth';
const RAINBOW_TEST_WALLET_ADDRESS =
  '0x3Cb462CDC5F809aeD0558FBEe151eD5dC3D3f608';
const RECORD_BIO = 'my bio';
const RECORD_NAME = 'random';
const EIP155_FORMATTED_AVATAR_RECORD =
  'eip155:1/erc721:0x06012c8cf97bead5deae237070f9587f8e7a266d/1368227';

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
  const avatar = await publicResolver.text(hashName, 'avatar');
  return { avatar, description, displayName };
};

const resolveName = async ensName => {
  const provider = Helpers.getProvider();
  const address = await provider.resolveName(ensName);
  const primaryName = await provider.lookupAddress(address);
  return { address, primaryName };
};

const validatePrimaryName = async name => {
  const {
    address: rainbowAddress,
    primaryName: rainbowPrimaryName,
  } = await resolveName(RAINBOW_TEST_WALLET_NAME);
  const {
    address: randomAddress,
    primaryName: randomPrimaryName,
  } = await resolveName(RANDOM_NAME_ETH);

  if (
    rainbowAddress !== randomAddress ||
    rainbowAddress !== RAINBOW_TEST_WALLET_ADDRESS ||
    randomAddress !== RAINBOW_TEST_WALLET_ADDRESS
  )
    throw new Error('Resolved address is wrong');

  if (
    rainbowPrimaryName !== randomPrimaryName ||
    rainbowPrimaryName !== name ||
    randomPrimaryName !== name
  )
    throw new Error('Resolved name is wrong');
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

  it('Should send ETH to test wallet"', async () => {
    await Helpers.sendETHtoTestWallet();
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
    await Helpers.waitAndTap(
      'ens-intro-sheet-search-new-name-button-action-button'
    );
  });

  it('Should be able to type a name that is not available', async () => {
    await Helpers.checkIfVisible('ens-search-input');
    await Helpers.typeText('ens-search-input', 'rainbowwallet', false);
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

  it('Should go to view to set records', async () => {
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
    await Helpers.waitAndTap('use-select-image-avatar');
    await Helpers.tapByText('CryptoKitties');
    await Helpers.tapByText('Arun Cattybinky');
    await Helpers.checkIfVisible('ens-assign-records-review-action-button');
    await Helpers.waitAndTap('ens-assign-records-review-action-button');
  });

  it('Should display change gas to Urgent', async () => {
    await Helpers.waitAndTap('gas-speed-custom');
    await Helpers.waitAndTap('speed-pill-urgent');
    await Helpers.waitAndTap('gas-speed-done-button');
  });

  it('Should go to review registration and start it', async () => {
    await Helpers.checkIfVisible(`ens-transaction-action-COMMIT`);
    await Helpers.waitAndTap(`ens-transaction-action-COMMIT`);
    await Helpers.checkIfVisible(
      `ens-confirm-register-label-WAIT_ENS_COMMITMENT`
    );
    await Helpers.delay(60000);
  });

  it('Should see confirm registration screen and set reverse records', async () => {
    await Helpers.checkIfVisible(`ens-reverse-record-switch`);
    // set RANDOM_NAME as primary name
    await Helpers.waitAndTap('ens-reverse-record-switch');
    await Helpers.checkIfVisible(`ens-transaction-action-REGISTER`);
    await Helpers.waitAndTap(`ens-transaction-action-REGISTER`);
  });

  it('Should confirm that the name is not available anymore', async () => {
    const ensAvailable = await nameIsAvailable(RANDOM_NAME);
    if (ensAvailable) throw new Error('ENS name is available');
  });

  it('Should confirm that the bio record is set', async () => {
    const { description, displayName, avatar } = await getRecords(
      RANDOM_NAME_ETH
    );
    if (description !== RECORD_BIO) throw new Error('ENS description is wrong');
    if (displayName === RECORD_NAME)
      throw new Error('ENS displayName is wrong');
    if (avatar !== EIP155_FORMATTED_AVATAR_RECORD)
      throw new Error('ENS avatar is wrong');
  });

  it('Should confirm RANDOM_NAME is primary name', async () => {
    await validatePrimaryName(RANDOM_NAME_ETH);
  });

  it('Should navigate to the Wallet screen and refresh', async () => {
    await Helpers.swipe('profile-screen', 'left', 'slow');
    await Helpers.checkIfVisible('wallet-screen');
    await Helpers.swipe('wallet-screen', 'down', 'slow');
  });

  it('Should open ENS rainbowtestwallet.eth', async () => {
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.tapByText('ENS');
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.waitAndTap('wrapped-nft-rainbowtestwallet.eth');
  });

  it('Should use rainbowtestwallet.eth as primary name', async () => {
    await Helpers.swipe('unique-token-expanded-state', 'up', 'slow');
    await Helpers.waitAndTap('ens-reverse-record-switch');
    await Helpers.checkIfVisible(`ens-transaction-action-SET_NAME`);
    await Helpers.waitAndTap(`ens-transaction-action-SET_NAME`);
  });

  it('Should confirm rainbowtestwallet.eth is primary name', async () => {
    await validatePrimaryName(RAINBOW_TEST_WALLET_NAME);
  });

  it('Should navigate to the Wallet screen to renew', async () => {
    await Helpers.swipe('profile-screen', 'left', 'slow');
    await Helpers.checkIfVisible('wallet-screen');
  });

  it('Should open ENS rainbowtestwallet.eth to renew', async () => {
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.waitAndTap('wrapped-nft-rainbowtestwallet.eth');
  });

  it('Should renew rainbowtestwallet.eth', async () => {
    await Helpers.waitAndTap('unique-token-expanded-state-extend-duration');
    await Helpers.checkIfVisible(`ens-transaction-action-RENEW`);
    await Helpers.waitAndTap(`ens-transaction-action-RENEW`);
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
    await exec('kill $(lsof -t -i:8545)');
  });
});
