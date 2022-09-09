/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import { exec } from 'child_process';
import { hash } from '@ensdomains/eth-ens-namehash';
import { Contract } from '@ethersproject/contracts';
import * as Helpers from './helpers';
import publicResolverABI from '@/references/ens/ENSPublicResolver.json';

const ensPublicResolverAddress = '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41';

const RAINBOW_TEST_WALLET_NAME = 'rainbowtestwallet.eth';
const RECORD_CONTENTHASH =
  'ipfs://QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4';
const RECORD_TWITTER = 'twitter123';
const RECORD_EMAIL = 'abc@abc.com';
const RECORD_INSTAGRAM = 'insta123';
const RECORD_DISCORD = 'abc#8133';
const RECORD_GITHUB = 'github123';
const RECORD_SNAPCHAT = 'snapchat123';
const RECORD_TELEGRAM = 'telegram123';
const RECORD_REDDIT = 'reddit123';
const RECORD_PRONOUNS = 'they/them';
const RECORD_NOTICE = 'notice123';
const RECORD_KEYWORDS = 'keywords123';
const RECORD_URL = 'abc123.com';
const WALLET_AVATAR_COORDS = { x: 210, y: 125 };

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

  it('Should show Hardhat Toast after pressing Connect To Hardhat', async () => {
    await Helpers.waitAndTap('dev-button-hardhat');
    await Helpers.checkIfVisible('testnet-toast-Hardhat');
  });

  it('Should navigate to the Profile screen after swiping right', async () => {
    await Helpers.swipe('wallet-screen', 'right', 'slow');
    await Helpers.checkIfVisible('profile-screen');
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
    // Fill "Website" field
    console.log('TESTING1');
    await Helpers.checkIfVisible('ens-text-record-url');
    console.log('TESTING12');
    await Helpers.typeText('ens-text-record-url', 'abc');
    console.log('TESTING13');
    await Helpers.waitAndTap('ens-text-record-url-error');
    console.log('TESTING14');
    await Helpers.checkIfElementByTextToExist('Invalid URL');
    console.log('TESTING15');
    await Helpers.tapByText('OK');
    await Helpers.typeText('ens-text-record-url', '123.com');
    await Helpers.delay(1000);
    await Helpers.checkIfNotVisible('ens-text-record-url-error');

    // Fill "Twitter" field
    await Helpers.typeText('ens-text-record-com.twitter', RECORD_TWITTER);

    if (device.getPlatform() === 'android') {
      await Helpers.waitAndTap('hide-keyboard-button');
    }
    await Helpers.scrollToElement('ens-text-record-email', 'down');

    // Fill "Email" field
    await Helpers.typeText('ens-text-record-email', RECORD_EMAIL.slice(0, 3));
    await Helpers.waitAndTap('ens-text-record-email-error');
    await Helpers.checkIfElementByTextToExist('Invalid email');
    await Helpers.tapByText('OK');
    await Helpers.typeText('ens-text-record-email', RECORD_EMAIL.slice(3));
    await Helpers.delay(1000);
    await Helpers.checkIfNotVisible('ens-text-record-email-error');

    if (device.getPlatform() === 'android') {
      await Helpers.waitAndTap('hide-keyboard-button');
    }
    await Helpers.scrollToElement('ens-text-record-com.instagram', 'down');

    // Fill "Instagram" field
    await Helpers.typeText('ens-text-record-com.instagram', RECORD_INSTAGRAM);

    await Helpers.scrollToElement('ens-text-record-com.discord', 'up');

    // Fill "Discord" field
    await Helpers.typeText(
      'ens-text-record-com.discord',
      RECORD_DISCORD.slice(0, 3)
    );
    await Helpers.waitAndTap('ens-text-record-com.discord-error');
    await Helpers.checkIfElementByTextToExist('Invalid Discord username');
    await Helpers.tapByText('OK');
    await Helpers.typeText(
      'ens-text-record-com.discord',
      RECORD_DISCORD.slice(3)
    );
    await Helpers.delay(1000);
    await Helpers.checkIfNotVisible('ens-text-record-com.discord-error');

    await Helpers.scrollToElement('ens-text-record-com.github', 'up');

    // Fill "GitHub" field
    await Helpers.typeText('ens-text-record-com.github', RECORD_GITHUB);
  });

  it('Should fill & validate the fields 2', async () => {
    await Helpers.scrollToElement('ens-text-record-BTC', 'up');

    // Fill "Bitcoin" field
    await Helpers.typeText('ens-text-record-BTC', '1F1');
    await Helpers.waitAndTap('ens-text-record-BTC-error');
    await Helpers.checkIfElementByTextToExist('Invalid BTC address');
    await Helpers.tapByText('OK');
    await Helpers.typeText(
      'ens-text-record-BTC',
      'tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX'
    );
    await Helpers.delay(3000);
    await Helpers.checkIfNotVisible('ens-text-record-BTC-error');
  });

  it('Should fill & validate the fields 3', async () => {
    await Helpers.scrollToElement('ens-text-record-com.snapchat', 'up');

    // Fill "Snapchat" field
    await Helpers.typeText('ens-text-record-com.snapchat', RECORD_SNAPCHAT);

    await Helpers.scrollToElement('ens-text-record-org.telegram', 'up');

    // Fill "Telegram" field
    await Helpers.typeText('ens-text-record-org.telegram', RECORD_TELEGRAM);

    await Helpers.scrollToElement('ens-text-record-com.reddit', 'up');

    // Fill "Reddit" field
    await Helpers.typeText('ens-text-record-com.reddit', RECORD_REDDIT);

    await Helpers.scrollToElement('ens-text-record-pronouns', 'up');

    // Fill "Pronouns" field
    await Helpers.typeText('ens-text-record-pronouns', RECORD_PRONOUNS);

    await Helpers.scrollToElement('ens-text-record-notice', 'up');

    // Fill "Notice" field
    await Helpers.typeText('ens-text-record-notice', RECORD_NOTICE);

    await Helpers.scrollToElement('ens-text-record-keywords', 'up');

    // Fill "Keywords" field
    await Helpers.typeText('ens-text-record-keywords', RECORD_KEYWORDS);
  });

  it('Should fill & validate the fields 4', async () => {
    await Helpers.scrollToElement('ens-text-record-LTC', 'up');

    // Fill "Litecoin" field
    await Helpers.typeText('ens-text-record-LTC', 'MGx');
    await Helpers.waitAndTap('ens-text-record-LTC-error');
    await Helpers.checkIfElementByTextToExist('Invalid LTC address');
    await Helpers.tapByText('OK');
    await Helpers.typeText(
      'ens-text-record-LTC',
      'NPPB7eBoWPUaprtX9v9CXJZoD2465zN'
    );
    await Helpers.delay(3000);
    await Helpers.checkIfNotVisible('ens-text-record-LTC-error');

    // Fill "Content" field
    await Helpers.typeText(
      'ens-text-record-contenthash',
      RECORD_CONTENTHASH.slice(0, 3)
    );
    await Helpers.waitAndTap('ens-text-record-contenthash-error');
    await Helpers.checkIfElementByTextToExist('Invalid content hash');
    await Helpers.tapByText('OK');
    await Helpers.typeText(
      'ens-text-record-contenthash',
      RECORD_CONTENTHASH.slice(3)
    );
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
    await Helpers.typeText('ens-text-record-name', ' Guy');
    await Helpers.waitAndTap('hide-keyboard-button');
  });

  it('Should submit updated fields', async () => {
    await Helpers.checkIfVisible('ens-assign-records-review-action-button');
    await Helpers.waitAndTap('ens-assign-records-review-action-button');
    await Helpers.checkIfVisible(`ens-transaction-action-EDIT`);
    if (device.getPlatform() === 'ios') {
      await Helpers.waitAndTap(`ens-transaction-action-EDIT`);
    } else {
      await Helpers.tapAndLongPress('ens-transaction-action-EDIT');
      await Helpers.delay(1000);
      await Helpers.checkIfVisible('pin-authentication-screen');
      await Helpers.authenticatePin('1234');
    }
  });

  it('Should confirm the update was successful', async () => {
    const {
      contenthash,
      description,
      discord,
      email,
      github,
      instagram,
      reddit,
      snapchat,
      telegram,
      twitter,
      url,
    } = await getRecords(RAINBOW_TEST_WALLET_NAME);
    if (description) throw new Error('description should be empty');
    if (discord !== RECORD_DISCORD)
      throw new Error('discord is incorrect.', discord);
    if (email !== RECORD_EMAIL) throw new Error('email is incorrect.', email);
    if (github !== RECORD_GITHUB)
      throw new Error('github is incorrect.', github);
    if (instagram !== RECORD_INSTAGRAM)
      throw new Error('instagram is incorrect.', instagram);
    if (reddit !== RECORD_REDDIT)
      throw new Error('reddit is incorrect.', reddit);
    if (snapchat !== RECORD_SNAPCHAT)
      throw new Error('snapchat is incorrect.', snapchat);
    if (telegram !== RECORD_TELEGRAM)
      throw new Error('telegram is incorrect.', telegram);
    if (twitter !== RECORD_TWITTER)
      throw new Error('twitter is incorrect.', twitter);
    if (url !== RECORD_URL) throw new Error('url is incorrect.', url);
    if (contenthash !== RECORD_CONTENTHASH)
      throw new Error('contenthash is incorrect.', contenthash);
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
    await exec('kill $(lsof -t -i:8545)');
  });
});
