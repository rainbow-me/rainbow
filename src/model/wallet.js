import { captureException } from '@sentry/react-native';
import { ethers } from 'ethers';
import lang from 'i18n-js';
import { get, isEmpty, isNil, orderBy } from 'lodash';
import { Alert } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {
  ACCESS_CONTROL,
  ACCESSIBLE,
  AUTHENTICATION_TYPE,
  canImplyAuthentication,
} from 'react-native-keychain';
import * as keychain from './keychain';
import {
  addHexPrefix,
  isHexString,
  isHexStringIgnorePrefix,
  isValidMnemonic,
  web3Provider,
} from '../handlers/web3';
import { removeFirstEmojiFromString } from '../helpers/emojiHandler';

const profiles = 'rainbowProfiles';
const walletName = 'rainbowWalletName';
const seedPhraseKey = 'rainbowSeedPhrase';
const privateKeyKey = 'rainbowPrivateKey';
const addressKey = 'rainbowAddressKey';

export function generateSeedPhrase() {
  return ethers.utils.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));
}

export const walletInit = async (
  seedPhrase = null,
  accountName = null,
  color = null
) => {
  let walletAddress = null;
  let isImported = false;
  let isNew = false;
  if (!isEmpty(seedPhrase)) {
    walletAddress = await createWallet(seedPhrase, accountName, color);
    isImported = !isNil(walletAddress);
    return { isImported, isNew, walletAddress };
  }
  walletAddress = await loadAddress();
  if (!walletAddress) {
    walletAddress = await createWallet();
    isNew = true;
  }
  return { isImported, isNew, walletAddress };
};

export const loadWallet = async () => {
  const privateKey = await loadPrivateKey();
  if (privateKey) {
    return new ethers.Wallet(privateKey, web3Provider);
  }
  return null;
};

export const getChainId = async () => {
  const wallet = await loadWallet();
  return get(wallet, 'provider.chainId');
};

export const createTransaction = async (
  to,
  data,
  value,
  gasLimit,
  gasPrice,
  nonce = null
) => ({
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
    if (!wallet) return null;
    try {
      const result = await wallet.sendTransaction(transaction);
      return result.hash;
    } catch (error) {
      Alert.alert(lang.t('wallet.transaction.alert.failed_transaction'));
      captureException(error);
      return null;
    }
  } catch (error) {
    Alert.alert(lang.t('wallet.transaction.alert.authentication'));
    captureException(error);
    return null;
  }
};

export const signTransaction = async ({ transaction }) => {
  try {
    const wallet = await loadWallet();
    if (!wallet) return null;
    try {
      return await wallet.sign(transaction);
    } catch (error) {
      Alert.alert(lang.t('wallet.transaction.alert.failed_transaction'));
      captureException(error);
      return null;
    }
  } catch (error) {
    Alert.alert(lang.t('wallet.transaction.alert.authentication'));
    captureException(error);
    return null;
  }
};

export const signMessage = async (
  message,
  authenticationPrompt = lang.t('wallet.authenticate.please')
) => {
  try {
    const wallet = await loadWallet(authenticationPrompt);
    try {
      const signingKey = new ethers.utils.SigningKey(wallet.privateKey);
      const sigParams = await signingKey.signDigest(
        ethers.utils.arrayify(message)
      );
      return await ethers.utils.joinSignature(sigParams);
    } catch (error) {
      captureException(error);
      return null;
    }
  } catch (error) {
    Alert.alert(lang.t('wallet.transaction.alert.authentication'));
    captureException(error);
    return null;
  }
};

export const signPersonalMessage = async (
  message,
  authenticationPrompt = lang.t('wallet.authenticate.please')
) => {
  try {
    const wallet = await loadWallet(authenticationPrompt);
    try {
      return await wallet.signMessage(
        isHexString(message) ? ethers.utils.arrayify(message) : message
      );
    } catch (error) {
      captureException(error);
      return null;
    }
  } catch (error) {
    Alert.alert(lang.t('wallet.transaction.alert.authentication'));
    captureException(error);
    return null;
  }
};

export const loadSeedPhrase = async (
  authenticationPrompt = lang.t('wallet.authenticate.please_seed_phrase')
) => {
  const seedPhrase = await keychain.loadString(seedPhraseKey, {
    authenticationPrompt,
  });
  return seedPhrase;
};

export const loadAddress = async () => {
  try {
    return await keychain.loadString(addressKey);
  } catch (error) {
    captureException(error);
    return null;
  }
};

export const createWallet = async (seed, name, color) => {
  const walletSeed = seed || generateSeedPhrase();
  let wallet = null;
  try {
    if (
      isHexStringIgnorePrefix(walletSeed) &&
      addHexPrefix(walletSeed).length === 66
    ) {
      wallet = new ethers.Wallet(walletSeed);
    } else if (isValidMnemonic(walletSeed)) {
      wallet = ethers.Wallet.fromMnemonic(walletSeed);
    } else {
      let hdnode = ethers.utils.HDNode.fromSeed(walletSeed);
      let node = hdnode.derivePath("m/44'/60'/0'/0/0");
      wallet = new ethers.Wallet(node.privateKey);
    }
    if (wallet) {
      saveWalletDetails(
        name,
        color,
        walletSeed,
        wallet.privateKey,
        wallet.address
      );
      return wallet.address;
    }
    return null;
  } catch (error) {
    captureException(error);
    return null;
  }
};

export const saveWalletDetails = async (
  name,
  color,
  seedPhrase,
  privateKey,
  address
) => {
  const canAuthenticate = await canImplyAuthentication({
    authenticationType: AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
  });
  let accessControlOptions = {};

  let isSimulator = false;

  if (canAuthenticate) {
    // eslint-disable-next-line no-undef
    isSimulator = __DEV__ && (await DeviceInfo.isEmulator());
  }

  if (canAuthenticate && !isSimulator) {
    accessControlOptions = {
      accessControl: ACCESS_CONTROL.USER_PRESENCE,
      accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    };
  }
  if (!name) {
    name = 'My Wallet';
  }
  if (!color) {
    color = 0;
  }
  saveUserInfo(
    name,
    color,
    seedPhrase,
    privateKey,
    address,
    accessControlOptions
  );
  saveSeedPhrase(seedPhrase, accessControlOptions);
  savePrivateKey(privateKey, accessControlOptions);
  saveAddress(address);
  saveName(name);
};

export const saveName = async (name, accessControlOptions = {}) => {
  await keychain.saveString(walletName, name, accessControlOptions);
};

export const loadName = async (
  authenticationPrompt = lang.t('wallet.authenticate.please')
) => {
  try {
    const name = await keychain.loadString(walletName, {
      authenticationPrompt,
    });
    return name;
  } catch (error) {
    return null;
  }
};

const saveSeedPhrase = async (seedPhrase, accessControlOptions = {}) => {
  await keychain.saveString(seedPhraseKey, seedPhrase, accessControlOptions);
};

const savePrivateKey = async (privateKey, accessControlOptions = {}) => {
  await keychain.saveString(privateKeyKey, privateKey, accessControlOptions);
};

const loadPrivateKey = async (
  authenticationPrompt = lang.t('wallet.authenticate.please')
) => {
  try {
    const privateKey = await keychain.loadString(privateKeyKey, {
      authenticationPrompt,
    });
    return privateKey;
  } catch (error) {
    captureException(error);
    return null;
  }
};

const saveAddress = async address => {
  await keychain.saveString(addressKey, address);
};

export const saveUserInfo = async (
  name,
  color,
  seedPhrase,
  privateKey,
  address
) => {
  const newProfile = {
    address,
    color,
    name,
    privateKey,
    seedPhrase,
  };
  let newProfilesTable = [];
  let userAlreadyInProfiles = false;
  let userIndex = 0;
  const usersInfo = await loadUsersInfo();
  if (usersInfo) {
    newProfilesTable = usersInfo;
    for (let i = 0; i < newProfilesTable.length; i++) {
      if (usersInfo[i].address === address) {
        userAlreadyInProfiles = true;
        userIndex = i;
      }
    }
  }
  if (userAlreadyInProfiles) {
    newProfilesTable.splice(userIndex, 1, newProfile);
  } else {
    newProfilesTable.push(newProfile);
  }
  const newProfilesTableSorted = orderBy(
    newProfilesTable,
    [
      profile => {
        let editedProfile = profile.name.toLowerCase();
        editedProfile = removeFirstEmojiFromString(editedProfile);
        return editedProfile;
      },
    ],
    ['asc']
  );
  await keychain.saveObject(profiles, newProfilesTableSorted);
  return true;
};

export const deleteUserInfo = async address => {
  let newProfilesTable = [];
  let searchedUserIndex;
  const usersInfo = await loadUsersInfo();
  if (usersInfo) {
    newProfilesTable = usersInfo;
    for (let i = 0; i < newProfilesTable.length; i++) {
      if (newProfilesTable[i].address === address) {
        searchedUserIndex = i;
      }
    }
  }
  if (searchedUserIndex >= 0) {
    newProfilesTable.splice(searchedUserIndex, 1);
    await keychain.saveObject(profiles, newProfilesTable);
    return true;
  }
  return false;
};

export const editUserInfo = async (
  name,
  color,
  seedPhrase,
  privateKey,
  address
) => {
  const newProfile = {
    address,
    color,
    name,
    privateKey,
    seedPhrase,
  };
  let newProfilesTable = [];
  let searchedUserIndex;
  const usersInfo = await loadUsersInfo();
  if (usersInfo) {
    newProfilesTable = usersInfo;
    for (let i = 0; i < newProfilesTable.length; i++) {
      if (newProfilesTable[i].address === address) {
        searchedUserIndex = i;
      }
    }
  }
  if (searchedUserIndex >= 0) {
    newProfilesTable.splice(searchedUserIndex, 1, newProfile);
    const newProfilesTableSorted = orderBy(
      newProfilesTable,
      [
        profile => {
          let editedProfile = profile.name.toLowerCase();
          editedProfile = removeFirstEmojiFromString(editedProfile);
          return editedProfile;
        },
      ],
      ['asc']
    );
    await keychain.saveObject(profiles, newProfilesTableSorted);
    return true;
  }
  return false;
};

export const loadUserDataForAddress = async address => {
  let searchedName;
  let searchedColor;
  const usersInfo = await loadUsersInfo();
  if (usersInfo) {
    for (let i = 0; i < usersInfo.length; i++) {
      if (usersInfo[i].address === address) {
        searchedName = usersInfo[i].name;
        searchedColor = usersInfo[i].color;
      }
    }
  }
  return { searchedColor, searchedName };
};

export const loadUsersInfo = async () => {
  try {
    const usersInfo = await keychain.loadObject(profiles);
    return usersInfo;
  } catch (error) {
    return [];
  }
};

export const loadCurrentUserInfo = async (
  authenticationPrompt = lang.t('wallet.authenticate.please')
) => {
  try {
    const address = await keychain.loadString(addressKey, {
      authenticationPrompt,
    });
    const seedPhrase = await keychain.loadString(seedPhraseKey, {
      authenticationPrompt,
    });
    const privateKey = await keychain.loadString(privateKeyKey, {
      authenticationPrompt,
    });
    const name = await keychain.loadString(walletName, {
      authenticationPrompt,
    });
    return {
      address,
      name,
      privateKey,
      seedPhrase,
    };
  } catch (error) {
    return null;
  }
};

export const saveCurrentUserInfo = async () => {
  const currentUser = await loadCurrentUserInfo();
  await keychain.saveObject(profiles, [currentUser]);
  return true;
};
