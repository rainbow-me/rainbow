/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import { hash } from '@ensdomains/eth-ens-namehash';
import { Contract } from '@ethersproject/contracts';
import * as Helpers from './helpers';
import registrarABI from '@/references/ens/ENSETHRegistrarController.json';
import publicResolverABI from '@/references/ens/ENSPublicResolver.json';

const ensETHRegistrarControllerAddress =
  '0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5';
const ensPublicResolverAddress = '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41';

const RANDOM_NAME = 'randomname321';
const RANDOM_NAME_ETH = RANDOM_NAME + '.eth';
const RAINBOW_TEST_WALLET_NAME = 'rainbowtestwallet.eth';
const RAINBOW_TEST_WALLET_ADDRESS =
  '0x3Cb462CDC5F809aeD0558FBEe151eD5dC3D3f608';
const RECORD_BIO = 'my bio';
const RECORD_NAME = 'random';
const EIP155_FORMATTED_AVATAR_RECORD =
  'eip155:1/erc721:0x06012c8cf97bead5deae237070f9587f8e7a266d/1368227';
const WALLET_AVATAR_COORDS = { x: 210, y: 125 };

const ios = device.getPlatform() === 'ios';
const android = device.getPlatform() === 'android';

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
  const resolver = await provider.getResolver(ensName);
  const hashName = hash(ensName);
  const [
    avatar,
    contenthash,
    description,
    name,
    url,
    twitter,
    email,
    instagram,
    discord,
    github,
    snapchat,
    telegram,
    reddit,
  ] = await Promise.all([
    publicResolver.text(hashName, 'avatar'),
    resolver.getContentHash(ensName),
    publicResolver.text(hashName, 'description'),
    publicResolver.text(hashName, 'name'),
    publicResolver.text(hashName, 'url'),
    publicResolver.text(hashName, 'com.twitter'),
    publicResolver.text(hashName, 'email'),
    publicResolver.text(hashName, 'com.instagram'),
    publicResolver.text(hashName, 'com.discord'),
    publicResolver.text(hashName, 'com.github'),
    publicResolver.text(hashName, 'com.snapchat'),
    publicResolver.text(hashName, 'org.telegram'),
    publicResolver.text(hashName, 'com.reddit'),
  ]);
  return {
    avatar,
    contenthash,
    description,
    discord,
    email,
    github,
    instagram,
    name,
    reddit,
    snapchat,
    telegram,
    twitter,
    url,
  };
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
  await Helpers.startHardhat();
  await Helpers.startIosSimulator();
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
    if (android) {
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

  it('Should show Hardhat Toast after pressing Connect To Hardhat', async () => {
    await Helpers.waitAndTap('dev-button-hardhat');
    await Helpers.checkIfVisible('testnet-toast-Hardhat');
  });

  it('Should navigate to the Discover sheet screen after tapping Discover Button', async () => {
    await Helpers.waitAndTap('discover-button');
    await Helpers.checkIfVisible('discover-header');
  });

  it('Should go to ENS search screen by pressing the ENS search banner', async () => {
    await Helpers.waitAndTap('ens-register-name-banner');
    await Helpers.checkIfVisible('ens-search-input');
    await Helpers.swipe('ens-search-sheet', 'down');
  });

  it('Should go to ENS flow pressing the ENS banner', async () => {
    android && (await Helpers.delay(2000));
    await Helpers.waitAndTap('ens-create-profile-card');
    await Helpers.checkIfVisible('ens-intro-sheet');
  });

  it('Should be able to press a profile and continue to the ENS search screen', async () => {
    await Helpers.waitAndTap(
      'ens-intro-sheet-search-new-name-button-action-button'
    );
  });

  it('Should be able to type a name that is not available', async () => {
    await Helpers.checkIfVisible('ens-search-input');
    await Helpers.typeText('ens-search-input', 'rainbowwallet', false);
    await Helpers.waitAndTap('ens-search-clear-button');
  });

  it('Should be able to type a name that has special characters', async () => {
    await Helpers.checkIfVisible('ens-search-input');
    await Helpers.typeText('ens-search-input', '/invalidname', false);
    await Helpers.waitAndTap('ens-search-clear-button');
    await Helpers.typeText('ens-search-input', '&&&ivalidname', false);
    await Helpers.waitAndTap('ens-search-clear-button');
    await Helpers.typeText('ens-search-input', '/invalidname/', false);
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
    await Helpers.checkIfVisible('ens-text-record-name');
    if (android) {
      await Helpers.waitAndTap('ens-text-record-name');
      await Helpers.tapByText('Got it');
    }
    await Helpers.typeText('ens-text-record-name', RECORD_NAME, false);
    if (ios) {
      await Helpers.tapByText('Got it');
    }
    await Helpers.checkIfVisible('ens-text-record-description');
    await Helpers.typeText('ens-text-record-description', RECORD_BIO, false);
    await Helpers.clearField('ens-text-record-name');
    await Helpers.waitAndTap('use-select-image-avatar');
    await Helpers.tapByText('CryptoKitties');
    await Helpers.tapByText('Arun Cattybinky');
    await Helpers.checkIfVisible('ens-assign-records-review-action-button');
    await Helpers.delay(2000);
    await Helpers.waitAndTap('ens-assign-records-review-action-button');
  });

  it('Should display change gas to Urgent', async () => {
    await Helpers.waitAndTap('gas-speed-custom');
    await Helpers.waitAndTap('speed-pill-urgent');
    await Helpers.waitAndTap('gas-speed-done-button');
  });

  it('Should go to review registration and start it', async () => {
    await Helpers.delay(2000);
    await Helpers.checkIfVisible(`ens-transaction-action-COMMIT`);
    if (ios) {
      await Helpers.waitAndTap(`ens-transaction-action-COMMIT`);
    } else {
      await Helpers.tapAndLongPress('ens-transaction-action-COMMIT');
    }
    await Helpers.delay(3000);
    if (android) {
      await Helpers.checkIfVisible('pin-authentication-screen');
      await Helpers.authenticatePin('1234');
    }
    await Helpers.delay(2000);
    await Helpers.checkIfVisible(
      `ens-confirm-register-label-WAIT_ENS_COMMITMENT`
    );
    await Helpers.delay(65000);
  });

  it('Should see confirm registration screen', async () => {
    await Helpers.checkIfVisible(`ens-transaction-action-REGISTER`);
    if (ios) {
      await Helpers.waitAndTap(`ens-transaction-action-REGISTER`);
    } else {
      await Helpers.tapAndLongPress('ens-transaction-action-REGISTER');
      await Helpers.delay(2000);
      await Helpers.checkIfVisible('pin-authentication-screen');
      await Helpers.authenticatePin('1234');
    }
  });

  it('Should confirm that the name is not available anymore', async () => {
    const ensAvailable = await nameIsAvailable(RANDOM_NAME);
    if (ensAvailable) throw new Error('ENS name is available');
  });

  it('Should confirm that the bio record is set', async () => {
    const { description, name, avatar } = await getRecords(RANDOM_NAME_ETH);
    if (description !== RECORD_BIO) throw new Error('ENS description is wrong');
    if (name === RECORD_NAME) throw new Error('ENS name is wrong');
    if (avatar !== EIP155_FORMATTED_AVATAR_RECORD)
      throw new Error('ENS avatar is wrong');
  });

  it('Should confirm RANDOM_NAME is primary name', async () => {
    await validatePrimaryName(RANDOM_NAME_ETH);
  });

  it('Should check new wallet name is the new ENS on profile screen and change wallet screen', async () => {
    await Helpers.swipe('profile-screen', 'left', 'slow');
    await Helpers.checkIfVisible('wallet-screen');
    await Helpers.checkIfVisible(
      `wallet-screen-account-name-${RANDOM_NAME_ETH}`
    );
    await Helpers.waitAndTap(`wallet-screen-account-name-${RANDOM_NAME_ETH}`);
    await Helpers.checkIfVisible(
      `change-wallet-address-row-label-${RANDOM_NAME_ETH}`
    );
    await Helpers.swipe('change-wallet-sheet-title', 'down', 'fast');
    await Helpers.swipe('wallet-screen', 'right', 'slow');
    await Helpers.tapByText(`${RANDOM_NAME_ETH}`);
    await Helpers.checkIfVisible(
      `change-wallet-address-row-label-${RANDOM_NAME_ETH}`
    );
    await Helpers.swipe('change-wallet-sheet-title', 'down', 'fast');
    await Helpers.swipe('profile-screen', 'left', 'slow');
  });

  it('Should open ENS rainbowtestwallet.eth', async () => {
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.tapByText('CryptoKitties');
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.waitAndTap('token-family-header-ENS');
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.waitAndTap('wrapped-nft-rainbowtestwallet.eth');
  });

  it('Should be able to navigate to the Edit screen', async () => {
    await Helpers.waitAndTap('edit-action-button');
    await Helpers.checkIfVisible('ens-assign-records-sheet');
    await Helpers.swipe('ens-assign-records-sheet', 'down');
  });

  it('Should use rainbowtestwallet.eth as primary name', async () => {
    await Helpers.delay(2000);
    await Helpers.swipe('unique-token-expanded-state', 'up', 'slow');
    await Helpers.waitAndTap('ens-reverse-record-switch');
    await Helpers.checkIfVisible(`ens-transaction-action-SET_NAME`);
    if (ios) {
      await Helpers.waitAndTap(`ens-transaction-action-SET_NAME`);
    } else {
      await Helpers.tapAndLongPress('ens-transaction-action-SET_NAME');
      await Helpers.delay(1000);
      await Helpers.checkIfVisible('pin-authentication-screen');
      await Helpers.authenticatePin('1234');
    }
  });

  it('Should confirm rainbowtestwallet.eth is primary name', async () => {
    await validatePrimaryName(RAINBOW_TEST_WALLET_NAME);
  });

  it('Should check wallet name is the new ENS set as primary on profile screen and change wallet screen', async () => {
    await Helpers.swipe('profile-screen', 'left', 'slow');
    await Helpers.checkIfVisible('wallet-screen');
    await Helpers.checkIfVisible(
      `wallet-screen-account-name-${RAINBOW_TEST_WALLET_NAME}`
    );
    await Helpers.swipe('wallet-screen', 'right', 'fast');
    await Helpers.tapByText(RAINBOW_TEST_WALLET_NAME);
    await Helpers.checkIfVisible(
      `change-wallet-address-row-label-${RAINBOW_TEST_WALLET_NAME}`
    );
    await Helpers.swipe('change-wallet-sheet-title', 'down', 'fast');
  });

  it('Should open the View Profile Sheet after tapping "View Profile"', async () => {
    await Helpers.tapAtPoint('profile-screen', WALLET_AVATAR_COORDS);
    await Helpers.checkIfExistsByText('View Profile');
    await Helpers.tapByText('View Profile');
    await Helpers.checkIfExists('profile-sheet');
    await Helpers.delay(2000);
    await Helpers.checkIfExistsByText('rainbowtestwallet.eth');
    await Helpers.checkIfExistsByText('Test 2');
    await Helpers.swipe('profile-sheet', 'down');
    await Helpers.delay(1000);
  });

  it('Should open the Edit Profile Sheet after tapping "Edit Profile"', async () => {
    await Helpers.tapAtPoint('profile-screen', WALLET_AVATAR_COORDS);
    await Helpers.checkIfExistsByText('Edit Profile');
    await Helpers.tapByText('Edit Profile');
    await Helpers.checkIfExists('ens-edit-records-sheet');
    await Helpers.checkIfExistsByText('rainbowtestwallet.eth');
    await Helpers.checkIfExistsByText('Name');
    await Helpers.checkIfExistsByText('Bio');
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
    await Helpers.killHardhat();
  });
});
