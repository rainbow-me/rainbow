/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */
import { exec } from 'child_process';
import { hash } from '@ensdomains/eth-ens-namehash';
import { Contract } from '@ethersproject/contracts';
import * as Helpers from './helpers';
import registrarABI from '@/references/ens/ENSETHRegistrarController.json';
import publicResolverABI from '@/references/ens/ENSPublicResolver.json';
import registryWithFallbackABI from '@/references/ens/ENSRegistryWithFallback.json';

const ensETHRegistrarControllerAddress =
  '0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5';
const ensPublicResolverAddress = '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41';
const ensRegistryAddress = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';

const RANDOM_NAME = 'randomname321';
const RANDOM_NAME_ETH = RANDOM_NAME + '.eth';
const RAINBOW_TEST_WALLET_NAME = 'rainbowtestwallet.eth';
const RAINBOW_TEST_WALLET_ADDRESS =
  '0x3Cb462CDC5F809aeD0558FBEe151eD5dC3D3f608';
const RAINBOW_WALLET_NAME = 'rainbowwallet.eth';
const RAINBOW_WALLET_ADDRESS = '0x7a3d05c70581bD345fe117c06e45f9669205384f';
const RECORD_BIO = 'my bio';
const RECORD_NAME = 'random';
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
const EIP155_FORMATTED_AVATAR_RECORD =
  'eip155:1/erc721:0x06012c8cf97bead5deae237070f9587f8e7a266d/1368227';
const WALLET_AVATAR_COORDS = { x: 210, y: 125 };

const address = (address, start, finish) =>
  [
    address.substring(0, start),
    address.substring(address.length - finish),
  ].join('...');

const getNameOwner = async ensName => {
  const provider = Helpers.getProvider();
  const registry = new Contract(
    ensRegistryAddress,
    registryWithFallbackABI,
    provider
  );
  const owner = await registry.owner(hash(ensName));
  return owner;
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

beforeAll(async () => {
  // Connect to hardhat
  await exec('yarn hardhat');
  await exec(
    'open /Applications/Xcode.app/Contents/Developer/Applications/Simulator.app/'
  );
});

describe('Renew + Send ENS Flow', () => {
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
    await Helpers.typeText('import-sheet-input', process.env.TEST_SEEDS);
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

  it('Should open ENS rainbowtestwallet.eth to renew', async () => {
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.waitAndTap('token-family-header-ENS');
    await Helpers.swipe('wallet-screen', 'up', 'slow');
    await Helpers.waitAndTap('wrapped-nft-rainbowtestwallet.eth');
  });

  it('Should renew rainbowtestwallet.eth', async () => {
    await Helpers.waitAndTap('unique-token-expanded-state-extend-duration');
    await Helpers.checkIfVisible(`ens-transaction-action-RENEW`);
    if (device.getPlatform() === 'ios') {
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
    if (device.getPlatform() === 'ios') {
      await Helpers.waitAndTap(`send-confirmation-button`);
    } else {
      await Helpers.tapAndLongPress('send-confirmation-button');
      await Helpers.delay(1000);
      await Helpers.checkIfVisible('pin-authentication-screen');
      await Helpers.authenticatePin('1234');
    }
  });

  it('Should confirm the ENS was sent correctly', async () => {
    await Helpers.delay(1000);
    const { name } = await getRecords(RAINBOW_TEST_WALLET_NAME);
    const { address, primaryName } = await resolveName(
      RAINBOW_TEST_WALLET_NAME
    );
    const owner = await getNameOwner(RAINBOW_TEST_WALLET_NAME);
    if (address !== RAINBOW_WALLET_ADDRESS)
      throw new Error('Resolved address is wrong');
    if (primaryName !== RAINBOW_WALLET_NAME)
      throw new Error('Resolved primary name is wrong');
    if (name) throw new Error('name is wrong');
    if (owner !== RAINBOW_WALLET_ADDRESS)
      throw new Error('Owner not set correctly');
  });

  it('Should check address is the new label on profile screen and change wallet screen', async () => {
    const TRUNCATED_ADDRESS = address(RAINBOW_TEST_WALLET_ADDRESS, 4, 4);
    await Helpers.swipe('profile-screen', 'left', 'slow');
    await Helpers.checkIfVisible('wallet-screen');
    await Helpers.checkIfVisible(
      `wallet-screen-account-name-${TRUNCATED_ADDRESS}`
    );
    await Helpers.waitAndTap(`wallet-screen-account-name-${TRUNCATED_ADDRESS}`);
    await Helpers.checkIfVisible(
      `change-wallet-address-row-address-${RAINBOW_TEST_WALLET_ADDRESS}`
    );
  });

  afterAll(async () => {
    // Reset the app state
    await device.clearKeychain();
    await exec('kill $(lsof -t -i:8545)');
  });
});
