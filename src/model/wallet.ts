import { type TransactionRequest } from '@ethersproject/abstract-provider';
import { type Signer } from '@ethersproject/abstract-signer';
import { arrayify } from '@ethersproject/bytes';
import { type Provider, type StaticJsonRpcProvider } from '@ethersproject/providers';
import { type Transaction } from '@ethersproject/transactions';
import { Wallet } from '@ethersproject/wallet';
import { signTypedData, type SignTypedDataVersion, type TypedMessage } from '@metamask/eth-sig-util';
import { generateMnemonic } from 'bip39';
import { toBuffer, toChecksumAddress } from 'ethereumjs-util';
import type LibWallet from 'ethereumjs-wallet';
import { findKey, isEmpty } from 'lodash';

import { analytics } from '@/analytics';
import type { EthereumAddress } from '@/entities/wallet';
import { setHardwareWalletTxError } from '@/features/hardware-wallet/state/hardwareWalletTxState';
import type { LedgerSigner } from '@/features/hardware-wallet/utils/LedgerSigner';
import * as kc from '@/features/local-auth/keychain';
import { oldSeedPhraseMigratedKey, seedPhraseKey } from '@/features/local-auth/keychainConstants';
import * as keychain from '@/features/local-auth/legacyKeychain';
import {
  type EthereumWallet,
  type EthereumWalletFromSeed,
  type EthereumWalletSeed,
  type ReadOnlyWallet,
} from '@/features/wallet/core/walletDerivation';
import { type WalletLibraryType } from '@/features/wallet/core/walletLibrary';
import { hasPreviousTransactions } from '@/features/wallet/data/hasPreviousTransactions';
import { initializeWalletProfilePreference } from '@/features/wallet/data/initializeWalletProfilePreference';
import { loadWallet } from '@/features/wallet/data/loadWallet';
import {
  getAllWallets,
  getSeedPhrase,
  loadAddress,
  migrateWalletSecrets,
  saveAddress,
  saveAllWallets,
  saveKeyForWallet,
  saveSeedPhrase,
  setSelectedWallet,
} from '@/features/wallet/data/walletKeychain';
import {
  DEFAULT_WALLET_NAME,
  EncryptionType,
  type AllRainbowWallets,
  type RainbowAccount,
  type RainbowWallet,
} from '@/features/wallet/types';
import { addHexPrefix, isHexString } from '@/handlers/web3';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { createSignature } from '@/helpers/signingWallet';
import walletTypes, { EthereumWalletType } from '@/helpers/walletTypes';
import * as i18n from '@/languages';
import { ensureError, logger, RainbowError } from '@/logger';
import { DebugContext } from '@/logger/debugContext';
import { WalletNotificationRelationship } from '@/notifications/settings/constants';
import { initializeNotificationSettingsForAddresses } from '@/notifications/settings/initialization';
import type { AddressWithRelationship } from '@/notifications/settings/types';
import { getIsDamagedWallet, setWalletDamaged } from '@/state/wallets/walletsStore';
import { sanitizeTypedData } from '@/utils/signingUtils';
import { deriveAccountFromBluetoothHardwareWallet, deriveAccountFromMnemonic, deriveAccountFromWalletInput } from '@/utils/wallet';

import { addressHashedColorIndex } from '../utils/profileUtils';

interface WalletInitialized {
  isNew: boolean;
  walletAddress?: EthereumAddress;
}

interface TransactionRequestParam {
  transaction: TransactionRequest;
  existingWallet?: Signer;
  provider: StaticJsonRpcProvider;
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

function isLibWallet(wallet: EthereumWallet): wallet is LibWallet {
  return 'getPrivateKey' in wallet && typeof wallet.getPrivateKey === 'function';
}

export type InitializeWalletParams = CreateWalletParams & {
  network?: string;
  seedPhrase?: string;
  shouldCreateFirstWallet?: boolean;
  shouldRunMigrations?: boolean;
  switching?: boolean;
};

export const walletInit = async (props: InitializeWalletParams): Promise<WalletInitialized> => {
  const {
    seedPhrase,
    color = null,
    name = null,
    overwrite = false,
    checkedWallet = null,
    network,
    image = null,
    // Import the wallet "silently" in the background (i.e. no "loading" prompts).
    silent = false,
    userPin,
  } = props;

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
      userPin,
    });
    if (!wallet) throw new RainbowError('Error creating wallet');
    walletAddress = wallet.address;
    return { isNew, walletAddress };
  }

  walletAddress = await loadAddress();

  if (!walletAddress) {
    const wallet = await createWallet();
    if (!wallet) throw new RainbowError('Error creating wallet address');

    walletAddress = wallet.address;
    isNew = true;
  }

  return { isNew, walletAddress };
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
    logger.debug('[wallet]: sending transaction', { transaction }, DebugContext.wallet);
    const wallet =
      existingWallet ||
      (await loadWallet({
        provider,
      }));
    // have to check inverse or we trigger unwanted BT permissions requests
    if (!(wallet instanceof Wallet)) {
      isHardwareWallet = true;
    }
    if (!wallet) return null;
    try {
      const result = await wallet.sendTransaction(transaction);
      logger.debug(`[wallet]: send - tx result`, { result }, DebugContext.wallet);
      return { result };
    } catch (error) {
      logger.error(new RainbowError(`[wallet]: Failed to send transaction`), { error });
      if (isHardwareWallet) {
        setHardwareWalletTxError(true);
      } else {
        Alert.alert(i18n.t(i18n.l.wallet.transaction.alert.failed_transaction));
      }

      return { error };
    }
  } catch (error) {
    if (isHardwareWallet) {
      setHardwareWalletTxError(true);
    } else {
      Alert.alert(i18n.t(i18n.l.wallet.transaction.alert.failed_transaction));
    }
    logger.error(new RainbowError(`[wallet]: Failed to send transaction due to auth`), {
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
    logger.debug('[wallet]: signing transaction', {}, DebugContext.wallet);
    const wallet =
      existingWallet ||
      (await loadWallet({
        provider,
      }));
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
        setHardwareWalletTxError(true);
      } else {
        Alert.alert(i18n.t(i18n.l.wallet.transaction.alert.failed_transaction));
      }
      logger.error(new RainbowError(`[wallet]: Failed to sign transaction`), { error });
      return { error };
    }
  } catch (error) {
    if (isHardwareWallet) {
      setHardwareWalletTxError(true);
    } else {
      Alert.alert(i18n.t(i18n.l.wallet.transaction.alert.authentication));
    }
    logger.error(new RainbowError(`[wallet]: Failed to sign transaction due to auth`), {
      error,
    });
    return null;
  }
};

export const signPersonalMessage = async (
  message: string | Uint8Array,
  provider: Provider,
  existingWallet?: Signer
): Promise<null | {
  result?: string;
  error?: any;
}> => {
  let isHardwareWallet = false;
  try {
    logger.debug('[wallet]: signing personal message', { message }, DebugContext.wallet);
    const wallet =
      existingWallet ||
      (await loadWallet({
        provider,
      }));
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
        setHardwareWalletTxError(true);
      } else {
        Alert.alert(i18n.t(i18n.l.wallet.transaction.alert.failed_sign_message));
      }
      logger.error(new RainbowError(`[wallet]: Failed to sign personal message`), {
        error,
      });
      return { error };
    }
  } catch (error) {
    if (isHardwareWallet) {
      setHardwareWalletTxError(true);
    } else {
      Alert.alert(i18n.t(i18n.l.wallet.transaction.alert.authentication));
    }
    logger.error(new RainbowError(`[wallet]: Failed to sign personal message due to auth`), { error });
    return null;
  }
};

export const signTypedDataMessage = async (
  message: string | TypedData,
  provider: Provider,
  existingWallet?: Signer
): Promise<null | {
  result?: string;
  error?: any;
}> => {
  let isHardwareWallet = false;
  try {
    logger.debug('[wallet]: signing typed data message', { message }, DebugContext.wallet);
    const wallet =
      existingWallet ||
      (await loadWallet({
        provider,
      }));
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
        setHardwareWalletTxError(true);
      } else {
        Alert.alert(i18n.t(i18n.l.wallet.transaction.alert.failed_sign_message));
      }
      logger.error(new RainbowError(`[wallet]: Failed to sign typed data message`), {
        error,
      });
      return { error };
    }
  } catch (error) {
    if (isHardwareWallet) {
      setHardwareWalletTxError(true);
    } else {
      Alert.alert(i18n.t(i18n.l.wallet.transaction.alert.authentication));
    }
    logger.error(new RainbowError(`[wallet]: Failed to sign typed data message due to auth`), { error });
    return null;
  }
};

type CreateWalletParams = {
  seed?: null | EthereumWalletSeed;
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
}: CreateWalletParams = {}): Promise<Wallet | ReadOnlyWallet | null> => {
  if (clearCallbackOnStartCreation) {
    callbackAfterSeeds?.();
    callbackAfterSeeds = null;
  }
  const isImported = !!seed;
  logger.debug(`[wallet]: ${isImported ? 'Importing new wallet' : 'Creating new wallet'}`, {}, DebugContext.wallet);
  const walletSeed = seed || generateMnemonic();
  const addresses: RainbowAccount[] = [];
  const baseAnalyticsParams = {
    isImported,
    isRestoring,
    overwrite,
    silent,
    hasCheckedWallet: !!checkedWallet,
  };
  let analyticsParams:
    | (typeof baseAnalyticsParams & {
        ethereumWalletType: EthereumWalletType;
        walletLibraryType: WalletLibraryType;
        isReadOnly: boolean;
        isHardwareWallet: boolean;
        isHDWallet: boolean;
      })
    | undefined;
  try {
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
    analyticsParams = {
      ...baseAnalyticsParams,
      ethereumWalletType: type,
      walletLibraryType: walletType,
      isReadOnly: isReadOnlyType,
      isHardwareWallet,
      isHDWallet,
    };
    let pkey = walletSeed;
    if (!walletResult || !address) {
      if (analyticsParams) {
        analytics.track(analytics.event.walletCreateFailed, {
          ...analyticsParams,
          error: 'wallet_or_address_missing',
        });
      }
      return null;
    }
    const walletAddress = address;
    if (isHDWallet) {
      if (!isLibWallet(walletResult)) throw new Error('[wallet]: Expected an HD wallet');
      pkey = addHexPrefix(walletResult.getPrivateKey().toString('hex'));
    } else if (isHardwareWallet) {
      // hardware pkey format is ${bluetooth device id}/${index}
      pkey = `${seed}/0`;
    }
    logger.debug('[wallet]: getWallet from seed', {}, DebugContext.wallet);

    // Get all wallets
    const allWalletsResult = await getAllWallets();
    logger.debug('[wallet]: getAllWallets', {}, DebugContext.wallet);
    const allWallets: AllRainbowWallets = allWalletsResult?.wallets ?? {};

    let existingWalletId = null;
    if (isImported) {
      // Checking if the generated account already exists and is visible
      logger.debug('[wallet]: checking if account already exists', {}, DebugContext.wallet);
      const alreadyExistingWallet = Object.values(allWallets).find((someWallet: RainbowWallet) => {
        return !!someWallet.addresses?.find(
          account => toChecksumAddress(account.address) === toChecksumAddress(walletAddress) && account.visible
        );
      });

      existingWalletId = alreadyExistingWallet?.id;

      // Don't allow adding a readOnly wallet that you have already visible
      // or a private key that you already have visible as a seed or mnemonic.
      // Exception: allow overwriting if the existing wallet is damaged (keychain data lost) so users can repair it.
      // Note: damaged status is read from the walletsStore since getAllWallets() reads from keychain where it's not persisted.
      const isPrivateKeyOverwritingSeedMnemonic =
        type === EthereumWalletType.privateKey &&
        (alreadyExistingWallet?.type === EthereumWalletType.seed || alreadyExistingWallet?.type === EthereumWalletType.mnemonic);
      const isExistingWalletDamaged = alreadyExistingWallet ? getIsDamagedWallet(alreadyExistingWallet.id) : false;
      if (!overwrite && alreadyExistingWallet && !isExistingWalletDamaged && (isReadOnlyType || isPrivateKeyOverwritingSeedMnemonic)) {
        if (!isRestoring) {
          logger.debug('[wallet]: already imported this wallet', {}, DebugContext.wallet);
          const error = new Error(i18n.t(i18n.l.wallet.new.alert.looks_like_already_imported));
          error.name = 'WalletAlreadyExistsError';
          if (analyticsParams) {
            analytics.track(analytics.event.walletCreateFailed, {
              ...analyticsParams,
              error: 'wallet_already_exists',
            });
          }
          throw error;
        }
        if (analyticsParams) {
          analytics.track(analytics.event.walletCreateFailed, {
            ...analyticsParams,
            error: 'wallet_already_exists_restoring',
          });
        }
        return null;
      }
    }

    const id = existingWalletId || `wallet_${Date.now()}`;
    logger.debug('[wallet]: wallet ID', { id }, DebugContext.wallet);

    // load this up front and pass to other keychain setters to avoid multiple
    // auth requests
    const androidEncryptionPin = await kc.maybeAuthenticateWithPINAndCreateIfNeeded(userPin);

    await saveSeedPhrase(walletSeed, id, { androidEncryptionPin });

    logger.debug('[wallet]: saved seed phrase', {}, DebugContext.wallet);

    // Save address
    await saveAddress(walletAddress);
    logger.debug('[wallet]: saved address', {}, DebugContext.wallet);

    // Save private key
    await saveKeyForWallet(walletAddress, pkey, isHardwareWallet, {
      androidEncryptionPin,
    });
    logger.debug('[wallet]: saved private key', {}, DebugContext.wallet);

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
      logger.debug(`[wallet]: generating signature`, {}, DebugContext.wallet);
      await createSignature(walletAddress, pkey);
      // Save the color
      initializeWalletProfilePreference(address, colorIndexForWallet);
    }

    // Initiate auto account discovery for imported wallets via seedphrase
    // or for hardware wallets
    if ((isHDWallet && root && isImported) || (isHardwareWallet && seed)) {
      logger.debug('[wallet]: initializing account auto discovery', {}, DebugContext.wallet);
      let index = 1;
      let lookup = 0;
      // Starting on index 1, we check the tx history
      // for each account. If there's history we add it to the wallet.
      // We stop once we 2 accounts with no history
      while (lookup < 2) {
        let nextWallet: { address: EthereumAddress; privateKey: string | null } | null = null;
        if (isHardwareWallet) {
          const walletObj = await deriveAccountFromBluetoothHardwareWallet(seed, index);
          if (!walletObj.wallet) {
            throw new Error(`No wallet (unreachable)`);
          }
          if (isLibWallet(walletObj.wallet)) throw new Error('[wallet]: Expected a hardware wallet account');
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

        if (!nextWallet) throw new Error('[wallet]: Failed to derive an account');

        let hasTxHistory = false;
        try {
          hasTxHistory = await hasPreviousTransactions(nextWallet.address);
        } catch (error) {
          logger.error(new RainbowError('[wallet]: Error getting txn history for address'), { error });
        }

        let discoveredAccount: RainbowAccount | undefined;
        let discoveredWalletId: RainbowWallet['id'] | undefined;

        Object.values(allWallets).forEach(someWallet => {
          const existingAccount = someWallet.addresses?.find(
            account => toChecksumAddress(account.address) === toChecksumAddress(nextWallet.address)
          );
          if (existingAccount) {
            discoveredAccount = existingAccount;
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
          logger.debug(`[wallet]: saved private key for wallet index: ${index}`, {}, DebugContext.wallet);

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
            logger.debug(`[wallet]: enabling web profile`, {}, DebugContext.wallet);
            await createSignature(nextWallet.address, nextWallet.privateKey);
            // Save the color
            initializeWalletProfilePreference(nextWallet.address, colorIndexForWallet);
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
    } else if (!isImported && type === EthereumWalletType.mnemonic) {
      // For new wallet groups (mnemonics), generate "Wallet Group X" name
      const mnemonicWalletCount = Object.values(allWallets).filter(w => w.type === EthereumWalletType.mnemonic).length;
      walletName = `Wallet Group ${mnemonicWalletCount + 1}`;
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
      encryptionType:
        type === EthereumWalletType.readOnly || type === EthereumWalletType.bluetooth
          ? EncryptionType.none
          : androidEncryptionPin
            ? EncryptionType.rainbowPin
            : EncryptionType.keychain,
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
      logger.debug('[wallet]: setting selected wallet', {}, DebugContext.wallet);
      await setSelectedWallet(allWallets[id]);
    }

    logger.debug('[wallet]: saving all wallets', {}, DebugContext.wallet);
    await saveAllWallets(allWallets);

    logger.debug('[wallet]: setting wallet damaged status to false', {}, DebugContext.wallet);
    setWalletDamaged(id, false);

    if (walletResult && walletAddress) {
      if (analyticsParams) {
        analytics.track(analytics.event.walletCreateSucceeded, analyticsParams);
      }
      return isLibWallet(walletResult) ? new Wallet(pkey) : walletResult;
    }
    return null;
  } catch (e) {
    const error = ensureError(e);
    if (error.name !== 'WalletAlreadyExistsError' && analyticsParams) {
      analytics.track(analytics.event.walletCreateFailed, {
        ...analyticsParams,
        error: error.message,
      });
    }
    if (error.name === 'WalletAlreadyExistsError') {
      throw error;
    }
    logger.error(new RainbowError('[wallet]: Error in createWallet'), { error });
    return null;
  }
};

let callbackAfterSeeds: null | (() => void) = null;

export function setCallbackAfterObtainingSeedsFromKeychainOrError(callback: () => void) {
  callbackAfterSeeds = callback;
}

/** Derives and stores an indexed account for an existing wallet. */
export async function generateAccount(id: RainbowWallet['id'], index: number): Promise<Wallet | null> {
  try {
    const isSeedPhraseMigrated = await keychain.loadString(oldSeedPhraseMigratedKey);
    let seedphrase;
    // We need to migrate the seedphrase & private key first
    // In that case we regenerate the existing private key to store it with the new format
    if (!isSeedPhraseMigrated) {
      const migratedSecrets = await migrateWalletSecrets();
      seedphrase = migratedSecrets?.seedphrase;
    }

    // load this up front and pass to other keychain setters to avoid multiple
    // auth requests
    const androidEncryptionPin = await kc.maybeAuthenticateWithPIN();

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
    logger.error(new RainbowError('[wallet]: Error generating account for keychain'), { error });
    return null;
  }
}

export const loadSeedPhraseAndMigrateIfNeeded = async (id: RainbowWallet['id']): Promise<null | EthereumWalletSeed> => {
  try {
    let seedPhrase = null;
    // First we need to check if that key already exists
    // If the wallet is damaged, assume it is already migrated, since we can't check if it was.
    const keyFound = getIsDamagedWallet(id) ? true : await keychain.hasKey(`${id}_${seedPhraseKey}`);

    if (!keyFound) {
      logger.debug('[wallet]: key not found, should need migration', {}, DebugContext.wallet);
      // if it doesn't we might have a migration pending
      const isSeedPhraseMigrated = await keychain.loadString(oldSeedPhraseMigratedKey);
      logger.debug(`[wallet]: Migration pending? ${!isSeedPhraseMigrated}`, {}, DebugContext.wallet);

      // We need to migrate the seedphrase & private key first
      // In that case we regenerate the existing private key to store it with the new format
      if (!isSeedPhraseMigrated) {
        const migratedSecrets = await migrateWalletSecrets();
        seedPhrase = migratedSecrets?.seedphrase ?? null;
      } else {
        logger.error(new RainbowError('[wallet]: Migrated flag was set but there is no key!'), { id });
      }
    } else {
      logger.debug('[wallet]: Getting seed directly', {}, DebugContext.wallet);
      const androidEncryptionPin = await kc.maybeAuthenticateWithPIN();
      const seedData = await getSeedPhrase(id, { androidEncryptionPin });
      seedPhrase = seedData?.seedphrase ?? null;

      if (seedPhrase) {
        logger.debug('[wallet]: got seed succesfully', {}, DebugContext.wallet);
      } else {
        logger.error(new RainbowError('[wallet]: Missing seed for wallet - (Key exists but value isnt valid)!'));
      }
    }

    return seedPhrase;
  } catch (error) {
    logger.error(new RainbowError('[wallet]: Error in loadSeedPhraseAndMigrateIfNeeded'), { error });
    throw error;
  }
};
