import { TransactionRequest } from '@ethersproject/abstract-provider';
import { arrayify, BytesLike, Hexable } from '@ethersproject/bytes';
import { HDNode } from '@ethersproject/hdnode';
import { Provider } from '@ethersproject/providers';
import { Transaction } from '@ethersproject/transactions';
import { Wallet } from '@ethersproject/wallet';
import {
  signTypedData,
  SignTypedDataVersion,
  TypedMessage,
} from '@metamask/eth-sig-util';
import { captureException, captureMessage } from '@sentry/react-native';
import { generateMnemonic } from 'bip39';
import { isValidAddress, toBuffer, toChecksumAddress } from 'ethereumjs-util';
import {
  hdkey as EthereumHDKey,
  default as LibWallet,
} from 'ethereumjs-wallet';
import lang from 'i18n-js';
import { findKey, isEmpty } from 'lodash';
import { getSupportedBiometryType } from 'react-native-keychain';
import { lightModeThemeColors } from '../styles/colors';
import {
  addressKey,
  allWalletsKey,
  oldSeedPhraseMigratedKey,
  pinKey,
  privateKeyKey,
  seedPhraseKey,
  selectedWalletKey,
} from '../utils/keychainConstants';
import profileUtils, {
  addressHashedColorIndex,
  addressHashedEmoji,
} from '../utils/profileUtils';
import * as keychain from './keychain';
import { PreferenceActionType, setPreference } from './preferences';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { EthereumAddress } from '@/entities';
import AesEncryptor from '@/handlers/aesEncryption';
import {
  authenticateWithPIN,
  authenticateWithPINAndCreateIfNeeded,
  getExistingPIN,
} from '@/handlers/authentication';
import { saveAccountEmptyState } from '@/handlers/localstorage/accountLocal';
import {
  addHexPrefix,
  isHexString,
  isHexStringIgnorePrefix,
  isValidMnemonic,
  web3Provider,
} from '@/handlers/web3';
import { createSignature } from '@/helpers/signingWallet';
import showWalletErrorAlert from '@/helpers/support';
import { WalletLoadingStates } from '@/helpers/walletLoadingStates';
import { EthereumWalletType } from '@/helpers/walletTypes';
import { updateWebDataEnabled } from '@/redux/showcaseTokens';
import store from '@/redux/store';
import { setIsWalletLoading } from '@/redux/wallets';
import { ethereumUtils } from '@/utils';
import logger from '@/utils/logger';
import { initializeSingleWalletWithEmptySettings } from '@/notifications/settings';

const encryptor = new AesEncryptor();

export type EthereumPrivateKey = string;
type EthereumMnemonic = string;
type EthereumSeed = string;
export type EthereumWalletSeed =
  | EthereumAddress
  | EthereumPrivateKey
  | EthereumMnemonic
  | EthereumSeed;

interface WalletInitialized {
  isNew: boolean;
  walletAddress?: EthereumAddress;
}

interface TransactionRequestParam {
  transaction: TransactionRequest;
  existingWallet?: Wallet;
  provider?: Provider;
}

interface MessageTypeProperty {
  name: string;
  type: string;
}
interface TypedDataTypes {
  EIP712Domain: MessageTypeProperty[];
  [additionalProperties: string]: MessageTypeProperty[];
}

interface TypedData {
  types: TypedDataTypes;
  primaryType: keyof TypedDataTypes;
  domain: {
    name?: string;
    version?: string;
    chainId?: number;
    verifyingContract?: string;
  };
  message: object;
}

interface ReadOnlyWallet {
  address: EthereumAddress;
  privateKey: null;
}

interface EthereumWalletFromSeed {
  hdnode: null | HDNode;
  isHDWallet: boolean;
  wallet: null | EthereumWallet;
  type: EthereumWalletType;
  walletType: WalletLibraryType;
  root: EthereumHDKey;
  address: EthereumAddress;
}

type EthereumWallet = Wallet | ReadOnlyWallet;

export interface RainbowAccount {
  index: number;
  label: string;
  address: EthereumAddress;
  avatar: null | string;
  color: number;
  visible: boolean;
  image?: string | null;
}

export interface RainbowWallet {
  addresses: RainbowAccount[];
  color: number;
  id: string;
  imported: boolean;
  name: string;
  primary: boolean;
  type: EthereumWalletType;
  backedUp?: boolean;
  backupFile?: string | null;
  backupDate?: string;
  backupType?: string;
  damaged?: boolean;
}

export interface AllRainbowWallets {
  [key: string]: RainbowWallet;
}

interface AllRainbowWalletsData {
  wallets: AllRainbowWallets;
  version: string;
}

interface RainbowSelectedWalletData {
  wallet: RainbowWallet;
}

export interface PrivateKeyData {
  privateKey: EthereumPrivateKey;
  version: string;
}

interface SeedPhraseData {
  seedphrase: EthereumPrivateKey;
  version: string;
}

interface MigratedSecretsResult {
  hdnode: undefined | HDNode;
  privateKey: EthereumPrivateKey;
  seedphrase: EthereumWalletSeed;
  type: EthereumWalletType;
}

export enum WalletLibraryType {
  ethers = 'ethers',
  bip39 = 'bip39',
}

const privateKeyVersion = 1.0;
const seedPhraseVersion = 1.0;
const selectedWalletVersion = 1.0;
export const allWalletsVersion = 1.0;

export const DEFAULT_HD_PATH = `m/44'/60'/0'/0`;
export const DEFAULT_WALLET_NAME = 'My Wallet';

const authenticationPrompt = lang.t('wallet.authenticate.please');

export const createdWithBiometricError = 'createdWithBiometricError';

export const walletInit = async (
  seedPhrase = undefined,
  color = null,
  name = null,
  overwrite = false,
  checkedWallet = null,
  network: string,
  image = null,
  // Import the wallet "silently" in the background (i.e. no "loading" prompts).
  silent = false
): Promise<WalletInitialized> => {
  let walletAddress = null;

  // When the `seedPhrase` is not defined in the args, then
  // this means it's a new fresh wallet created by the user.
  let isNew = typeof seedPhrase === 'undefined';

  // Importing a seedphrase
  if (!isEmpty(seedPhrase)) {
    const wallet = await createWallet(
      seedPhrase,
      color,
      name,
      overwrite,
      checkedWallet,
      image,
      silent
    );
    walletAddress = wallet?.address;
    return { isNew, walletAddress };
  }

  walletAddress = await loadAddress();

  if (!walletAddress) {
    const wallet = await createWallet();
    walletAddress = wallet?.address;
    isNew = true;
  }
  if (isNew) {
    saveAccountEmptyState(true, walletAddress?.toLowerCase(), network);
  }

  return { isNew, walletAddress };
};

export const loadWallet = async (
  address?: EthereumAddress | undefined,
  showErrorIfNotLoaded = true,
  provider?: Provider
): Promise<null | Wallet> => {
  const privateKey = await loadPrivateKey(address);
  if (privateKey === -1 || privateKey === -2) {
    return null;
  }
  if (privateKey) {
    // @ts-ignore
    return new Wallet(privateKey, provider || web3Provider);
  }
  if (ios && showErrorIfNotLoaded) {
    showWalletErrorAlert();
  }
  return null;
};

export const sendTransaction = async ({
  transaction,
  existingWallet,
  provider,
}: TransactionRequestParam): Promise<null | {
  result?: Transaction;
  error?: any;
}> => {
  try {
    logger.sentry('about to send transaction', transaction);
    const wallet =
      existingWallet || (await loadWallet(undefined, true, provider));
    if (!wallet) return null;
    try {
      const result = await wallet.sendTransaction(transaction);
      logger.log('tx result', result);
      return { result };
    } catch (error) {
      logger.log('Failed to SEND transaction', error);
      Alert.alert(lang.t('wallet.transaction.alert.failed_transaction'));
      logger.sentry('Error', error);
      const fakeError = new Error('Failed to send transaction');
      captureException(fakeError);
      return { error };
    }
  } catch (error) {
    Alert.alert(lang.t('wallet.transaction.alert.authentication'));
    logger.sentry(
      'Failed to SEND transaction due to authentication, alerted user'
    );
    captureException(error);
    return null;
  }
};

export const signTransaction = async ({
  transaction,
  existingWallet,
  provider,
}: TransactionRequestParam): Promise<null | {
  result?: string;
  error?: any;
}> => {
  try {
    logger.sentry('about to sign transaction', transaction);
    const wallet =
      existingWallet || (await loadWallet(undefined, true, provider));
    if (!wallet) return null;
    try {
      const result = await wallet.signTransaction(transaction);
      return { result };
    } catch (error) {
      Alert.alert(lang.t('wallet.transaction.alert.failed_transaction'));
      logger.sentry('Error', error);
      const fakeError = new Error('Failed to sign transaction');
      captureException(fakeError);
      return { error };
    }
  } catch (error) {
    Alert.alert(lang.t('wallet.transaction.alert.authentication'));
    logger.sentry(
      'Failed to SIGN transaction due to authentication, alerted user'
    );
    captureException(error);
    return null;
  }
};

export const signMessage = async (
  message: BytesLike | Hexable | number,
  existingWallet?: Wallet,
  provider?: Provider
): Promise<null | {
  result?: string;
  error?: any;
}> => {
  try {
    logger.sentry('about to sign message', message);
    const wallet =
      existingWallet || (await loadWallet(undefined, true, provider));
    try {
      if (!wallet) return null;
      const result = await wallet.signMessage(arrayify(message));
      return { result };
    } catch (error) {
      Alert.alert(lang.t('wallet.transaction.alert.failed_sign_message'));
      logger.sentry('Error', error);
      const fakeError = new Error('Failed to sign message');
      captureException(fakeError);
      return { error };
    }
  } catch (error) {
    Alert.alert(lang.t('wallet.transaction.alert.authentication'));
    logger.sentry('Failed to SIGN message due to authentication, alerted user');
    captureException(error);
    return null;
  }
};

export const signPersonalMessage = async (
  message: string | Uint8Array,
  existingWallet?: Wallet,
  provider?: Provider
): Promise<null | {
  result?: string;
  error?: any;
}> => {
  try {
    logger.sentry('about to sign personal message', message);
    const wallet =
      existingWallet || (await loadWallet(undefined, true, provider));
    try {
      if (!wallet) return null;
      const result = await wallet.signMessage(
        typeof message === 'string' && isHexString(addHexPrefix(message))
          ? arrayify(addHexPrefix(message))
          : message
      );
      return { result };
    } catch (error) {
      Alert.alert(lang.t('wallet.transaction.alert.failed_sign_message'));
      logger.sentry('Error', error);
      const fakeError = new Error('Failed to sign personal message');
      captureException(fakeError);
      return { error };
    }
  } catch (error) {
    Alert.alert(lang.t('wallet.transaction.alert.authentication'));
    logger.sentry(
      'Failed to SIGN personal message due to authentication, alerted user'
    );
    captureException(error);
    return null;
  }
};

export const signTypedDataMessage = async (
  message: string | TypedData,
  existingWallet?: Wallet,
  provider?: Provider
): Promise<null | {
  result?: string;
  error?: any;
}> => {
  try {
    logger.sentry('about to sign typed data  message', message);
    const wallet =
      existingWallet || (await loadWallet(undefined, true, provider));
    if (!wallet) return null;
    try {
      const pkeyBuffer = toBuffer(addHexPrefix(wallet.privateKey));
      let parsedData = message;
      try {
        parsedData = typeof message === 'string' && JSON.parse(message);
        // eslint-disable-next-line no-empty
      } catch (e) {}

      // There are 3 types of messages
      // v1 => basic data types
      // v3 =>  has type / domain / primaryType
      // v4 => same as v3 but also supports which supports arrays and recursive structs.
      // Because v4 is backwards compatible with v3, we're supporting only v4

      let version = 'v1';
      if (
        typeof parsedData === 'object' &&
        (parsedData.types || parsedData.primaryType || parsedData.domain)
      ) {
        version = 'v4';
      }

      return {
        result: signTypedData({
          data: parsedData as TypedMessage<TypedDataTypes>,
          privateKey: pkeyBuffer,
          version: version.toUpperCase() as SignTypedDataVersion,
        }),
      };
    } catch (error) {
      Alert.alert(lang.t('wallet.transaction.alert.failed_sign_message'));
      logger.sentry('Error', error);
      const fakeError = new Error('Failed to sign typed data');
      captureException(fakeError);
      return { error };
    }
  } catch (error) {
    Alert.alert(lang.t('wallet.transaction.alert.authentication'));
    logger.sentry(
      'Failed to SIGN typed data message due to authentication, alerted user'
    );
    captureException(error);
    return null;
  }
};

export const oldLoadSeedPhrase = async (): Promise<null | EthereumWalletSeed> => {
  const seedPhrase = await keychain.loadString(seedPhraseKey, {
    authenticationPrompt,
  });
  return seedPhrase as string | null;
};

export const loadAddress = (): Promise<null | EthereumAddress> =>
  keychain.loadString(addressKey) as Promise<string | null>;

const loadPrivateKey = async (
  address?: EthereumAddress | undefined
): Promise<null | EthereumPrivateKey | -1 | -2> => {
  try {
    const isSeedPhraseMigrated = await keychain.loadString(
      oldSeedPhraseMigratedKey
    );

    // We need to migrate the seedphrase & private key first
    // In that case we regenerate the existing private key to store it with the new format
    let privateKey = null;
    if (!isSeedPhraseMigrated) {
      const migratedSecrets = await migrateSecrets();
      privateKey = migratedSecrets?.privateKey;
    }

    if (!privateKey) {
      const addressToUse = address || (await loadAddress());
      if (!addressToUse) {
        return null;
      }

      const privateKeyData = await getPrivateKey(addressToUse);
      if (privateKeyData === -1) {
        return -1;
      }
      privateKey = privateKeyData?.privateKey ?? null;

      let userPIN = null;
      if (android) {
        const hasBiometricsEnabled = await getSupportedBiometryType();
        // Fallback to custom PIN
        if (!hasBiometricsEnabled) {
          try {
            userPIN = await authenticateWithPIN();
          } catch (e) {
            return null;
          }
        }
      }
      if (privateKey && userPIN) {
        privateKey = await encryptor.decrypt(userPIN, privateKey);
      }
    }

    return privateKey;
  } catch (error) {
    logger.sentry('Error in loadPrivateKey');
    captureException(error);
    return null;
  }
};

export const saveAddress = async (
  address: EthereumAddress,
  accessControlOptions = keychain.publicAccessControlOptions
): Promise<void> => {
  return keychain.saveString(addressKey, address, accessControlOptions);
};

export const identifyWalletType = (
  walletSeed: EthereumWalletSeed
): EthereumWalletType => {
  if (
    isHexStringIgnorePrefix(walletSeed) &&
    addHexPrefix(walletSeed).length === 66
  ) {
    return EthereumWalletType.privateKey;
  }
  // 12 or 24 words seed phrase
  if (isValidMnemonic(walletSeed)) {
    return EthereumWalletType.mnemonic;
  }
  // Public address (0x)
  if (isValidAddress(walletSeed)) {
    return EthereumWalletType.readOnly;
  }
  // seed
  return EthereumWalletType.seed;
};

export const createWallet = async (
  seed: null | EthereumSeed = null,
  color: null | number = null,
  name: null | string = null,
  overwrite = false,
  checkedWallet: null | EthereumWalletFromSeed = null,
  image: null | string = null,
  silent = false,
  clearCallbackOnStartCreation = false
): Promise<null | EthereumWallet> => {
  if (clearCallbackOnStartCreation) {
    callbackAfterSeeds?.();
    callbackAfterSeeds = null;
  }
  const isImported = !!seed;
  logger.sentry('Creating wallet, isImported?', isImported);
  if (!seed) {
    logger.sentry('Generating a new seed phrase');
  }
  const walletSeed = seed || generateMnemonic();
  const addresses: RainbowAccount[] = [];
  try {
    const { dispatch } = store;

    if (!silent) {
      dispatch(setIsWalletLoading(WalletLoadingStates.CREATING_WALLET));
    }

    const {
      isHDWallet,
      type,
      root,
      wallet: walletResult,
      address,
      walletType,
    } =
      checkedWallet ||
      (await ethereumUtils.deriveAccountFromWalletInput(walletSeed));
    const isReadOnlyType = type === EthereumWalletType.readOnly;
    let pkey = walletSeed;
    if (!walletResult) return null;
    const walletAddress = address;
    if (isHDWallet) {
      pkey = addHexPrefix(
        (walletResult as LibWallet).getPrivateKey().toString('hex')
      );
    }
    logger.sentry('[createWallet] - getWallet from seed');

    // Get all wallets
    const allWalletsResult = await getAllWallets();
    logger.sentry('[createWallet] - getAllWallets');
    const allWallets: AllRainbowWallets = allWalletsResult?.wallets ?? {};

    let existingWalletId = null;
    if (isImported) {
      // Checking if the generated account already exists and is visible
      logger.sentry('[createWallet] - isImported >> true');
      const alreadyExistingWallet = Object.values(allWallets).find(
        (someWallet: RainbowWallet) => {
          return !!someWallet.addresses.find(
            account =>
              toChecksumAddress(account.address) ===
                toChecksumAddress(walletAddress) && account.visible
          );
        }
      );

      existingWalletId = alreadyExistingWallet?.id;

      // Don't allow adding a readOnly wallet that you have already visible
      // or a private key that you already have visible as a seed or mnemonic
      const isPrivateKeyOverwritingSeedMnemonic =
        type === EthereumWalletType.privateKey &&
        (alreadyExistingWallet?.type === EthereumWalletType.seed ||
          alreadyExistingWallet?.type === EthereumWalletType.mnemonic);
      if (
        !overwrite &&
        alreadyExistingWallet &&
        (isReadOnlyType || isPrivateKeyOverwritingSeedMnemonic)
      ) {
        setTimeout(
          () =>
            Alert.alert(
              lang.t('wallet.new.alert.oops'),
              lang.t('wallet.new.alert.looks_like_already_imported')
            ),
          1
        );
        logger.sentry('[createWallet] - already imported this wallet');
        return null;
      }
    }

    const id = existingWalletId || `wallet_${Date.now()}`;
    logger.sentry('[createWallet] - wallet ID', { id });

    // Android users without biometrics need to secure their keys with a PIN
    let userPIN = null;
    if (android && !isReadOnlyType) {
      const hasBiometricsEnabled = await getSupportedBiometryType();
      // Fallback to custom PIN
      if (!hasBiometricsEnabled) {
        try {
          userPIN = await getExistingPIN();
          if (!userPIN) {
            // We gotta dismiss the modal before showing the PIN screen
            dispatch(setIsWalletLoading(null));
            userPIN = await authenticateWithPINAndCreateIfNeeded();
            dispatch(
              setIsWalletLoading(
                seed
                  ? silent
                    ? WalletLoadingStates.IMPORTING_WALLET_SILENTLY
                    : WalletLoadingStates.IMPORTING_WALLET
                  : WalletLoadingStates.CREATING_WALLET
              )
            );
          }
        } catch (e) {
          return null;
        }
      }
    }

    // Save seed - save this first
    if (userPIN) {
      // Encrypt with the PIN
      const encryptedSeed = await encryptor.encrypt(userPIN, walletSeed);
      if (encryptedSeed) {
        await saveSeedPhrase(encryptedSeed, id);
      } else {
        logger.sentry('Error encrypting seed to save it');
        return null;
      }
    } else {
      await saveSeedPhrase(walletSeed, id);
    }

    logger.sentry('[createWallet] - saved seed phrase');

    // Save address
    await saveAddress(walletAddress);
    logger.sentry('[createWallet] - saved address');

    // Save private key
    if (userPIN) {
      // Encrypt with the PIN
      const encryptedPkey = await encryptor.encrypt(userPIN, pkey);
      if (encryptedPkey) {
        await savePrivateKey(walletAddress, encryptedPkey);
      } else {
        logger.sentry('Error encrypting pkey to save it');
        return null;
      }
    } else {
      await savePrivateKey(walletAddress, pkey);
    }
    logger.sentry('[createWallet] - saved private key');

    const colorIndexForWallet =
      color !== null ? color : addressHashedColorIndex(walletAddress) || 0;
    addresses.push({
      address: walletAddress,
      avatar: null,
      color: colorIndexForWallet,
      image,
      index: 0,
      label: name || '',
      visible: true,
    });
    if (type !== EthereumWalletType.readOnly) {
      // Creating signature for this wallet
      logger.sentry(`[createWallet] - generating signature`);
      await createSignature(walletAddress, pkey);
      // Enable web profile
      logger.sentry(`[createWallet] - enabling web profile`);
      store.dispatch(updateWebDataEnabled(true, walletAddress));
      // Save the color
      setPreference(PreferenceActionType.init, 'profile', address, {
        accountColor:
          lightModeThemeColors.avatarBackgrounds[colorIndexForWallet],
        accountSymbol: profileUtils.addressHashedEmoji(address),
      });
      logger.sentry(`[createWallet] - enabled web profile`);
    }

    if (isHDWallet && root && isImported) {
      logger.sentry('[createWallet] - isHDWallet && isImported');
      let index = 1;
      let lookup = true;
      // Starting on index 1, we are gonna hit an API and check the tx history
      // for each account. If there's history we add it to the wallet.
      // (We stop once we find the first one with no history)
      while (lookup) {
        const child = root.deriveChild(index);
        const walletObj = child.getWallet();
        const nextWallet = new Wallet(
          addHexPrefix(walletObj.getPrivateKey().toString('hex'))
        );
        let hasTxHistory = false;
        try {
          hasTxHistory = await ethereumUtils.hasPreviousTransactions(
            nextWallet.address
          );
        } catch (error) {
          logger.sentry('[createWallet] - Error getting txn history');
          captureException(error);
        }

        let discoveredAccount: RainbowAccount | undefined;
        let discoveredWalletId: RainbowWallet['id'] | undefined;

        Object.values(allWallets).forEach(someWallet => {
          const existingAccount = someWallet.addresses.find(
            account =>
              toChecksumAddress(account.address) ===
              toChecksumAddress(nextWallet.address)
          );
          if (existingAccount) {
            discoveredAccount = existingAccount as RainbowAccount;
            discoveredWalletId = someWallet.id;
            return true;
          }
          return false;
        });

        // Remove any discovered wallets if they already exist
        // and copy over label and color if account was visible
        let colorIndexForWallet =
          addressHashedColorIndex(nextWallet.address) || 0;
        let label = '';

        if (discoveredAccount && discoveredWalletId) {
          if (discoveredAccount.visible) {
            colorIndexForWallet = discoveredAccount.color;
            label = discoveredAccount.label ?? '';
          }
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete allWallets[discoveredWalletId];
        }

        if (hasTxHistory) {
          // Save private key
          if (userPIN) {
            // Encrypt with the PIN
            const encryptedPkey = await encryptor.encrypt(
              userPIN,
              nextWallet.privateKey
            );
            if (encryptedPkey) {
              await savePrivateKey(nextWallet.address, encryptedPkey);
            } else {
              logger.sentry('Error encrypting pkey to save it');
              return null;
            }
          } else {
            await savePrivateKey(nextWallet.address, nextWallet.privateKey);
          }
          logger.sentry(
            `[createWallet] - saved private key for next wallet ${index}`
          );
          addresses.push({
            address: nextWallet.address,
            avatar: null,
            color: colorIndexForWallet,
            image: null,
            index,
            label,
            visible: true,
          });

          // Creating signature for this wallet
          await createSignature(nextWallet.address, nextWallet.privateKey);
          // Enable web profile
          store.dispatch(updateWebDataEnabled(true, nextWallet.address));

          // Save the color
          setPreference(
            PreferenceActionType.init,
            'profile',
            nextWallet.address,
            {
              accountColor:
                lightModeThemeColors.avatarBackgrounds[colorIndexForWallet],
              accountSymbol: addressHashedEmoji(nextWallet.address),
            }
          );

          logger.sentry(
            `[createWallet] - enabled web profile for wallet ${index}`
          );

          index++;
        } else {
          lookup = false;
        }
      }
    }

    // if imported and we have only one account, we name the wallet too.
    let walletName = DEFAULT_WALLET_NAME;
    if (isImported && name) {
      if (addresses.length > 1) {
        walletName = name;
      }
    }

    let primary = false;
    // If it's not imported or it's the first one with a seed phrase
    // it's the primary wallet
    if (
      !isImported ||
      (!findKey(allWallets, ['type', EthereumWalletType.mnemonic]) &&
        type === EthereumWalletType.mnemonic)
    ) {
      primary = true;
      // Or there's no other primary wallet and this one has a seed phrase
    } else {
      const primaryWallet = findKey(allWallets, ['primary', true]);
      if (!primaryWallet && type === EthereumWalletType.mnemonic) {
        primary = true;
      }
    }

    allWallets[id] = {
      addresses,
      backedUp: false,
      color: color || 0,
      id,
      imported: isImported,
      name: walletName,
      primary,
      type,
    };

    // create notifications settings entry for newly created wallet
    initializeSingleWalletWithEmptySettings(
      walletAddress,
      type === EthereumWalletType.readOnly,
      dispatch
    );

    if (!silent) {
      await setSelectedWallet(allWallets[id]);
      logger.sentry('[createWallet] - setSelectedWallet');
    }

    await saveAllWallets(allWallets);
    logger.sentry('[createWallet] - saveAllWallets');

    if (walletResult && walletAddress) {
      const ethersWallet =
        walletType === WalletLibraryType.ethers
          ? (walletResult as Wallet)
          : new Wallet(pkey);
      setTimeout(() => {
        // on android we need to call this logic in more specific places
        if (ios || !isImported) {
          // !imported = new wallet - then we use this logic for dismissing the loading state
          dispatch(setIsWalletLoading(null));
        }
      }, 2000);

      return ethersWallet;
    }
    return null;
  } catch (error) {
    logger.sentry('Error in createWallet');
    captureException(error);
    return null;
  }
};

export const savePrivateKey = async (
  address: EthereumAddress,
  privateKey: null | EthereumPrivateKey
) => {
  const privateAccessControlOptions = await keychain.getPrivateAccessControlOptions();

  const key = `${address}_${privateKeyKey}`;
  const val = {
    address,
    privateKey,
    version: privateKeyVersion,
  };

  await keychain.saveObject(key, val, privateAccessControlOptions);
};

export const getPrivateKey = async (
  address: EthereumAddress
): Promise<null | PrivateKeyData | -1> => {
  try {
    const key = `${address}_${privateKeyKey}`;
    const pkey = (await keychain.loadObject(key, {
      authenticationPrompt,
    })) as PrivateKeyData | -2;

    if (pkey === -2) {
      Alert.alert(
        lang.t('wallet.authenticate.alert.error'),
        lang.t(
          'wallet.authenticate.alert.current_authentication_not_secure_enough'
        )
      );
      return null;
    }

    return pkey || null;
  } catch (error) {
    logger.sentry('Error in getPrivateKey');
    captureException(error);
    return null;
  }
};

export const saveSeedPhrase = async (
  seedphrase: EthereumWalletSeed,
  keychain_id: RainbowWallet['id']
): Promise<void> => {
  const privateAccessControlOptions = await keychain.getPrivateAccessControlOptions();
  const key = `${keychain_id}_${seedPhraseKey}`;
  const val = {
    id: keychain_id,
    seedphrase,
    version: seedPhraseVersion,
  };

  return keychain.saveObject(key, val, privateAccessControlOptions);
};

export const getSeedPhrase = async (
  id: RainbowWallet['id']
): Promise<null | SeedPhraseData> => {
  try {
    const key = `${id}_${seedPhraseKey}`;
    const seedPhraseData = (await keychain.loadObject(key, {
      authenticationPrompt,
    })) as SeedPhraseData | -2;

    if (seedPhraseData === -2) {
      Alert.alert(
        lang.t('wallet.authenticate.alert.error'),
        lang.t(
          'wallet.authenticate.alert.current_authentication_not_secure_enough'
        )
      );
      return null;
    }

    return seedPhraseData || null;
  } catch (error) {
    logger.sentry('Error in getSeedPhrase');
    captureException(error);
    return null;
  }
};

export const setSelectedWallet = async (
  wallet: RainbowWallet
): Promise<void> => {
  const val = {
    version: selectedWalletVersion,
    wallet,
  };

  return keychain.saveObject(
    selectedWalletKey,
    val,
    keychain.publicAccessControlOptions
  );
};

export const getSelectedWallet = async (): Promise<null | RainbowSelectedWalletData> => {
  try {
    const selectedWalletData = await keychain.loadObject(selectedWalletKey);
    if (selectedWalletData) {
      return selectedWalletData as RainbowSelectedWalletData;
    }
    return null;
  } catch (error) {
    logger.sentry('Error in getSelectedWallet');
    captureException(error);
    return null;
  }
};

export const saveAllWallets = async (wallets: AllRainbowWallets) => {
  const val = {
    version: allWalletsVersion,
    wallets,
  };

  await keychain.saveObject(
    allWalletsKey,
    val,
    keychain.publicAccessControlOptions
  );
};

export const getAllWallets = async (): Promise<null | AllRainbowWalletsData> => {
  try {
    const allWallets = await keychain.loadObject(allWalletsKey);
    if (allWallets) {
      return allWallets as AllRainbowWalletsData;
    }
    return null;
  } catch (error) {
    logger.sentry('Error in getAllWallets');
    captureException(error);
    return null;
  }
};
let callbackAfterSeeds: null | (() => void) = null;

export function setCallbackAfterObtainingSeedsFromKeychainOrError(
  callback: () => void
) {
  callbackAfterSeeds = callback;
}

export const generateAccount = async (
  id: RainbowWallet['id'],
  index: number
): Promise<null | EthereumWallet> => {
  try {
    const isSeedPhraseMigrated = await keychain.loadString(
      oldSeedPhraseMigratedKey
    );
    let seedphrase;
    // We need to migrate the seedphrase & private key first
    // In that case we regenerate the existing private key to store it with the new format
    if (!isSeedPhraseMigrated) {
      const migratedSecrets = await migrateSecrets();
      seedphrase = migratedSecrets?.seedphrase;
    }

    let userPIN = null;
    if (android) {
      const hasBiometricsEnabled = await getSupportedBiometryType();
      // Fallback to custom PIN
      if (!hasBiometricsEnabled) {
        try {
          const { dispatch } = store;
          // Hide the loading overlay while showing the pin auth screen
          dispatch(setIsWalletLoading(null));
          userPIN = await authenticateWithPINAndCreateIfNeeded();
          dispatch(setIsWalletLoading(WalletLoadingStates.CREATING_WALLET));
        } catch (e) {
          callbackAfterSeeds?.();
          callbackAfterSeeds = null;
          return null;
        }
      }
    }

    if (!seedphrase) {
      const seedData = await getSeedPhrase(id);
      callbackAfterSeeds?.();
      callbackAfterSeeds = null;
      seedphrase = seedData?.seedphrase;
      if (userPIN) {
        try {
          seedphrase = await encryptor.decrypt(userPIN, seedphrase);
        } catch (e) {
          return null;
        }
      }
    }

    callbackAfterSeeds = null;

    if (!seedphrase) {
      throw new Error(`Can't access secret phrase to create new accounts`);
    }

    const {
      wallet: ethereumJSWallet,
    } = await ethereumUtils.deriveAccountFromMnemonic(seedphrase, index);
    if (!ethereumJSWallet) return null;
    const walletAddress = addHexPrefix(
      toChecksumAddress(ethereumJSWallet.getAddress().toString('hex'))
    );
    const walletPkey = addHexPrefix(
      ethereumJSWallet.getPrivateKey().toString('hex')
    );

    const newAccount = new Wallet(walletPkey);
    // Android users without biometrics need to secure their keys with a PIN
    if (userPIN) {
      try {
        const encryptedPkey = await encryptor.encrypt(userPIN, walletPkey);
        if (encryptedPkey) {
          await savePrivateKey(walletAddress, encryptedPkey);
        } else {
          logger.sentry('Error encrypting pkey to save it');
          return null;
        }
      } catch (e) {
        return null;
      }
    } else {
      await savePrivateKey(walletAddress, walletPkey);
    }
    // Creating signature for this wallet
    await createSignature(walletAddress, walletPkey);

    return newAccount;
  } catch (error) {
    logger.sentry('Error generating account for keychain', id);
    captureException(error);
    return null;
  }
};

const migrateSecrets = async (): Promise<MigratedSecretsResult | null> => {
  try {
    logger.sentry('migrating secrets!');
    const seedphrase = await oldLoadSeedPhrase();

    if (!seedphrase) {
      logger.sentry('old seed doesnt exist!');
      // Save the migration flag to prevent this flow in the future
      await keychain.saveString(
        oldSeedPhraseMigratedKey,
        'true',
        keychain.publicAccessControlOptions
      );
      logger.sentry(
        'Saved the migration flag to prevent this flow in the future'
      );
      return null;
    }

    logger.sentry('Got secret, now idenfifying wallet type');
    const type = identifyWalletType(seedphrase);
    logger.sentry('Got type: ', type);
    let hdnode: undefined | HDNode,
      node: undefined | HDNode,
      existingAccount: undefined | Wallet;
    switch (type) {
      case EthereumWalletType.privateKey:
        existingAccount = new Wallet(addHexPrefix(seedphrase));
        break;
      case EthereumWalletType.mnemonic:
        {
          const {
            wallet: ethereumJSWallet,
          } = await ethereumUtils.deriveAccountFromMnemonic(seedphrase);
          if (!ethereumJSWallet) return null;
          const walletPkey = addHexPrefix(
            ethereumJSWallet.getPrivateKey().toString('hex')
          );

          existingAccount = new Wallet(walletPkey);
        }
        break;
      case EthereumWalletType.seed:
        hdnode = HDNode.fromSeed(seedphrase);
        break;
      default:
    }

    if (!existingAccount && hdnode) {
      logger.sentry('No existing account, so we have to derive it');
      node = hdnode.derivePath(`${DEFAULT_HD_PATH}/0`);
      existingAccount = new Wallet(node.privateKey);
      logger.sentry('Got existing account');
    }

    if (!existingAccount) {
      return null;
    }

    // Check that wasn't migrated already!
    const pkeyExists = await keychain.hasKey(
      `${existingAccount.address}_${privateKeyKey}`
    );
    if (!pkeyExists) {
      logger.sentry('new pkey didnt exist so we should save it');
      // Save the private key in the new format
      await savePrivateKey(existingAccount.address, existingAccount.privateKey);
      logger.sentry('new pkey saved');
    }

    const selectedWalletData = await getSelectedWallet();
    const wallet: undefined | RainbowWallet = selectedWalletData?.wallet;
    if (!wallet) {
      return null;
    }

    // Save the seedphrase in the new format
    const seedExists = await keychain.hasKey(`${wallet.id}_${seedPhraseKey}`);
    if (!seedExists) {
      logger.sentry('new seed didnt exist so we should save it');
      await saveSeedPhrase(seedphrase, wallet.id);
      logger.sentry('new seed saved');
    }
    // Save the migration flag to prevent this flow in the future
    await keychain.saveString(
      oldSeedPhraseMigratedKey,
      'true',
      keychain.publicAccessControlOptions
    );
    logger.sentry('saved migrated key');
    return {
      hdnode,
      privateKey: existingAccount.privateKey,
      seedphrase,
      type,
    };
  } catch (e) {
    logger.sentry('Error while migrating secrets');
    captureException(e);
    return null;
  }
};

export const cleanUpWalletKeys = async (): Promise<boolean> => {
  const keys = [
    addressKey,
    allWalletsKey,
    oldSeedPhraseMigratedKey,
    pinKey,
    selectedWalletKey,
  ];

  try {
    await Promise.all(
      keys.map(key => {
        try {
          keychain.remove(key);
        } catch (e) {
          // key might not exists
          logger.log('failure to delete key', key);
        }
        return true;
      })
    );
    return true;
  } catch (e) {
    return false;
  }
};

export const loadSeedPhraseAndMigrateIfNeeded = async (
  id: RainbowWallet['id']
): Promise<null | EthereumWalletSeed> => {
  try {
    let seedPhrase = null;
    // First we need to check if that key already exists
    const keyFound = await keychain.hasKey(`${id}_${seedPhraseKey}`);
    if (!keyFound) {
      logger.sentry('key not found, we should have a migration pending...');
      // if it doesn't we might have a migration pending
      const isSeedPhraseMigrated = await keychain.loadString(
        oldSeedPhraseMigratedKey
      );
      logger.sentry('Migration pending?', !isSeedPhraseMigrated);

      // We need to migrate the seedphrase & private key first
      // In that case we regenerate the existing private key to store it with the new format
      if (!isSeedPhraseMigrated) {
        const migratedSecrets = await migrateSecrets();
        seedPhrase = migratedSecrets?.seedphrase ?? null;
      } else {
        logger.sentry('Migrated flag was set but there is no key!', id);
        captureMessage('Missing seed for wallet');
      }
    } else {
      logger.sentry('Getting seed directly');
      const seedData = await getSeedPhrase(id);
      seedPhrase = seedData?.seedphrase ?? null;
      let userPIN = null;
      if (android) {
        const hasBiometricsEnabled = await getSupportedBiometryType();
        if (!seedData && !seedPhrase && !hasBiometricsEnabled) {
          logger.sentry(
            'Wallet is created with biometric data, there is no access to the seed'
          );
          throw new Error(createdWithBiometricError);
        }
        // Fallback to check PIN
        const isSeedHasPINInfo = seedPhrase?.includes('cipher');
        if (isSeedHasPINInfo) {
          try {
            userPIN = await authenticateWithPIN();
            if (userPIN) {
              // Dencrypt with the PIN
              seedPhrase = await encryptor.decrypt(userPIN, seedPhrase);
            } else {
              return null;
            }
          } catch (e) {
            return null;
          }
        }
      }

      if (seedPhrase) {
        logger.sentry('got seed succesfully');
      } else {
        captureMessage(
          'Missing seed for wallet - (Key exists but value isnt valid)!'
        );
      }
    }

    return seedPhrase;
  } catch (error) {
    logger.sentry('Error in loadSeedPhraseAndMigrateIfNeeded');
    captureException(error);
    throw error;
  }
};
