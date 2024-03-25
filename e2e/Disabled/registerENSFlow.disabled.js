import { hash } from '@ensdomains/eth-ens-namehash';
import { Contract } from '@ethersproject/contracts';
import * as Helpers from '../helpers';
import registrarABI from '@/references/ens/ENSETHRegistrarController.json';
import publicResolverABI from '@/references/ens/ENSPublicResolver.json';
import registryWithFallbackABI from '@/references/ens/ENSRegistryWithFallback.json';
import { device } from 'detox';

const ensETHRegistrarControllerAddress = '0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5';
const ensPublicResolverAddress = '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41';
const ensRegistryAddress = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';

const RANDOM_NAME = 'randomname321';
const RANDOM_NAME_ETH = RANDOM_NAME + '.eth';
const RAINBOW_TEST_WALLET_NAME = 'rainbowtestwallet.eth';
const RAINBOW_TEST_WALLET_ADDRESS = '0x3Cb462CDC5F809aeD0558FBEe151eD5dC3D3f608';
const RAINBOW_WALLET_NAME = 'rainbowwallet.eth';
const RAINBOW_WALLET_ADDRESS = '0x7a3d05c70581bD345fe117c06e45f9669205384f';
const RECORD_BIO = 'my bio';
const RECORD_NAME = 'random';
const RECORD_CONTENTHASH = 'ipfs://QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4';
const RECORD_TWITTER = 'twitter123';
const RECORD_EMAIL = 'abc@abc.com';
const RECORD_INSTAGRAM = 'insta123';
const RECORD_DISCORD = 'abc#8133';
const RECORD_GITHUB = 'github-123';
const RECORD_SNAPCHAT = 'snapchat123';
const RECORD_TELEGRAM = 'telegram123';
const RECORD_REDDIT = 'reddit123';
const RECORD_PRONOUNS = 'they/them';
const RECORD_NOTICE = 'notice123';
const RECORD_KEYWORDS = 'keywords123';
const RECORD_URL = 'abc123.com';
const EIP155_FORMATTED_AVATAR_RECORD = 'eip155:1/erc721:0x06012c8cf97bead5deae237070f9587f8e7a266d/1368227';
const WALLET_AVATAR_COORDS = { x: 210, y: 125 };

const ios = device.getPlatform() === 'ios';
const android = device.getPlatform() === 'android';

const address = (address, start, finish) => [address.substring(0, start), address.substring(address.length - finish)].join('...');

const nameIsAvailable = async name => {
  const provider = Helpers.getProvider();
  const registrarContract = new Contract(ensETHRegistrarControllerAddress, registrarABI, provider);
  const nameIsAvailable = await registrarContract.available(name);
  return !!nameIsAvailable;
};

const getNameOwner = async ensName => {
  const provider = Helpers.getProvider();
  const registry = new Contract(ensRegistryAddress, registryWithFallbackABI, provider);
  const owner = await registry.owner(hash(ensName));
  return owner;
};

const getRecords = async ensName => {
  const provider = Helpers.getProvider();
  const publicResolver = new Contract(ensPublicResolverAddress, publicResolverABI, provider);
  const resolver = await provider.getResolver(ensName);
  const hashName = hash(ensName);
  const [avatar, contenthash, description, name, url, twitter, email, instagram, discord, github, snapchat, telegram, reddit] =
    await Promise.all([
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
  const { address: rainbowAddress, primaryName: rainbowPrimaryName } = await resolveName(RAINBOW_TEST_WALLET_NAME);
  const { address: randomAddress, primaryName: randomPrimaryName } = await resolveName(RANDOM_NAME_ETH);

  if (rainbowAddress !== randomAddress || rainbowAddress !== RAINBOW_TEST_WALLET_ADDRESS || randomAddress !== RAINBOW_TEST_WALLET_ADDRESS)
    throw new Error('Resolved address is wrong');

  if (rainbowPrimaryName !== randomPrimaryName || rainbowPrimaryName !== name || randomPrimaryName !== name)
    throw new Error('Resolved name is wrong');
};

beforeAll(async () => {
  await Helpers.startHardhat();
  await Helpers.startIosSimulator();
});

describe.skip('Register ENS Flow', () => {
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
    await Helpers.checkIfElementHasString('import-sheet-button-label', 'Continue');
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

  it('Should navigate to the Discover sheet screen after swiping left', async () => {
    await Helpers.swipe('wallet-screen', 'left', 'slow');
    await Helpers.checkIfVisible('discover-header');
  });

  it('Should go to ENS search screen by pressing the ENS search banner', async () => {
    await Helpers.waitAndTap('ens-register-name-banner');
    await Helpers.checkIfVisible('ens-search-input');
    await Helpers.swipe('ens-search-sheet', 'down');
  });

  it('Should go to ENS flow pressing the ENS banner', async () => {
    device.getPlatform() === 'android' && (await Helpers.delay(2000));
    await Helpers.swipe('discover-sheet', 'up', 'slow', 0.2);
    await Helpers.waitAndTap('ens-create-profile-card');
    await Helpers.checkIfVisible('ens-intro-sheet');
  });

  it('Should be able to press a profile and continue to the ENS search screen', async () => {
    await Helpers.waitAndTap('ens-intro-sheet-search-new-name-button-action-button');
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

  // FIXME: This is the problem with a review button being tapped but detox not
  // registering the action and timing out and leaving the state of the app in
  // a place where all following tests are failing.
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
    if (ios) {
      await Helpers.checkIfVisible(`ens-confirm-register-label-WAIT_ENS_COMMITMENT`);
    }
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

  if (ios) {
    // TODO
    it('Should confirm that the name is not available anymore', async () => {
      const ensAvailable = await nameIsAvailable(RANDOM_NAME);
      if (ensAvailable) throw new Error('ENS name is available');
    });

    it('Should confirm that the bio record is set', async () => {
      const { description, name, avatar } = await getRecords(RANDOM_NAME_ETH);
      if (description !== RECORD_BIO) throw new Error('ENS description is wrong');
      if (name === RECORD_NAME) throw new Error('ENS name is wrong');
      if (typeof avatar === 'string' && avatar.toLowerCase() !== EIP155_FORMATTED_AVATAR_RECORD) throw new Error('ENS avatar is wrong');
    });

    it('Should confirm RANDOM_NAME is primary name', async () => {
      await validatePrimaryName(RANDOM_NAME_ETH);
    });
  }

  it('Should check new wallet name is the new ENS on profile screen and change wallet screen', async () => {
    await Helpers.swipe('profile-screen', 'left', 'slow');
    await Helpers.checkIfVisible('wallet-screen');
    await Helpers.checkIfExists(`profile-name-${RANDOM_NAME_ETH}`);
    await Helpers.tap(`profile-name-${RANDOM_NAME_ETH}`);
    await Helpers.checkIfVisible(`change-wallet-address-row-label-${RANDOM_NAME_ETH}`);
    await Helpers.swipe('change-wallet-sheet-title', 'down', 'fast');
    await Helpers.swipe('wallet-screen', 'right', 'slow');
    await Helpers.tapAtPoint('profile-screen', { x: 210, y: 185 });
    await Helpers.checkIfVisible(`change-wallet-address-row-label-${RANDOM_NAME_ETH}`);
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
    await Helpers.swipe('unique-mainnet-expanded-state', 'up', 'slow');
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
    await Helpers.checkIfExists(`profile-name-${RAINBOW_TEST_WALLET_NAME}`);
    await Helpers.swipe('wallet-screen', 'right', 'slow');
    await Helpers.tapAtPoint('profile-screen', { x: 210, y: 185 });
    await Helpers.checkIfVisible(`change-wallet-address-row-label-${RAINBOW_TEST_WALLET_NAME}`);
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

  it('Should select ENS attributes in the Edit Profile Sheet', async () => {
    // Select all the attributes
    await Helpers.waitAndTap('ens-selectable-attribute-website');
    await Helpers.waitAndTap('ens-selectable-attribute-twitter');
    await Helpers.waitAndTap('ens-selectable-attribute-email');
    await Helpers.waitAndTap('ens-selectable-attribute-instagram');
    await Helpers.waitAndTap('ens-selectable-attribute-discord');
    await Helpers.waitAndTap('ens-selectable-attribute-github');
    await Helpers.waitAndTap('ens-selectable-attribute-btc');
    await Helpers.waitAndTap('ens-selectable-attribute-dots');
    await Helpers.waitAndTap('ens-selectable-attribute-snapchat');
    await Helpers.waitAndTap('ens-selectable-attribute-telegram');
    await Helpers.waitAndTap('ens-selectable-attribute-reddit');
    await Helpers.waitAndTap('ens-selectable-attribute-pronouns');
    await Helpers.waitAndTap('ens-selectable-attribute-notice');
    await Helpers.waitAndTap('ens-selectable-attribute-keywords');
    await Helpers.waitAndTap('ens-selectable-attribute-ltc');
    await Helpers.waitAndTap('ens-selectable-attribute-doge');
    await Helpers.waitAndTap('ens-selectable-attribute-contenthash');

    // Dismiss the bottom attribute sheet
    await Helpers.swipe('ens-additional-records-sheet', 'down');
  });

  it('Should fill & validate the fields', async () => {
    await Helpers.delay(2000);
    // Fill "Website" field
    await Helpers.checkIfVisible('ens-text-record-url');
    await Helpers.typeText('ens-text-record-url', 'abc', false);
    await Helpers.waitAndTap('ens-text-record-url-error');
    await Helpers.checkIfElementByTextToExist('Invalid URL');
    await Helpers.tapByText('OK');
    await Helpers.typeText('ens-text-record-url', '123.com', false);
    await Helpers.delay(1000);
    await Helpers.checkIfNotVisible('ens-text-record-url-error');

    // Fill "Twitter" field
    await Helpers.typeText('ens-text-record-com.twitter', RECORD_TWITTER, false);

    await Helpers.swipe('ens-edit-records-sheet', 'up', 'slow', 0.15);

    // Fill "Email" field
    await Helpers.typeText('ens-text-record-email', RECORD_EMAIL.slice(0, 3), false);
    await Helpers.waitAndTap('ens-text-record-email-error');
    await Helpers.checkIfElementByTextToExist('Invalid email');
    await Helpers.tapByText('OK');
    await Helpers.typeText('ens-text-record-email', RECORD_EMAIL.slice(3), false);
    await Helpers.delay(1000);
    await Helpers.checkIfNotVisible('ens-text-record-email-error');

    if (android) {
      await Helpers.swipe('ens-edit-records-sheet', 'up', 'slow', 0.15, ios ? 0.15 : 0.3);
    }
    // Fill "Instagram" field
    await Helpers.typeText('ens-text-record-com.instagram', RECORD_INSTAGRAM, false);

    await Helpers.swipe('ens-edit-records-sheet', 'up', 'slow', 0.15, ios ? 0.15 : 0.3);

    // Fill "Discord" field
    await Helpers.typeText('ens-text-record-com.discord', RECORD_DISCORD.slice(0, 3), false);
    await Helpers.waitAndTap('ens-text-record-com.discord-error');
    await Helpers.checkIfElementByTextToExist('Invalid Discord username');
    await Helpers.tapByText('OK');
    await Helpers.typeText('ens-text-record-com.discord', RECORD_DISCORD.slice(3), false);
    await Helpers.delay(1000);
    await Helpers.checkIfNotVisible('ens-text-record-com.discord-error');

    // Fill "GitHub" field
    await Helpers.typeText('ens-text-record-com.github', RECORD_GITHUB, false);

    await Helpers.swipe('ens-edit-records-sheet', 'up', 'slow', 0.15, ios ? undefined : 0.3);
  });

  it('Should fill & validate the fields 2', async () => {
    // Fill "Bitcoin" field
    await Helpers.typeText('ens-text-record-BTC', '1F1', false);
    await Helpers.waitAndTap('ens-text-record-BTC-error');
    await Helpers.checkIfElementByTextToExist('Invalid BTC address');
    await Helpers.tapByText('OK');
    await Helpers.typeText('ens-text-record-BTC', 'tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX', false);
    await Helpers.delay(3000);
    await Helpers.checkIfNotVisible('ens-text-record-BTC-error');
  });

  it('Should fill & validate the fields 3', async () => {
    await Helpers.swipe('ens-edit-records-sheet', 'up', 'slow', 0.15, ios ? undefined : 0.3);

    // Fill "Snapchat" field
    await Helpers.typeText('ens-text-record-com.snapchat', RECORD_SNAPCHAT, false);

    if (!ios) {
      await Helpers.swipe('ens-edit-records-sheet', 'up', 'slow', 0.3, 0.3);
    }

    // Fill "Telegram" field
    await Helpers.typeText('ens-text-record-org.telegram', RECORD_TELEGRAM, false);

    await Helpers.swipe('ens-edit-records-sheet', 'up', 'slow', 0.15, ios ? undefined : 0.3);

    // Fill "Reddit" field
    await Helpers.typeText('ens-text-record-com.reddit', RECORD_REDDIT, false);

    // Fill "Pronouns" field
    await Helpers.typeText('ens-text-record-pronouns', RECORD_PRONOUNS, false);

    await Helpers.swipe('ens-edit-records-sheet', 'up', 'slow', 0.15, ios ? undefined : 0.3);

    // Fill "Notice" field
    await Helpers.typeText('ens-text-record-notice', RECORD_NOTICE, false);

    // Fill "Keywords" field
    await Helpers.typeText('ens-text-record-keywords', RECORD_KEYWORDS, false);

    await Helpers.swipe('ens-edit-records-sheet', 'up', 'slow', 0.15, ios ? undefined : 0.3);
    await Helpers.swipe('ens-edit-records-sheet', 'up', 'slow', 0.15, ios ? undefined : 0.3);
  });

  it('Should fill & validate the fields 4', async () => {
    // Fill "Litecoin" field
    await Helpers.typeText('ens-text-record-LTC', 'MGx', false);
    await Helpers.waitAndTap('ens-text-record-LTC-error');
    await Helpers.checkIfElementByTextToExist('Invalid LTC address');
    await Helpers.tapByText('OK');
    await Helpers.typeText('ens-text-record-LTC', 'NPPB7eBoWPUaprtX9v9CXJZoD2465zN', false);
    await Helpers.delay(3000);
    await Helpers.checkIfNotVisible('ens-text-record-LTC-error');

    // Fill "Content" field
    await Helpers.typeText('ens-text-record-contenthash', RECORD_CONTENTHASH.slice(0, 3), false);
    await Helpers.waitAndTap('ens-text-record-contenthash-error');
    await Helpers.checkIfElementByTextToExist('Invalid content hash');
    await Helpers.tapByText('OK');
    await Helpers.typeText('ens-text-record-contenthash', RECORD_CONTENTHASH.slice(3), false);
    await Helpers.delay(3000);
    await Helpers.checkIfNotVisible('ens-text-record-contenthash-error');
  });

  it('Should unselect a field', async () => {
    await Helpers.swipe('ens-edit-records-sheet', 'down');
    await Helpers.waitAndTap('hide-keyboard-button');
    await Helpers.waitAndTap('ens-selectable-attribute-bio');
    await Helpers.checkIfNotVisible('ens-text-record-description');
  });

  it('Should update a field', async () => {
    await Helpers.typeText('ens-text-record-name', ' Guy', false);
    await Helpers.waitAndTap('hide-keyboard-button');
  });

  it('Should submit updated fields', async () => {
    await Helpers.checkIfVisible('ens-assign-records-review-action-button');
    await Helpers.waitAndTap('ens-assign-records-review-action-button');
    await Helpers.checkIfVisible(`ens-transaction-action-EDIT`);
    if (ios) {
      await Helpers.waitAndTap(`ens-transaction-action-EDIT`);
    } else {
      await Helpers.tapAndLongPress('ens-transaction-action-EDIT');
      await Helpers.delay(1000);
      await Helpers.checkIfVisible('pin-authentication-screen');
      await Helpers.authenticatePin('1234');
    }
  });

  if (ios) {
    // TODO
    it('Should confirm the update was successful', async () => {
      const { contenthash, description, discord, email, github, instagram, reddit, snapchat, telegram, twitter, url } =
        await getRecords(RAINBOW_TEST_WALLET_NAME);
      if (description) throw new Error('description should be empty');
      if (discord !== RECORD_DISCORD) throw new Error('discord is incorrect.', discord);
      if (email !== RECORD_EMAIL) throw new Error('email is incorrect.', email);
      if (github !== RECORD_GITHUB) throw new Error('github is incorrect.', github);
      if (instagram !== RECORD_INSTAGRAM) throw new Error('instagram is incorrect.', instagram);
      if (reddit !== RECORD_REDDIT) throw new Error('reddit is incorrect.', reddit);
      if (snapchat !== RECORD_SNAPCHAT) throw new Error('snapchat is incorrect.', snapchat);
      if (telegram !== RECORD_TELEGRAM) throw new Error('telegram is incorrect.', telegram);
      if (twitter !== RECORD_TWITTER) throw new Error('twitter is incorrect.', twitter);
      if (url !== RECORD_URL) throw new Error('url is incorrect.', url);
      if (contenthash !== RECORD_CONTENTHASH) throw new Error('contenthash is incorrect.', contenthash);
    });
  }

  it('Should navigate to the Wallet screen to renew', async () => {
    await Helpers.swipe('profile-screen', 'left', 'slow');
    await Helpers.checkIfVisible('wallet-screen');
  });

  it('Should open ENS rainbowtestwallet.eth to renew', async () => {
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.waitAndTap('wrapped-nft-rainbowtestwallet.eth');
  });

  it('Should renew rainbowtestwallet.eth', async () => {
    await Helpers.waitAndTap('unique-mainnet-expanded-state-extend-duration');
    await Helpers.checkIfVisible(`ens-transaction-action-RENEW`);
    if (ios) {
      await Helpers.waitAndTap(`ens-transaction-action-RENEW`);
    } else {
      await Helpers.tapAndLongPress('ens-transaction-action-RENEW');
      await Helpers.delay(1000);
      await Helpers.checkIfVisible('pin-authentication-screen');
      await Helpers.authenticatePin('1234');
    }
  });

  it('Should navigate to the Wallet screen to send ENS from renew tx', async () => {
    await Helpers.swipe('profile-screen', 'left', 'slow');
    await Helpers.checkIfVisible('wallet-screen');
  });

  it('Should open ENS rainbowtestwallet.eth to send ENS', async () => {
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.tapByText('CryptoKitties');
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.waitAndTap('wrapped-nft-rainbowtestwallet.eth');
    await Helpers.waitAndTap('send-action-button');
  });

  it('Should go to review send ENS', async () => {
    await Helpers.typeText('send-asset-form-field', 'rainbowwallet.eth\n');
    await Helpers.waitAndTap('gas-speed-custom');
    await Helpers.waitAndTap('speed-pill-urgent');
    await Helpers.waitAndTap('gas-speed-done-button');
    await Helpers.waitAndTap('send-sheet-confirm-action-button');
  });

  it('Should press all ENS options', async () => {
    await Helpers.waitAndTap('clear-records');
    await Helpers.waitAndTap('set-address');
    await Helpers.waitAndTap('transfer-control');
    if (ios) {
      await Helpers.waitAndTap(`send-confirmation-button`);
    } else {
      await Helpers.tapAndLongPress('send-confirmation-button');
      await Helpers.delay(1000);
      await Helpers.checkIfVisible('pin-authentication-screen');
      await Helpers.authenticatePin('1234');
    }
  });

  it.skip('Should confirm the ENS was sent correctly', async () => {
    await Helpers.delay(1000);
    const { name } = await getRecords(RAINBOW_TEST_WALLET_NAME);
    const { address, primaryName } = await resolveName(RAINBOW_TEST_WALLET_NAME);
    const owner = await getNameOwner(RAINBOW_TEST_WALLET_NAME);
    if (address !== RAINBOW_WALLET_ADDRESS) throw new Error('Resolved address is wrong');
    if (primaryName !== RAINBOW_WALLET_NAME) throw new Error('Resolved primary name is wrong');
    if (name) throw new Error('name is wrong');
    if (owner !== RAINBOW_WALLET_ADDRESS) throw new Error('Owner not set correctly');
  });

  it.skip('Should check address is the new label on profile screen and change wallet screen', async () => {
    const TRUNCATED_ADDRESS = address(RAINBOW_TEST_WALLET_ADDRESS, 4, 4);
    const WALLET_ROW_TRUNCATED_ADDRESS = address(RAINBOW_TEST_WALLET_ADDRESS, 6, 4);
    await Helpers.swipe('profile-screen', 'left', 'slow');
    await Helpers.checkIfVisible('wallet-screen');
    await Helpers.checkIfExists(`profile-name-sticky-${TRUNCATED_ADDRESS}`);
    await Helpers.waitAndTap(`profile-name-sticky-${TRUNCATED_ADDRESS}`);
    await Helpers.checkIfVisible(`change-wallet-address-row-label-${WALLET_ROW_TRUNCATED_ADDRESS}`);
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
    await Helpers.killHardhat();
  });
});
