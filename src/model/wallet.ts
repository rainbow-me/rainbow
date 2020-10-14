import { TransactionRequest } from '@ethersproject/abstract-provider';
import {
  arrayify,
  BytesLike,
  Hexable,
  joinSignature,
} from '@ethersproject/bytes';
import { entropyToMnemonic, HDNode } from '@ethersproject/hdnode';
import { randomBytes } from '@ethersproject/random';
import { SigningKey } from '@ethersproject/signing-key';
import { Transaction } from '@ethersproject/transactions';
import { Wallet } from '@ethersproject/wallet';
import { captureException, captureMessage } from '@sentry/react-native';
import { signTypedData_v4, signTypedDataLegacy } from 'eth-sig-util';
import { isValidAddress, toBuffer } from 'ethereumjs-util';
import lang from 'i18n-js';
import { find, findKey, forEach, get, isEmpty } from 'lodash';
import { Alert } from 'react-native';
import { ACCESSIBLE } from 'react-native-keychain';
import { saveAccountEmptyState } from '../handlers/localstorage/accountLocal';
import {
  addHexPrefix,
  isHexString,
  isHexStringIgnorePrefix,
  isValidMnemonic,
  toChecksumAddress,
  web3Provider,
} from '../handlers/web3';
import showWalletErrorAlert from '../helpers/support';
import { EthereumWalletType } from '../helpers/walletTypes';
import { ethereumUtils } from '../utils';
import {
  addressKey,
  allWalletsKey,
  oldSeedPhraseMigratedKey,
  privateKeyKey,
  seedPhraseKey,
  selectedWalletKey,
} from '../utils/keychainConstants';
import * as keychain from './keychain';
import { colors } from '@rainbow-me/styles';
import logger from 'logger';

type EthereumAddress = string;
type EthereumPrivateKey = string;
type EthereumMnemonic = string;
type EthereumSeed = string;
type EthereumWalletSeed =
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
}

type EthereumWallet = Wallet | ReadOnlyWallet;

interface RainbowAccount {
  index: number;
  label: string;
  address: EthereumAddress;
  avatar: null | string;
  color: number;
  visible: boolean;
}

export interface RainbowWallet {
  addresses: RainbowAccount[];
  color: number;
  id: string;
  imported: boolean;
  name: string;
  primary: boolean;
  type: EthereumWalletType;
  backedUp: boolean;
  backupFile?: string;
  backupDate?: string;
  backupType?: string;
}

export interface AllRainbowWallets {
  [key: string]: RainbowWallet;
}

interface AllRainbowWalletsData {
  allWallets: AllRainbowWallets;
  version: string;
}

interface RainbowSelectedWalletData {
  wallet: RainbowWallet;
}

interface PrivateKeyData {
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

const privateKeyVersion = 1.0;
const seedPhraseVersion = 1.0;
const selectedWalletVersion = 1.0;
export const allWalletsVersion = 1.0;

const DEFAULT_HD_PATH = `m/44'/60'/0'/0`;
export const DEFAULT_WALLET_NAME = 'My Wallet';

const authenticationPrompt = lang.t('wallet.authenticate.please');
export const publicAccessControlOptions = {
  accessible: ACCESSIBLE.ALWAYS_THIS_DEVICE_ONLY,
};

export function generateSeedPhrase(): EthereumMnemonic {
  logger.sentry('Generating a new seed phrase');
  return entropyToMnemonic(randomBytes(16));
}

export const walletInit = async (
  seedPhrase = null,
  color = null,
  name = null,
  overwrite = false,
  checkedWallet = null,
  network: string
): Promise<WalletInitialized> => {
  let walletAddress = null;
  let isNew = false;
  // Importing a seedphrase
  if (!isEmpty(seedPhrase)) {
    const wallet = await createWallet(
      seedPhrase,
      color,
      name,
      overwrite,
      checkedWallet
    );
    walletAddress = wallet?.address;
    return { isNew, walletAddress };
  }

  walletAddress = await loadAddress();

  if (!walletAddress) {
    const wallet = await createWallet();
    walletAddress = wallet?.address;
    isNew = true;
    await saveAccountEmptyState(true, walletAddress?.toLowerCase(), network);
  }
  return { isNew, walletAddress };
};

export const loadWallet = async (): Promise<null | Wallet> => {
  const privateKey = await loadPrivateKey();
  if (privateKey === -1) {
    return null;
  }
  if (privateKey) {
    return new Wallet(privateKey, web3Provider);
  }
  showWalletErrorAlert();
  return null;
};

export const sendTransaction = async ({
  transaction,
}: TransactionRequestParam): Promise<null | Transaction['hash']> => {
  try {
    logger.sentry('about to send transaction', transaction);
    const wallet = await loadWallet();
    if (!wallet) return null;
    try {
      const result = await wallet.sendTransaction(transaction);
      return result.hash;
    } catch (error) {
      Alert.alert(lang.t('wallet.transaction.alert.failed_transaction'));
      logger.sentry('Failed to SEND transaction, alerted user');
      captureException(error);
      return null;
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
}: TransactionRequestParam): Promise<null | string> => {
  try {
    logger.sentry('about to sign transaction', transaction);
    const wallet = await loadWallet();
    if (!wallet) return null;
    try {
      return wallet.signTransaction(transaction);
    } catch (error) {
      Alert.alert(lang.t('wallet.transaction.alert.failed_transaction'));
      logger.sentry('Failed to SIGN transaction, alerted user');
      captureException(error);
      return null;
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
  message: BytesLike | Hexable | number
): Promise<null | string> => {
  try {
    logger.sentry('about to sign message', message);
    const wallet = await loadWallet();
    try {
      if (!wallet) return null;
      const signingKey = new SigningKey(wallet.privateKey);
      const sigParams = await signingKey.signDigest(arrayify(message));
      return joinSignature(sigParams);
    } catch (error) {
      Alert.alert(lang.t('wallet.transaction.alert.failed_sign_message'));
      logger.sentry('Failed to SIGN message, alerted user');
      captureException(error);
      return null;
    }
  } catch (error) {
    Alert.alert(lang.t('wallet.transaction.alert.authentication'));
    logger.sentry('Failed to SIGN message due to authentication, alerted user');
    captureException(error);
    return null;
  }
};

export const signPersonalMessage = async (
  message: string | Uint8Array
): Promise<null | string> => {
  try {
    logger.sentry('about to sign personal message', message);
    const wallet = await loadWallet();
    try {
      if (!wallet) return null;
      return wallet.signMessage(
        typeof message === 'string' && isHexString(message)
          ? arrayify(message)
          : message
      );
    } catch (error) {
      Alert.alert(lang.t('wallet.transaction.alert.failed_sign_message'));
      logger.sentry('Failed to SIGN personal message, alerted user');
      captureException(error);
      return null;
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
  message: string | TypedData
): Promise<null | string> => {
  try {
    logger.sentry('about to sign typed data  message', message);
    const wallet = await loadWallet();
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

      switch (version) {
        case 'v4':
          return signTypedData_v4(pkeyBuffer, {
            data: parsedData,
          });
        default:
          return signTypedDataLegacy(pkeyBuffer, { data: parsedData });
      }
    } catch (error) {
      Alert.alert(lang.t('wallet.transaction.alert.failed_sign_message'));
      logger.sentry('Failed to SIGN typed data message, alerted user');
      captureException(error);
      return null;
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

const loadPrivateKey = async (): Promise<null | EthereumPrivateKey | -1> => {
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
      const address = await loadAddress();
      if (!address) {
        return null;
      }
      const privateKeyData = await getPrivateKey(address);
      if (privateKeyData === -1) {
        return -1;
      }
      privateKey = get(privateKeyData, 'privateKey', null);
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
  accessControlOptions = publicAccessControlOptions
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

export const getWallet = (
  walletSeed: EthereumWalletSeed
): EthereumWalletFromSeed => {
  let wallet = null;
  let hdnode = null;
  let isHDWallet = false;
  const type = identifyWalletType(walletSeed);
  switch (type) {
    case EthereumWalletType.privateKey:
      wallet = new Wallet(walletSeed);
      break;
    case EthereumWalletType.mnemonic:
      hdnode = HDNode.fromMnemonic(walletSeed);
      isHDWallet = true;
      break;
    case EthereumWalletType.seed:
      hdnode = HDNode.fromSeed(walletSeed);
      isHDWallet = true;
      break;
    case EthereumWalletType.readOnly:
      wallet = { address: toChecksumAddress(walletSeed), privateKey: null };
      break;
    default:
  }

  // Always generate the first account if HD node
  if (isHDWallet && hdnode) {
    const node = hdnode.derivePath(`${DEFAULT_HD_PATH}/0`);
    wallet = new Wallet(node.privateKey);
  }

  return { hdnode, isHDWallet, type, wallet };
};

export const createWallet = async (
  seed: null | EthereumSeed = null,
  color: null | number = null,
  name: null | string = null,
  overwrite: boolean = false,
  checkedWallet: null | EthereumWalletFromSeed = null
): Promise<null | EthereumWallet> => {
  const isImported = !!seed;
  logger.sentry('Creating wallet, isImported?', isImported);
  const walletSeed = seed || generateSeedPhrase();
  let addresses: RainbowAccount[] = [];
  try {
    const { hdnode, isHDWallet, type, wallet } =
      checkedWallet || getWallet(walletSeed);
    if (!wallet) return null;
    logger.sentry('[createWallet] - getWallet from seed');

    // Get all wallets
    const allWalletsResult = await getAllWallets();
    logger.sentry('[createWallet] - getAllWallets');
    const allWallets: AllRainbowWallets = get(allWalletsResult, 'wallets', {});

    let existingWalletId = null;
    if (isImported) {
      // Checking if the generated account already exists and is visible
      logger.sentry('[createWallet] - isImported >> true');
      const alreadyExistingWallet = find(
        allWallets,
        (someWallet: RainbowWallet) => {
          return !!find(
            someWallet.addresses,
            account =>
              toChecksumAddress(account.address) ===
                toChecksumAddress(wallet.address) && account.visible
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
        (type === EthereumWalletType.readOnly ||
          isPrivateKeyOverwritingSeedMnemonic)
      ) {
        setTimeout(
          () =>
            Alert.alert(
              'Oops!',
              'Looks like you already imported this wallet!'
            ),
          1
        );
        logger.sentry('[createWallet] - already imported this wallet');
        return null;
      }
    }

    const id = existingWalletId || `wallet_${Date.now()}`;
    logger.sentry('[createWallet] - wallet ID', { id });

    // Save seed - save this first
    await saveSeedPhrase(walletSeed, id);
    logger.sentry('[createWallet] - saved seed phrase');

    // Save address
    await saveAddress(wallet.address);
    logger.sentry('[createWallet] - saved address');

    // Save private key
    await savePrivateKey(wallet.address, wallet.privateKey);
    logger.sentry('[createWallet] - saved private key');

    addresses.push({
      address: wallet.address,
      avatar: null,
      color: color !== null ? color : colors.getRandomColor(),
      index: 0,
      label: name || '',
      visible: true,
    });

    if (isHDWallet && hdnode && isImported) {
      logger.sentry('[createWallet] - isHDWallet && isImported');
      let index = 1;
      let lookup = true;
      // Starting on index 1, we are gonna hit etherscan API and check the tx history
      // for each account. If there's history we add it to the wallet.
      //(We stop once we find the first one with no history)
      while (lookup) {
        const node = hdnode.derivePath(`${DEFAULT_HD_PATH}/${index}`);
        const nextWallet = new Wallet(node.privateKey);
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
        forEach(allWallets, someWallet => {
          const existingAccount = find(
            someWallet.addresses,
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
        let color = colors.getRandomColor();
        let label = '';

        if (discoveredAccount && discoveredWalletId) {
          if (discoveredAccount.visible) {
            color = discoveredAccount.color;
            label = discoveredAccount.label ?? '';
          }
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete allWallets[discoveredWalletId];
        }

        if (hasTxHistory) {
          // Save private key
          await savePrivateKey(nextWallet.address, nextWallet.privateKey);
          logger.sentry(
            `[createWallet] - saved private key for next wallet ${index}`
          );
          addresses.push({
            address: nextWallet.address,
            avatar: null,
            color,
            index,
            label,
            visible: true,
          });
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

    await setSelectedWallet(allWallets[id]);
    logger.sentry('[createWallet] - setSelectedWallet');

    await saveAllWallets(allWallets);
    logger.sentry('[createWallet] - saveAllWallets');

    if (wallet) {
      return wallet;
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
    })) as PrivateKeyData;
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
    })) as SeedPhraseData;
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
    publicAccessControlOptions
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

  await keychain.saveObject(allWalletsKey, val, publicAccessControlOptions);
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

export const generateAccount = async (
  id: RainbowWallet['id'],
  index: number
): Promise<null | EthereumWallet> => {
  try {
    const isSeedPhraseMigrated = await keychain.loadString(
      oldSeedPhraseMigratedKey
    );
    let seedphrase, hdnode;
    // We need to migrate the seedphrase & private key first
    // In that case we regenerate the existing private key to store it with the new format
    if (!isSeedPhraseMigrated) {
      const migratedSecrets = await migrateSecrets();
      hdnode = migratedSecrets?.hdnode;
      seedphrase = migratedSecrets?.seedphrase;
    }

    if (!seedphrase) {
      const seedData = await getSeedPhrase(id);
      seedphrase = seedData?.seedphrase;
      if (seedphrase) {
        hdnode = HDNode.fromMnemonic(seedphrase);
      }
    }

    if (!seedphrase) {
      throw new Error(`Can't access seed phrase to create new accounts`);
    }

    if (!hdnode) {
      return null;
    }

    const node = hdnode.derivePath(`${DEFAULT_HD_PATH}/${index}`);
    const newAccount = new Wallet(node.privateKey);
    await savePrivateKey(newAccount.address, newAccount.privateKey);
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
        publicAccessControlOptions
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
        existingAccount = new Wallet(seedphrase);
        break;
      case EthereumWalletType.mnemonic:
        hdnode = HDNode.fromMnemonic(seedphrase);
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
    let wallet: undefined | RainbowWallet = selectedWalletData?.wallet;
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
      publicAccessControlOptions
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
        seedPhrase = get(migratedSecrets, 'seedphrase', null);
      } else {
        logger.sentry('Migrated flag was set but there is no key!', id);
        captureMessage('Missing seed for wallet');
      }
    } else {
      logger.sentry('Getting seed directly');
      const seedData = await getSeedPhrase(id);
      seedPhrase = get(seedData, 'seedphrase', null);
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
    return null;
  }
};
