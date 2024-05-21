import { TransactionRequest } from '@ethersproject/abstract-provider';
import { arrayify } from '@ethersproject/bytes';
import { HDNode } from '@ethersproject/hdnode';
import { Provider } from '@ethersproject/providers';
import { Transaction } from '@ethersproject/transactions';
import { Wallet } from '@ethersproject/wallet';
import { signTypedData, SignTypedDataVersion, TypedMessage } from '@metamask/eth-sig-util';
import { generateMnemonic } from 'bip39';
import { isValidAddress, toBuffer, toChecksumAddress } from 'ethereumjs-util';
import { hdkey as EthereumHDKey, default as LibWallet } from 'ethereumjs-wallet';
import lang from 'i18n-js';
import { findKey, isEmpty } from 'lodash';
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
import profileUtils, { addressHashedColorIndex, addressHashedEmoji } from '../utils/profileUtils';
import * as keychain from '@/model/keychain';
import * as kc from '@/keychain';
import { PreferenceActionType, setPreference } from './preferences';
import { LedgerSigner } from '@/handlers/LedgerSigner';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';
import { EthereumAddress } from '@/entities';
import { authenticateWithPIN, authenticateWithPINAndCreateIfNeeded } from '@/handlers/authentication';
import { saveAccountEmptyState } from '@/handlers/localstorage/accountLocal';
import {
  addHexPrefix,
  isHexString,
  isHexStringIgnorePrefix,
  isValidBluetoothDeviceId,
  isValidMnemonic,
  web3Provider,
} from '@/handlers/web3';
import { createSignature } from '@/helpers/signingWallet';
import showWalletErrorAlert from '@/helpers/support';
import walletTypes, { EthereumWalletType } from '@/helpers/walletTypes';
import { updateWebDataEnabled } from '@/redux/showcaseTokens';
import store from '@/redux/store';
import { ethereumUtils } from '@/utils';
import { logger, RainbowError } from '@/logger';
import { deriveAccountFromBluetoothHardwareWallet, deriveAccountFromMnemonic, deriveAccountFromWalletInput } from '@/utils/wallet';
import {
  AddressWithRelationship,
  initializeNotificationSettingsForAddresses,
  WalletNotificationRelationship,
} from '@/notifications/settings';
import { DebugContext } from '@/logger/debugContext';
import { IS_ANDROID } from '@/env';
import { setHardwareTXError } from '@/navigation/HardwareWalletTxNavigator';
import { Signer } from '@ethersproject/abstract-signer';
import { sanitizeTypedData } from '@/utils/signingUtils';
import { Network } from '@/helpers';

export type EthereumPrivateKey = string;
type EthereumMnemonic = string;
type EthereumSeed = string;
export type EthereumWalletSeed = EthereumAddress | EthereumPrivateKey | EthereumMnemonic | EthereumSeed;
type HardwareKey = `${string}/${number}`;

interface WalletInitialized {
  isNew: boolean;
  walletAddress?: EthereumAddress;
}

interface TransactionRequestParam {
  transaction: TransactionRequest;
  existingWallet?: Signer;
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
  backupDate?: number;
  backupType?: string;
  damaged?: boolean;
  deviceId?: string;
}

export interface AllRainbowWallets {
  [key: string]: RainbowWallet;
}

export interface AllRainbowWalletsData {
  wallets: AllRainbowWallets;
  version: string;
}

export interface RainbowSelectedWalletData {
  wallet: RainbowWallet;
}

export interface PrivateKeyData {
  privateKey: EthereumPrivateKey | HardwareKey;
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
  ledger = 'ledger',
}

const privateKeyVersion = 1.0;
const seedPhraseVersion = 1.0;
const selectedWalletVersion = 1.0;
export const allWalletsVersion = 1.0;

export const DEFAULT_HD_PATH = `m/44'/60'/0'/0`;
export const DEFAULT_WALLET_NAME = 'My Wallet';

const authenticationPrompt = lang.t('wallet.authenticate.please');

export const createdWithBiometricError = 'createdWithBiometricError';

const isHardwareWalletKey = (key: string | null) => {
  const data = key?.split('/');
  if (data && data.length > 1) {
    return true;
  }
  return false;
};

export const getHdPath = ({ type, index }: { type: WalletLibraryType; index: number }): string => {
  switch (type) {
    // @see https://github.com/LedgerHQ/ledger-live/wiki/LLC:derivation for info in BIP-44 and ledger derivations
    case WalletLibraryType.ledger:
      return `m/44'/60'/${index}'/0/0`;
    default:
      return `${DEFAULT_HD_PATH}/${index}`;
  }
};

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
    const wallet = await createWallet({
      seed: seedPhrase,
      color,
      name,
      overwrite,
      checkedWallet,
      image,
      silent,
    });
    walletAddress = wallet?.address;
    return { isNew, walletAddress };
  }

  walletAddress = await loadAddress();

  if (!walletAddress) {
    const wallet = await createWallet({});
    if (!wallet?.address) {
      throw new RainbowError('Error creating wallet address');
    }

    walletAddress = wallet.address;
    isNew = true;
  }

  if (isNew) {
    saveAccountEmptyState(true, walletAddress.toLowerCase(), network ?? Network.mainnet);
  }

  return { isNew, walletAddress };
};

export const loadWallet = async (
  address?: EthereumAddress | undefined,
  showErrorIfNotLoaded = true,
  provider?: Provider
): Promise<null | Wallet | LedgerSigner> => {
  const addressToUse = address || (await loadAddress());
  if (!addressToUse) {
    return null;
  }

  // checks if the address is a hardware wallet for proper handling
  const { wallets } = store.getState().wallets;
  const selectedWallet = findWalletWithAccount(wallets!, addressToUse);
  const isHardwareWallet = selectedWallet?.type === walletTypes.bluetooth;

  const privateKey = await loadPrivateKey(addressToUse, isHardwareWallet);
  if (privateKey === -1 || privateKey === -2) {
    return null;
  }
  if (isHardwareWalletKey(privateKey)) {
    const index = privateKey?.split('/')[1];
    const deviceId = privateKey?.split('/')[0];
    if (typeof index !== undefined && provider && deviceId) {
      return new LedgerSigner(provider, getHdPath({ type: WalletLibraryType.ledger, index: Number(index) }), deviceId);
    }
  } else if (privateKey) {
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
  let isHardwareWallet = false;
  try {
    logger.info('wallet: sending transaction', { transaction });
    const wallet = existingWallet || (await loadWallet(undefined, true, provider));
    // have to check inverse or we trigger unwanted BT permissions requests
    if (!(wallet instanceof Wallet)) {
      isHardwareWallet = true;
    }
    if (!wallet) return null;
    try {
      const result = await wallet.sendTransaction(transaction);
      logger.debug('send - tx result', { result }, DebugContext.wallet);
      return { result };
    } catch (error) {
      logger.error(new RainbowError('Failed to send transaction'), { error });
      if (isHardwareWallet) {
        setHardwareTXError(true);
      } else {
        Alert.alert(lang.t('wallet.transaction.alert.failed_transaction'));
      }

      return { error };
    }
  } catch (error) {
    if (isHardwareWallet) {
      setHardwareTXError(true);
    } else {
      Alert.alert(lang.t('wallet.transaction.alert.failed_transaction'));
    }
    logger.error(new RainbowError('Failed to send transaction due to auth'), {
      error,
    });
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
  let isHardwareWallet = false;
  try {
    logger.info('wallet: signing transaction');
    const wallet = existingWallet || (await loadWallet(undefined, true, provider));
    // have to check inverse or we trigger unwanted BT permissions requests
    if (!(wallet instanceof Wallet)) {
      isHardwareWallet = true;
    }
    if (!wallet) return null;
    try {
      const result = await wallet.signTransaction(transaction);
      return { result };
    } catch (error) {
      if (isHardwareWallet) {
        setHardwareTXError(true);
      } else {
        Alert.alert(lang.t('wallet.transaction.alert.failed_transaction'));
      }
      logger.error(new RainbowError('Failed to sign transaction'), { error });
      return { error };
    }
  } catch (error) {
    if (isHardwareWallet) {
      setHardwareTXError(true);
    } else {
      Alert.alert(lang.t('wallet.transaction.alert.authentication'));
    }
    logger.error(new RainbowError('Failed to sign transaction due to auth'), {
      error,
    });
    return null;
  }
};

export const signPersonalMessage = async (
  message: string | Uint8Array,
  existingWallet?: Signer,
  provider?: Provider
): Promise<null | {
  result?: string;
  error?: any;
}> => {
  let isHardwareWallet = false;
  try {
    logger.info('wallet: signing personal message', { message });
    const wallet = existingWallet || (await loadWallet(undefined, true, provider));
    // have to check inverse or we trigger unwanted BT permissions requests
    if (!(wallet instanceof Wallet)) {
      isHardwareWallet = true;
    }
    try {
      if (!wallet) return null;
      const result = await wallet.signMessage(
        typeof message === 'string' && isHexString(addHexPrefix(message)) ? arrayify(addHexPrefix(message)) : message
      );
      return { result };
    } catch (error) {
      if (isHardwareWallet) {
        setHardwareTXError(true);
      } else {
        Alert.alert(lang.t('wallet.transaction.alert.failed_sign_message'));
      }
      logger.error(new RainbowError('Failed to sign personal message'), {
        error,
      });
      return { error };
    }
  } catch (error) {
    if (isHardwareWallet) {
      setHardwareTXError(true);
    } else {
      Alert.alert(lang.t('wallet.transaction.alert.authentication'));
    }
    logger.error(new RainbowError('Failed to sign personal message due to auth'), { error });
    return null;
  }
};

export const signTypedDataMessage = async (
  message: string | TypedData,
  existingWallet?: Signer,
  provider?: Provider
): Promise<null | {
  result?: string;
  error?: any;
}> => {
  let isHardwareWallet = false;
  try {
    logger.info('wallet: signing typed data message', { message });
    const wallet = existingWallet || (await loadWallet(undefined, true, provider));
    if (!wallet) return null;
    // have to check inverse or we trigger unwanted BT permissions requests
    if (!(wallet instanceof Wallet)) {
      isHardwareWallet = true;
    }
    try {
      let parsedData = message;

      // we need to parse the data different for both possible types
      try {
        parsedData = typeof message === 'string' ? sanitizeTypedData(JSON.parse(message)) : sanitizeTypedData(message);
        // eslint-disable-next-line no-empty
      } catch (e) {}

      // There are 3 types of messages
      // v1 => basic data types
      // v3 =>  has type / domain / primaryType
      // v4 => same as v3 but also supports which supports arrays and recursive structs.
      // Because v4 is backwards compatible with v3, we're supporting only v4

      let version = 'v1';
      if (typeof parsedData === 'object' && (parsedData.types || parsedData.primaryType || parsedData.domain)) {
        version = 'v4';
      }

      // Hardware wallets
      // have to check inverse or we trigger unwanted BT permissions requests
      if (!(wallet instanceof Wallet)) {
        const result = await (wallet as LedgerSigner).signTypedDataMessage(parsedData, version === 'v1');
        return { result };
      } else {
        const pkeyBuffer = toBuffer(addHexPrefix(wallet.privateKey));
        return {
          result: signTypedData({
            data: parsedData as TypedMessage<TypedDataTypes>,
            privateKey: pkeyBuffer,
            version: version.toUpperCase() as SignTypedDataVersion,
          }),
        };
      }
    } catch (error) {
      if (isHardwareWallet) {
        setHardwareTXError(true);
      } else {
        Alert.alert(lang.t('wallet.transaction.alert.failed_sign_message'));
      }
      logger.error(new RainbowError('Failed to sign typed data message'), {
        error,
      });
      return { error };
    }
  } catch (error) {
    if (isHardwareWallet) {
      setHardwareTXError(true);
    } else {
      Alert.alert(lang.t('wallet.transaction.alert.authentication'));
    }
    logger.error(new RainbowError('Failed to sign typed data message due to auth'), { error });
    return null;
  }
};

export const oldLoadSeedPhrase = async (): Promise<null | EthereumWalletSeed> => {
  const seedPhrase = await keychain.loadString(seedPhraseKey, {
    authenticationPrompt,
  });
  return seedPhrase as string | null;
};

export const loadAddress = (): Promise<null | EthereumAddress> => keychain.loadString(addressKey) as Promise<string | null>;

export const loadPrivateKey = async (address: EthereumAddress, hardware: boolean): Promise<null | EthereumPrivateKey | -1 | -2> => {
  try {
    const isSeedPhraseMigrated = await keychain.loadString(oldSeedPhraseMigratedKey);

    // We need to migrate the seedphrase & private key first
    // In that case we regenerate the existing private key to store it with the new format
    let privateKey = null;
    if (!isSeedPhraseMigrated) {
      const migratedSecrets = await migrateSecrets();
      privateKey = migratedSecrets?.privateKey;
    }

    if (!privateKey) {
      const privateKeyData = await getKeyForWallet(address, hardware);
      if (privateKeyData === -1) {
        return -1;
      }
      privateKey = privateKeyData?.privateKey ?? null;
    }

    return privateKey;
  } catch (error) {
    logger.error(new RainbowError('Error loading private key'), { error });
    return null;
  }
};

export const saveAddress = async (address: EthereumAddress, accessControlOptions = keychain.publicAccessControlOptions): Promise<void> => {
  return keychain.saveString(addressKey, address, accessControlOptions);
};

export const identifyWalletType = (walletSeed: EthereumWalletSeed): EthereumWalletType => {
  if (isHexStringIgnorePrefix(walletSeed) && addHexPrefix(walletSeed).length === 66) {
    return EthereumWalletType.privateKey;
  }
  // Bluetooth device id (Ledger nano x)
  if (isValidBluetoothDeviceId(walletSeed)) {
    return EthereumWalletType.bluetooth;
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

type CreateWalletParams = {
  seed?: null | EthereumSeed;
  color?: null | number;
  name?: null | string;
  isRestoring?: boolean;
  overwrite?: boolean;
  checkedWallet?: null | EthereumWalletFromSeed;
  image?: null | string;
  silent?: boolean;
  clearCallbackOnStartCreation?: boolean;
  userPin?: string;
};

export const createWallet = async ({
  seed = null,
  color = null,
  name = null,
  isRestoring = false,
  overwrite = false,
  checkedWallet = null,
  image = null,
  silent = false,
  clearCallbackOnStartCreation = false,
  userPin,
}: CreateWalletParams): Promise<null | EthereumWallet> => {
  if (clearCallbackOnStartCreation) {
    callbackAfterSeeds?.();
    callbackAfterSeeds = null;
  }
  const isImported = !!seed;
  logger.info('Importing new wallet');
  if (!seed) {
    logger.info('Creating new wallet');
  }
  const walletSeed = seed || generateMnemonic();
  const addresses: RainbowAccount[] = [];
  try {
    const { dispatch } = store;

    const {
      isHDWallet,
      type,
      root,
      wallet: walletResult,
      address,
      walletType,
    } = checkedWallet || (await deriveAccountFromWalletInput(walletSeed));
    const isReadOnlyType = type === EthereumWalletType.readOnly;
    const isHardwareWallet = type === EthereumWalletType.bluetooth;
    let pkey = walletSeed;
    if (!walletResult || !address) return null;
    const walletAddress = address;
    if (isHDWallet) {
      pkey = addHexPrefix((walletResult as LibWallet).getPrivateKey().toString('hex'));
    } else if (isHardwareWallet) {
      // hardware pkey format is ${bluetooth device id}/${index}
      pkey = `${seed}/0`;
    }
    logger.debug('[createWallet] - getWallet from seed', {}, DebugContext.wallet);

    // Get all wallets
    const allWalletsResult = await getAllWallets();
    logger.debug('[createWallet] - getAllWallets', {}, DebugContext.wallet);
    const allWallets: AllRainbowWallets = allWalletsResult?.wallets ?? {};

    let existingWalletId = null;
    if (isImported) {
      // Checking if the generated account already exists and is visible
      logger.debug('[createWallet] - checking if account already exists', {}, DebugContext.wallet);
      const alreadyExistingWallet = Object.values(allWallets).find((someWallet: RainbowWallet) => {
        return !!someWallet.addresses.find(
          account => toChecksumAddress(account.address) === toChecksumAddress(walletAddress) && account.visible
        );
      });

      existingWalletId = alreadyExistingWallet?.id;

      // Don't allow adding a readOnly wallet that you have already visible
      // or a private key that you already have visible as a seed or mnemonic
      const isPrivateKeyOverwritingSeedMnemonic =
        type === EthereumWalletType.privateKey &&
        (alreadyExistingWallet?.type === EthereumWalletType.seed || alreadyExistingWallet?.type === EthereumWalletType.mnemonic);
      if (!overwrite && alreadyExistingWallet && (isReadOnlyType || isPrivateKeyOverwritingSeedMnemonic)) {
        if (!isRestoring) {
          setTimeout(() => Alert.alert(lang.t('wallet.new.alert.oops'), lang.t('wallet.new.alert.looks_like_already_imported')), 1);
        }
        logger.debug('[createWallet] - already imported this wallet', {}, DebugContext.wallet);
        return null;
      }
    }

    const id = existingWalletId || `wallet_${Date.now()}`;
    logger.debug('[createWallet] - wallet ID', { id }, DebugContext.wallet);

    // load this up front and pass to other keychain setters to avoid multiple
    // auth requests
    const androidEncryptionPin =
      IS_ANDROID && !(await kc.getSupportedBiometryType()) ? userPin || (await authenticateWithPINAndCreateIfNeeded()) : undefined;

    await saveSeedPhrase(walletSeed, id, { androidEncryptionPin });

    logger.debug('[createWallet] - saved seed phrase', {}, DebugContext.wallet);

    // Save address
    await saveAddress(walletAddress);
    logger.debug('[createWallet] - saved address', {}, DebugContext.wallet);

    // Save private key
    await saveKeyForWallet(walletAddress, pkey, isHardwareWallet, {
      androidEncryptionPin,
    });
    logger.debug('[createWallet] - saved private key', {}, DebugContext.wallet);

    const colorIndexForWallet = color !== null ? color : addressHashedColorIndex(walletAddress) || 0;

    const label = name || '';

    addresses.push({
      address: walletAddress,
      avatar: null,
      color: colorIndexForWallet,
      image,
      index: 0,
      label,
      visible: true,
    });
    if (type !== EthereumWalletType.readOnly && type !== EthereumWalletType.bluetooth) {
      // Creating signature for this wallet
      logger.debug(`[createWallet] - generating signature`, {}, DebugContext.wallet);
      await createSignature(walletAddress, pkey);
      // Enable web profile
      logger.debug(`[createWallet] - enabling web profile`, {}, DebugContext.wallet);
      store.dispatch(updateWebDataEnabled(true, walletAddress));
      // Save the color
      setPreference(PreferenceActionType.init, 'profile', address, {
        accountColor: lightModeThemeColors.avatarBackgrounds[colorIndexForWallet],
        accountSymbol: profileUtils.addressHashedEmoji(address),
      });
    }

    // Initiate auto account discovery for imported wallets via seedphrase
    // or for hardware wallets
    if ((isHDWallet && root && isImported) || (isHardwareWallet && seed)) {
      logger.debug('[createWallet] - initializing account auto discovery', {}, DebugContext.wallet);
      let index = 1;
      let lookup = 0;
      // Starting on index 1, we check the tx history
      // for each account. If there's history we add it to the wallet.
      // We stop once we 2 accounts with no history
      while (lookup < 2) {
        let nextWallet: any = null;
        if (isHardwareWallet) {
          const walletObj = await deriveAccountFromBluetoothHardwareWallet(seed, index);
          nextWallet = {
            address: walletObj.wallet.address,
            privateKey: walletObj.wallet.privateKey,
          };
        } else {
          const child = root?.deriveChild(index);
          const walletObj = child?.getWallet();
          const pkey = walletObj?.getPrivateKey()?.toString('hex');
          if (pkey) {
            nextWallet = new Wallet(addHexPrefix(pkey));
          }
        }

        let hasTxHistory = false;
        try {
          hasTxHistory = await ethereumUtils.hasPreviousTransactions(nextWallet.address);
        } catch (error) {
          logger.error(new RainbowError('[createWallet] - Error getting txn history for address'), { error });
        }

        let discoveredAccount: RainbowAccount | undefined;
        let discoveredWalletId: RainbowWallet['id'] | undefined;

        Object.values(allWallets).forEach(someWallet => {
          const existingAccount = someWallet.addresses.find(
            account => toChecksumAddress(account.address) === toChecksumAddress(nextWallet.address)
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
        let colorIndexForWallet = addressHashedColorIndex(nextWallet.address) || 0;
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
          await saveKeyForWallet(nextWallet.address, nextWallet.privateKey, isHardwareWallet, { androidEncryptionPin });
          logger.debug(`[createWallet] - saved private key for wallet index: ${index}`, {}, DebugContext.wallet);

          addresses.push({
            address: nextWallet.address,
            avatar: null,
            color: colorIndexForWallet,
            image: null,
            index,
            label,
            visible: true,
          });

          if (!isHardwareWallet) {
            // Creating signature for this wallet
            logger.debug(`[createWallet] - enabling web profile`, {}, DebugContext.wallet);
            await createSignature(nextWallet.address, nextWallet.privateKey);
            // Enable web profile
            store.dispatch(updateWebDataEnabled(true, nextWallet.address));

            // Save the color
            setPreference(PreferenceActionType.init, 'profile', nextWallet.address, {
              accountColor: lightModeThemeColors.avatarBackgrounds[colorIndexForWallet],
              accountSymbol: addressHashedEmoji(nextWallet.address),
            });
          }

          index += 1;
        } else {
          lookup += 1;
        }
      }
    }

    // if imported and we have only one account, we name the wallet too.
    let walletName = DEFAULT_WALLET_NAME;
    if (name) {
      walletName = name;
    }

    let primary = false;
    // If it's not imported or it's the first one with a seed phrase
    // it's the primary wallet
    if (!isImported || (!findKey(allWallets, ['type', EthereumWalletType.mnemonic]) && type === EthereumWalletType.mnemonic)) {
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
    const relationship =
      type === EthereumWalletType.readOnly ? WalletNotificationRelationship.WATCHER : WalletNotificationRelationship.OWNER;
    const addressesWithRelationship: AddressWithRelationship[] = addresses.map(account => ({
      relationship,
      address: account.address,
    }));
    initializeNotificationSettingsForAddresses(addressesWithRelationship);

    // add the device id (seed) to the wallet object for hardware wallets
    if (type === walletTypes.bluetooth && seed) {
      allWallets[id].deviceId = seed;
    }

    if (!silent) {
      logger.debug('[createWallet] - setting selected wallet', {}, DebugContext.wallet);
      await setSelectedWallet(allWallets[id]);
    }

    logger.debug('[createWallet] - saving all wallets', {}, DebugContext.wallet);
    await saveAllWallets(allWallets);

    if (walletResult && walletAddress) {
      const walletRes =
        walletType === WalletLibraryType.ethers || walletType === WalletLibraryType.ledger ? (walletResult as Wallet) : new Wallet(pkey);

      return walletRes;
    }
    return null;
  } catch (error) {
    logger.error(new RainbowError('Error in createWallet'), { error });
    return null;
  }
};

/**
 * @desc Saves wallet keys for the given address depending wallet type
 * @param address The wallet address.
 * @param privateKey The private key for the given address.
 * @param hardware If the wallet is a hardware wallet.
 * @return null
 */
export const saveKeyForWallet = async (
  address: EthereumAddress,
  walletKey: null | EthereumPrivateKey | HardwareKey,
  hardware: boolean,
  { androidEncryptionPin }: Pick<kc.KeychainOptions, 'androidEncryptionPin'> = {}
) => {
  if (hardware) {
    return await saveHardwareKey(address, walletKey as HardwareKey, {
      androidEncryptionPin,
    });
  } else {
    return await savePrivateKey(address, walletKey, { androidEncryptionPin });
  }
};

/**
 * @desc Gets wallet keys for the given address depending wallet type
 * @param address The wallet address.
 * @param hardware If the wallet is a hardware wallet.
 * @return null | PrivateKeyData | -1
 */
export const getKeyForWallet = async (address: EthereumAddress, hardware: boolean): Promise<null | PrivateKeyData | -1> => {
  if (hardware) {
    return await getHardwareKey(address);
  } else {
    return await getPrivateKey(address);
  }
};

/**
 * @desc Saves wallet private key to private keychain for a given address.
 * @param address The wallet address.
 * @param privateKey The private key for the given address.
 * @return null
 */
export const savePrivateKey = async (
  address: EthereumAddress,
  privateKey: null | EthereumPrivateKey,
  { androidEncryptionPin }: Pick<kc.KeychainOptions, 'androidEncryptionPin'> = {}
) => {
  const privateAccessControlOptions = await keychain.getPrivateAccessControlOptions();

  const key = `${address}_${privateKeyKey}`;
  const val = {
    address,
    privateKey,
    version: privateKeyVersion,
  };
  // if its a hardware wallet we dont want in the private keychain
  await kc.setObject(key, val, {
    ...privateAccessControlOptions,
    androidEncryptionPin,
  });
};

/**
 * @desc Saves hardware wallet details to public keychain for a given address.
 * @param address The wallet address for the hardware wallet.
 * @param privateKey The hardware wallet key for the given address.
 * @return null
 */
export const saveHardwareKey = async (
  address: EthereumAddress,
  privateKey: null | HardwareKey,
  { androidEncryptionPin }: Pick<kc.KeychainOptions, 'androidEncryptionPin'> = {}
) => {
  const key = `${address}_${privateKeyKey}`;
  const val = {
    address,
    privateKey,
    version: privateKeyVersion,
  };

  await keychain.saveObject(key, val, keychain.publicAccessControlOptions);
};

/**
 * @desc Gets wallet private key for a given address.
 * @param address The wallet address.
 * @return null | PrivateKeyData | -1
 */
export const getPrivateKey = async (address: EthereumAddress): Promise<null | PrivateKeyData | -1> => {
  try {
    const key = `${address}_${privateKeyKey}`;
    const options = { authenticationPrompt };

    const androidEncryptionPin = IS_ANDROID && !(await kc.getSupportedBiometryType()) ? await authenticateWithPIN() : undefined;
    const { value: pkey, error } = await kc.getObject<PrivateKeyData>(key, {
      ...options,
      androidEncryptionPin,
    });

    if (error === -2) {
      Alert.alert(lang.t('wallet.authenticate.alert.error'), lang.t('wallet.authenticate.alert.current_authentication_not_secure_enough'));
      return null;
    }

    return pkey || null;
  } catch (error) {
    logger.error(new RainbowError('Error in getPrivateKey'), { error });
    return null;
  }
};

/**
 * @desc Gets the hardware wallet details for a given address.
 * @param address The wallet address for the hardware wallet.
 * @return PrivateKeyData | null
 */
export const getHardwareKey = async (address: EthereumAddress): Promise<null | PrivateKeyData> => {
  try {
    const key = `${address}_${privateKeyKey}`;
    const hardwareKey = (await keychain.loadObject(key)) as PrivateKeyData;

    return hardwareKey || null;
  } catch (error) {
    logger.error(new RainbowError('Error in getHardwareKey'), { error });
    return null;
  }
};

export const saveSeedPhrase = async (
  seedphrase: EthereumWalletSeed,
  keychain_id: RainbowWallet['id'],
  { androidEncryptionPin }: Pick<kc.KeychainOptions, 'androidEncryptionPin'> = {}
): Promise<void> => {
  const privateAccessControlOptions = await keychain.getPrivateAccessControlOptions();
  const key = `${keychain_id}_${seedPhraseKey}`;
  const val = {
    id: keychain_id,
    seedphrase,
    version: seedPhraseVersion,
  };

  return kc.setObject(key, val, {
    ...privateAccessControlOptions,
    androidEncryptionPin,
  });
};

export const getSeedPhrase = async (
  id: RainbowWallet['id'],
  { androidEncryptionPin }: Pick<kc.KeychainOptions, 'androidEncryptionPin'> = {}
): Promise<null | SeedPhraseData> => {
  try {
    const key = `${id}_${seedPhraseKey}`;
    const { value: seedPhraseData, error } = await kc.getObject<SeedPhraseData>(key, {
      authenticationPrompt,
      androidEncryptionPin,
    });

    if (error === -2) {
      Alert.alert(lang.t('wallet.authenticate.alert.error'), lang.t('wallet.authenticate.alert.current_authentication_not_secure_enough'));
      return null;
    }

    return seedPhraseData || null;
  } catch (error) {
    logger.error(new RainbowError('Error in getSeedPhrase'), { error });
    return null;
  }
};

export const setSelectedWallet = async (wallet: RainbowWallet): Promise<void> => {
  const val = {
    version: selectedWalletVersion,
    wallet,
  };

  return keychain.saveObject(selectedWalletKey, val, keychain.publicAccessControlOptions);
};

export const getSelectedWallet = async (): Promise<null | RainbowSelectedWalletData> => {
  try {
    const selectedWalletData = await keychain.loadObject(selectedWalletKey);
    if (selectedWalletData) {
      return selectedWalletData as RainbowSelectedWalletData;
    }
    return null;
  } catch (error) {
    logger.error(new RainbowError('Error in getSelectedWallet'), { error });
    return null;
  }
};

export const saveAllWallets = async (wallets: AllRainbowWallets) => {
  const val = {
    version: allWalletsVersion,
    wallets,
  };

  await keychain.saveObject(allWalletsKey, val, keychain.publicAccessControlOptions);
};

export const getAllWallets = async (): Promise<null | AllRainbowWalletsData> => {
  try {
    const allWallets = await keychain.loadObject(allWalletsKey);
    if (allWallets) {
      return allWallets as AllRainbowWalletsData;
    }
    return null;
  } catch (error) {
    logger.error(new RainbowError('Error in getAllWallets'), { error });
    return null;
  }
};
let callbackAfterSeeds: null | (() => void) = null;

export function setCallbackAfterObtainingSeedsFromKeychainOrError(callback: () => void) {
  callbackAfterSeeds = callback;
}

export const generateAccount = async (id: RainbowWallet['id'], index: number): Promise<null | EthereumWallet> => {
  try {
    const isSeedPhraseMigrated = await keychain.loadString(oldSeedPhraseMigratedKey);
    let seedphrase;
    // We need to migrate the seedphrase & private key first
    // In that case we regenerate the existing private key to store it with the new format
    if (!isSeedPhraseMigrated) {
      const migratedSecrets = await migrateSecrets();
      seedphrase = migratedSecrets?.seedphrase;
    }

    // load this up front and pass to other keychain setters to avoid multiple
    // auth requests
    const androidEncryptionPin = IS_ANDROID && !(await kc.getSupportedBiometryType()) ? await authenticateWithPIN() : undefined;

    if (!seedphrase) {
      const seedData = await getSeedPhrase(id, { androidEncryptionPin });
      callbackAfterSeeds?.();
      callbackAfterSeeds = null;
      seedphrase = seedData?.seedphrase;
    }

    callbackAfterSeeds = null;

    if (!seedphrase) {
      throw new Error(`Can't access secret phrase to create new accounts`);
    }
    const { wallet: ethereumJSWallet } = await deriveAccountFromMnemonic(seedphrase, index);
    if (!ethereumJSWallet) return null;
    const walletAddress = addHexPrefix(toChecksumAddress(ethereumJSWallet.getAddress().toString('hex')));
    const walletPkey = addHexPrefix(ethereumJSWallet.getPrivateKey().toString('hex'));

    const newAccount = new Wallet(walletPkey);
    await saveKeyForWallet(walletAddress, walletPkey, false, {
      androidEncryptionPin,
    });
    // Creating signature for this wallet
    await createSignature(walletAddress, walletPkey);

    // Initialize settings for freshly created account
    initializeNotificationSettingsForAddresses([
      {
        address: walletAddress,
        // Wallet or account created from within the app is attached to a seed phrase so it's an owned wallet
        relationship: WalletNotificationRelationship.OWNER,
      },
    ]);

    return newAccount;
  } catch (error) {
    logger.error(new RainbowError('[generateAccount] - Error generating account for keychain'), { error });
    return null;
  }
};

const migrateSecrets = async (): Promise<MigratedSecretsResult | null> => {
  try {
    logger.info('Migrating wallet secrets');
    const seedphrase = await oldLoadSeedPhrase();

    if (!seedphrase) {
      logger.debug('[migrateSecrets] - old seed doesnt exist!', {}, DebugContext.wallet);
      // Save the migration flag to prevent this flow in the future
      await keychain.saveString(oldSeedPhraseMigratedKey, 'true', keychain.publicAccessControlOptions);
      logger.debug('[migrateSecrets] - marking secrets as migrated', {}, DebugContext.wallet);
      return null;
    }

    const type = identifyWalletType(seedphrase);
    logger.debug(`[migrateSecrets] - wallet type: ${type}`, {}, DebugContext.wallet);
    let hdnode: undefined | HDNode, node: undefined | HDNode, existingAccount: undefined | Wallet;
    switch (type) {
      case EthereumWalletType.privateKey:
        existingAccount = new Wallet(addHexPrefix(seedphrase));
        break;
      case EthereumWalletType.mnemonic:
        {
          const { wallet: ethereumJSWallet } = await deriveAccountFromMnemonic(seedphrase);
          if (!ethereumJSWallet) return null;
          const walletPkey = addHexPrefix(ethereumJSWallet.getPrivateKey().toString('hex'));

          existingAccount = new Wallet(walletPkey);
        }
        break;
      case EthereumWalletType.seed:
        hdnode = HDNode.fromSeed(seedphrase);
        break;
      default:
    }

    if (!existingAccount && hdnode) {
      logger.debug('[migrateSecrets] - No existing account, so we have to derive it', {}, DebugContext.wallet);
      node = hdnode.derivePath(getHdPath({ type: WalletLibraryType.ethers, index: 0 }));
      existingAccount = new Wallet(node.privateKey);
      logger.debug('[migrateSecrets] - Got existing account', {}, DebugContext.wallet);
    }

    if (!existingAccount) {
      return null;
    }

    // Check that wasn't migrated already!
    const pkeyExists = await keychain.hasKey(`${existingAccount.address}_${privateKeyKey}`);
    if (!pkeyExists) {
      logger.debug('[migrateSecrets] - new pkey didnt exist so we should save it', {}, DebugContext.wallet);
      // Save the private key in the new format
      await saveKeyForWallet(existingAccount.address, existingAccount.privateKey, false);
      logger.debug('[migrateSecrets] - new pkey saved', {}, DebugContext.wallet);
    }

    const selectedWalletData = await getSelectedWallet();
    const wallet: undefined | RainbowWallet = selectedWalletData?.wallet;
    if (!wallet) {
      return null;
    }

    // Save the seedphrase in the new format
    const seedExists = await keychain.hasKey(`${wallet.id}_${seedPhraseKey}`);
    if (!seedExists) {
      logger.debug('[migrateSecrets] - new seed didnt exist so we should save it', {}, DebugContext.wallet);
      await saveSeedPhrase(seedphrase, wallet.id);
      logger.debug('[migrateSecrets] - new seed saved', {}, DebugContext.wallet);
    }
    // Save the migration flag to prevent this flow in the future
    await keychain.saveString(oldSeedPhraseMigratedKey, 'true', keychain.publicAccessControlOptions);
    logger.debug('[migrateSecrets] - saved migrated key', {}, DebugContext.wallet);
    return {
      hdnode,
      privateKey: existingAccount.privateKey,
      seedphrase,
      type,
    };
  } catch (error) {
    logger.error(new RainbowError('[migrateSecrets] - Error while migrating secrets'), { error });
    return null;
  }
};

export const cleanUpWalletKeys = async (): Promise<boolean> => {
  const keys = [addressKey, allWalletsKey, oldSeedPhraseMigratedKey, pinKey, selectedWalletKey];

  try {
    await Promise.all(
      keys.map(key => {
        try {
          keychain.remove(key);
        } catch (error) {
          // key might not exists
          logger.warn('[cleanUpWalletKeys] - failure to delete key', {
            key,
            error,
          });
        }
        return true;
      })
    );
    return true;
  } catch (e) {
    return false;
  }
};

export const loadSeedPhraseAndMigrateIfNeeded = async (id: RainbowWallet['id']): Promise<null | EthereumWalletSeed> => {
  try {
    let seedPhrase = null;
    // First we need to check if that key already exists
    const keyFound = await keychain.hasKey(`${id}_${seedPhraseKey}`);
    if (!keyFound) {
      logger.debug('[loadAndMigrate] - key not found, should need migration', {}, DebugContext.wallet);
      // if it doesn't we might have a migration pending
      const isSeedPhraseMigrated = await keychain.loadString(oldSeedPhraseMigratedKey);
      logger.debug(`[loadAndMigrate] - Migration pending? ${!isSeedPhraseMigrated}`, {}, DebugContext.wallet);

      // We need to migrate the seedphrase & private key first
      // In that case we regenerate the existing private key to store it with the new format
      if (!isSeedPhraseMigrated) {
        const migratedSecrets = await migrateSecrets();
        seedPhrase = migratedSecrets?.seedphrase ?? null;
      } else {
        logger.error(new RainbowError('[loadAndMigrate] - Migrated flag was set but there is no key!'), { id });
      }
    } else {
      logger.debug('[loadAndMigrate] - Getting seed directly', {}, DebugContext.wallet);
      const androidEncryptionPin = IS_ANDROID && !(await kc.getSupportedBiometryType()) ? await authenticateWithPIN() : undefined;
      const seedData = await getSeedPhrase(id, { androidEncryptionPin });
      seedPhrase = seedData?.seedphrase ?? null;

      if (seedPhrase) {
        logger.debug('[loadAndMigrate] - got seed succesfully', {}, DebugContext.wallet);
      } else {
        logger.error(new RainbowError('[loadAndMigrate] - Missing seed for wallet - (Key exists but value isnt valid)!'));
      }
    }

    return seedPhrase;
  } catch (error) {
    logger.error(new RainbowError('[loadAndMigrate] - Error in loadSeedPhraseAndMigrateIfNeeded'), { error });
    throw error;
  }
};
