import ethers from 'ethers';
import lang from 'i18n-js';
import {
  ACCESS_CONTROL,
  ACCESSIBLE,
  AUTHENTICATION_TYPE,
  canImplyAuthentication,
} from 'react-native-keychain';
import * as keychain from '../model/keychain';
const seedPhraseKey = 'seedPhrase';
const privateKeyKey = 'privateKey';
const addressKey = 'addressKey';

export function generateSeedPhrase() {
  return ethers.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));
}

export const walletInit = async (seedPhrase = null) => {
  let walletAddress = null;
  walletAddress = await loadAddress();
  if (!walletAddress) {
    walletAddress = await createWallet(seedPhrase);
  }
  return walletAddress;
};

export const loadWallet = async (authenticationPrompt) => {
  const privateKey = await loadPrivateKey(authenticationPrompt);
  if (privateKey) {
    const wallet = new ethers.Wallet(privateKey);
    wallet.provider = ethers.providers.getDefaultProvider();
    console.log(`Wallet: successfully loaded existing wallet with public address: ${wallet.address}`);
    return wallet;
  }
  console.log("Wallet: failed to load existing wallet because the private key doesn't exist");
  return null;
};

export const createTransaction = async (to, data, value, gasLimit, gasPrice, nonce = null) => {
  return {
    to,
    data,
    value: ethers.utils.parseEther(value),
    gasLimit,
    gasPrice,
    nonce,
  };
};

export const sendTransaction = async (transaction, authenticationPrompt = lang.t('account.authenticate.please')) => {
  const wallet = await loadWallet(authenticationPrompt);
  const result = await wallet.sendTransaction(transaction);
  return result.hash;
};

export const loadSeedPhrase = async () => {
  const authenticationPrompt = lang.t('account.authenticate.please_seed_phrase');
  const seedPhrase = await keychain.loadString(seedPhraseKey, { authenticationPrompt });
  return seedPhrase;
};

export const loadAddress = async () => {
  try {
    return await keychain.loadString(addressKey);
  } catch (error) {
    return null;
  }
};

const createWallet = async (seedPhrase) => {
  const walletSeedPhrase = seedPhrase || generateSeedPhrase();
  const wallet = ethers.Wallet.fromMnemonic(walletSeedPhrase);
  saveWalletDetails(walletSeedPhrase, wallet.privateKey, wallet.address);
  return wallet.address;
};

const saveWalletDetails = async (seedPhrase, privateKey, address) => {
  const canAuthenticate = await canImplyAuthentication({ authenticationType: AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS});
  let accessControlOptions = {};
  if (canAuthenticate) {
    accessControlOptions = { accessControl: ACCESS_CONTROL.USER_PRESENCE, accessible: ACCESSIBLE.WHEN_UNLOCKED };
  }
  saveSeedPhrase(seedPhrase, accessControlOptions);
  savePrivateKey(privateKey, accessControlOptions);
  saveAddress(address);
  console.log(`Wallet: Generated wallet with public address: ${address}`);
};

const saveSeedPhrase = async (seedPhrase, accessControlOptions = {}) => {
  await keychain.saveString(seedPhraseKey, seedPhrase, accessControlOptions);
};

const savePrivateKey = async (privateKey, accessControlOptions = {}) => {
  await keychain.saveString(privateKeyKey, privateKey, accessControlOptions);
};

const loadPrivateKey = async (authenticationPrompt) => {
  const privateKey = await keychain.loadString(privateKeyKey, { authenticationPrompt });
  return privateKey;
};

const saveAddress = async (address) => {
  await keychain.saveString(addressKey, address);
};
