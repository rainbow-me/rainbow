import ethers from 'ethers';
import lang from 'i18n-js';
import { AlertIOS } from 'react-native';
import {
  ACCESS_CONTROL,
  ACCESSIBLE,
  AUTHENTICATION_TYPE,
  canImplyAuthentication,
} from 'react-native-keychain';
import * as keychain from './keychain';

const seedPhraseKey = 'rainbowSeedPhrase';
const privateKeyKey = 'rainbowPrivateKey';
const addressKey = 'rainbowAddressKey';

export function generateSeedPhrase() {
  return ethers.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));
}

export const walletInit = async (seedPhrase = null) => {
  let walletAddress = null;
  let isWalletBrandNew = false;
  if (seedPhrase) {
    walletAddress = await createWallet(seedPhrase);
  }
  if (!walletAddress) {
    walletAddress = await loadAddress();
  }
  if (!walletAddress) {
    walletAddress = await createWallet();
    isWalletBrandNew = true;
  }
  return { isWalletBrandNew, walletAddress } ;
};

export const loadWallet = async () => {
  const privateKey = await loadPrivateKey();
  if (privateKey) {
    const wallet = new ethers.Wallet(privateKey);
    wallet.provider = ethers.providers.getDefaultProvider();
    return wallet;
  }
  return null;
};

export const createTransaction = async (to, data, value, gasLimit, gasPrice, nonce = null) => ({
  data,
  gasLimit,
  gasPrice,
  nonce,
  to,
  value: ethers.utils.parseEther(value),
});

export const sendTransaction = async ({ transaction }) => {
  try {
    const wallet = await loadWallet();
    if (!wallet) {
      return null;
    }
    try {
      const result = await wallet.sendTransaction(transaction);
      return result.hash;
    } catch (error) {
      AlertIOS.alert(lang.t('wallet.transaction.alert.failed_transaction'));
      return null;
    }
  } catch (error) {
    AlertIOS.alert(lang.t('wallet.transaction.alert.authentication'));
    return null;
  }
};

export const signMessage = async (message, authenticationPrompt = lang.t('wallet.authenticate.please')) => {
  try {
    const wallet = await loadWallet(authenticationPrompt);
    try {
      return await wallet.signMessage(message);
    } catch (error) {
      AlertIOS.alert(lang.t('wallet.message_signing.failed_signing'));
      return null;
    }
  } catch (error) {
    AlertIOS.alert(lang.t('wallet.transaction.alert.authentication'));
    return null;
  }
};

export const loadSeedPhrase = async (authenticationPrompt = lang.t('wallet.authenticate.please_seed_phrase')) => {
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
  const canAuthenticate = await canImplyAuthentication({ authenticationType: AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS });
  let accessControlOptions = {};
  if (canAuthenticate) {
    accessControlOptions = { accessControl: ACCESS_CONTROL.USER_PRESENCE, accessible: ACCESSIBLE.WHEN_UNLOCKED };
  }
  saveSeedPhrase(seedPhrase, accessControlOptions);
  savePrivateKey(privateKey, accessControlOptions);
  saveAddress(address);
};

const saveSeedPhrase = async (seedPhrase, accessControlOptions = {}) => {
  await keychain.saveString(seedPhraseKey, seedPhrase, accessControlOptions);
};

const savePrivateKey = async (privateKey, accessControlOptions = {}) => {
  await keychain.saveString(privateKeyKey, privateKey, accessControlOptions);
};

const loadPrivateKey = async (authenticationPrompt = lang.t('wallet.authenticate.please')) => {
  try {
    const privateKey = await keychain.loadString(privateKeyKey, { authenticationPrompt });
    return privateKey;
  } catch (error) {
    return null;
  }
};

const saveAddress = async (address) => {
  await keychain.saveString(addressKey, address);
};
