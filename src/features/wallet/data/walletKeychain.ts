import { HDNode, isValidMnemonic } from '@ethersproject/hdnode';
import { Wallet } from '@ethersproject/wallet';
import { toChecksumAddress } from 'ethereumjs-util';
import { type GetOptions, type SetOptions } from 'react-native-keychain';

import { type EthereumAddress } from '@/entities/wallet';
import * as kc from '@/features/local-auth/keychain';
import {
  addressKey,
  allWalletsKey,
  oldSeedPhraseMigratedKey,
  pinKey,
  privateKeyKey,
  seedPhraseKey,
  selectedWalletKey,
} from '@/features/local-auth/keychainConstants';
import * as keychain from '@/features/local-auth/legacyKeychain';
import { useIsSolanaEnabled } from '@/features/solana/hooks/useIsSolanaEnabled';
import { validateAccountKeyRecord, validateWalletAddress } from '@/features/wallet/core/accountKeyRecord';
import { isHardwareWalletKey, type HardwareKey } from '@/features/wallet/core/hardwareWalletKey';
import { identifyWalletType, type EthereumPrivateKey, type EthereumWalletSeed } from '@/features/wallet/core/walletDerivation';
import { getHdPath, WalletLibraryType } from '@/features/wallet/core/walletLibrary';
import { CHECKS_WALLET_KEY_EXISTENCE } from '@/features/wallet/data/walletKeychainIntegrity';
import {
  EncryptionType,
  type AccountPrivateKeyData,
  type AllRainbowWallets,
  type AllRainbowWalletsData,
  type Bip39Mnemonic,
  type MigratedSecretsResult,
  type MnemonicData,
  type PrivateKeyData,
  type RainbowSelectedWalletData,
  type RainbowWallet,
  type SeedPhraseData,
  type WalletAccessResult,
  type WalletAccountMaterial,
  type WalletAddress,
} from '@/features/wallet/types';
import { addHexPrefix } from '@/handlers/web3';
import { EthereumWalletType } from '@/helpers/walletTypes';
import * as i18n from '@/languages';
import { ensureError, logger, RainbowError } from '@/logger';
import { DebugContext } from '@/logger/debugContext';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { deriveAccountFromMnemonic } from '@/utils/wallet';

const PRIVATE_KEY_VERSION = 1;
const SEED_PHRASE_VERSION = 1;
const SELECTED_WALLET_VERSION = 1;
export const ALL_WALLETS_VERSION = 1;

const authenticationPrompt = {
  get title(): string {
    return i18n.t(i18n.l.wallet.authenticate.please);
  },
};

export type WalletKeychainAuth = Pick<kc.PrivateKeychainAuth, 'androidEncryptionPin'>;

async function readSourceWallet(walletId: string): Promise<WalletAccessResult<RainbowWallet>> {
  const result = await kc.getObject<AllRainbowWalletsData>(allWalletsKey);
  if (result.error !== undefined) return { status: 'unavailable' };
  if (result.value?.version !== ALL_WALLETS_VERSION) return { status: 'invalid-record' };
  const wallet = result.value?.wallets?.[walletId];
  if (!wallet || wallet.id !== walletId) return { status: 'account-changed' };
  return { status: 'ok', value: wallet };
}

export async function readWalletMnemonic(walletId: string, auth: WalletKeychainAuth = {}): Promise<WalletAccessResult<MnemonicData>> {
  if (!useIsSolanaEnabled.getState()) return { status: 'disabled' };
  if (typeof walletId !== 'string' || !walletId || walletId.length > 256) return { status: 'invalid-record' };
  try {
    const source = await readSourceWallet(walletId);
    if (source.status !== 'ok') return source;
    if (source.value.type !== EthereumWalletType.mnemonic) return { status: 'unsupported-source' };
    const result = await kc.getPrivateString(`${walletId}_${seedPhraseKey}`, { ...auth, authenticationPrompt });
    if (result.status === 'missing-key' && (await kc.has(seedPhraseKey))) return { status: 'legacy-migration-required' };
    if (result.status !== 'ok') return result;
    let value: unknown;
    try {
      value = JSON.parse(result.value);
    } catch {
      return { status: 'invalid-record' };
    }
    if (
      !value ||
      typeof value !== 'object' ||
      !('id' in value) ||
      value.id !== walletId ||
      !('version' in value) ||
      value.version !== 1 ||
      !('seedphrase' in value) ||
      typeof value.seedphrase !== 'string' ||
      value.seedphrase.length > 1024 ||
      !isValidMnemonic(value.seedphrase)
    )
      return { status: 'invalid-record' };
    if (!useIsSolanaEnabled.getState()) return { status: 'disabled' };
    const current = await readSourceWallet(walletId);
    if (current.status !== 'ok') return current;
    if (current.value.type !== EthereumWalletType.mnemonic) return { status: 'account-changed' };
    if (!useIsSolanaEnabled.getState()) return { status: 'disabled' };
    return { status: 'ok', value: { id: walletId, version: 1, seedphrase: value.seedphrase as Bip39Mnemonic } };
  } catch {
    return { status: 'unavailable' };
  }
}

async function readStoredAccountKey(address: WalletAddress, auth: WalletKeychainAuth): Promise<WalletAccessResult<AccountPrivateKeyData>> {
  const identity = validateWalletAddress(address);
  if (identity.status !== 'ok') return identity;
  const key = `rainbow.account-key.v1/${identity.value.namespace}/${identity.value.address}`;
  const stored = await kc.getPrivateString(key, { ...auth, authenticationPrompt });
  if (stored.status !== 'ok') return stored;
  let value: unknown;
  try {
    value = JSON.parse(stored.value);
  } catch {
    return { status: 'invalid-record' };
  }
  const record = validateAccountKeyRecord(value);
  if (record.status !== 'ok') return record;
  if (record.value.address !== identity.value.address) return { status: 'address-mismatch' };
  return record;
}

// Serialize check-then-write and removal for each identity; never retain secret results.
const accountKeyMutations = new Map<string, Promise<void>>();

async function mutateAccountKey(key: string, operation: () => Promise<WalletAccessResult<void>>): Promise<WalletAccessResult<void>> {
  const previous = accountKeyMutations.get(key) ?? Promise.resolve();
  const result = previous.then(operation).catch((): WalletAccessResult<void> => ({ status: 'unavailable' }));
  const pending = result.then(() => undefined);
  accountKeyMutations.set(key, pending);
  try {
    return await result;
  } finally {
    if (accountKeyMutations.get(key) === pending) accountKeyMutations.delete(key);
  }
}

async function writeAccountKey(record: AccountPrivateKeyData, auth: WalletKeychainAuth): Promise<WalletAccessResult<void>> {
  if (!useIsSolanaEnabled.getState()) return { status: 'disabled' };
  const validated = validateAccountKeyRecord(record);
  if (validated.status !== 'ok') return validated;
  const value = validated.value;
  const identity = validateWalletAddress(value.address);
  if (identity.status !== 'ok') return identity;
  const key = `rainbow.account-key.v1/${identity.value.namespace}/${value.address}`;
  return mutateAccountKey(key, async () => {
    if (!useIsSolanaEnabled.getState()) return { status: 'disabled' };
    const existing = await readStoredAccountKey(value.address, auth);
    if (!useIsSolanaEnabled.getState()) return { status: 'disabled' };
    if (existing.status === 'ok') {
      return existing.value.privateKey === value.privateKey && existing.value.format === value.format
        ? { status: 'ok', value: undefined }
        : { status: 'invalid-record' };
    }
    if (existing.status !== 'missing-key') return existing;
    return kc.setPrivateString(key, JSON.stringify(value), { ...auth, authenticationPrompt });
  });
}

/** Removes only a new-format record; the caller must establish that no wallet still owns it. */
export async function removeAccountKey(address: WalletAddress): Promise<WalletAccessResult<void>> {
  if (!useIsSolanaEnabled.getState()) return { status: 'disabled' };
  const identity = validateWalletAddress(address);
  if (identity.status !== 'ok') return identity;
  const key = `rainbow.account-key.v1/${identity.value.namespace}/${identity.value.address}`;
  return mutateAccountKey(key, async () => {
    if (!useIsSolanaEnabled.getState()) return { status: 'disabled' };
    await kc.remove(key);
    return { status: 'ok', value: undefined };
  });
}

async function loadLegacySeedPhrase(): Promise<EthereumWalletSeed | kc.ErrorType.UserCanceled | kc.ErrorType.NotAuthenticated | null> {
  const seedPhrase = await keychain.loadString(seedPhraseKey, { authenticationPrompt });
  if (seedPhrase === kc.ErrorType.UserCanceled || seedPhrase === kc.ErrorType.NotAuthenticated) return seedPhrase;
  return typeof seedPhrase === 'string' ? seedPhrase : null;
}

export async function loadAddress(): Promise<EthereumAddress | null> {
  const address = await keychain.loadString(addressKey);
  return typeof address === 'string' ? address : null;
}

export async function saveAddress(
  address: EthereumAddress,
  accessControlOptions: kc.KeychainOptions<SetOptions> = keychain.publicAccessControlOptions
): Promise<void> {
  return keychain.saveString(addressKey, address, accessControlOptions);
}

export async function saveKeyForWallet(
  address: EthereumAddress,
  walletKey: EthereumPrivateKey | HardwareKey | null,
  hardware: boolean,
  { androidEncryptionPin }: Pick<kc.KeychainOptions<SetOptions>, 'androidEncryptionPin'> = {}
): Promise<void> {
  if (hardware) {
    if (walletKey !== null && !isHardwareWalletKey(walletKey)) {
      throw new Error('[wallet]: Invalid hardware wallet key');
    }
    return saveHardwareKey(address, walletKey);
  }
  return savePrivateKey(address, walletKey, { androidEncryptionPin });
}

export async function getKeyForWallet(
  address: EthereumAddress,
  hardware: boolean
): Promise<PrivateKeyData | null | kc.ErrorType.UserCanceled | kc.ErrorType.NotAuthenticated> {
  return hardware ? getHardwareKey(address) : getPrivateKey(address);
}

export async function savePrivateKey(
  address: WalletAddress,
  privateKey: WalletAccountMaterial,
  { androidEncryptionPin }: Pick<kc.KeychainOptions<SetOptions>, 'androidEncryptionPin'> = {}
): Promise<void> {
  const identity = validateWalletAddress(address);
  if (identity.status !== 'ok') throw new Error('[wallet]: Expected a raw wallet address');
  if (identity.value.namespace === 'solana') {
    if (typeof privateKey !== 'string') throw new Error('[wallet]: Expected a software private key');
    const result = await writeAccountKey({ address, privateKey, format: 'ed25519-seed-base64', version: 1 }, { androidEncryptionPin });
    if (result.status !== 'ok') throw new Error(`[wallet]: Unable to save private key (${result.status})`);
    return;
  }

  const privateAccessControlOptions = await keychain.getPrivateAccessControlOptions();
  const key = `${address}_${privateKeyKey}`;
  const value: PrivateKeyData = {
    address,
    privateKey,
    version: PRIVATE_KEY_VERSION,
  };

  await kc.setObject(key, value, {
    ...privateAccessControlOptions,
    androidEncryptionPin,
  });
}

export async function saveHardwareKey(address: EthereumAddress, privateKey: HardwareKey | null): Promise<void> {
  const key = `${address}_${privateKeyKey}`;
  const value: PrivateKeyData = {
    address,
    privateKey,
    version: PRIVATE_KEY_VERSION,
  };

  await kc.setObject(key, value, keychain.publicAccessControlOptions);
}

export async function getPrivateKey(
  address: WalletAddress,
  auth: WalletKeychainAuth = {}
): Promise<PrivateKeyData | null | kc.ErrorType.UserCanceled | kc.ErrorType.NotAuthenticated> {
  try {
    const identity = validateWalletAddress(address);
    if (identity.status !== 'ok') return null;
    if (identity.value.namespace === 'solana') {
      if (!useIsSolanaEnabled.getState()) return null;
      const result = await readStoredAccountKey(address, auth);
      if (!useIsSolanaEnabled.getState()) return null;
      if (result.status === 'ok') return result.value;
      if (result.status === 'cancelled') return kc.ErrorType.UserCanceled;
      if (result.status === 'not-authenticated') return kc.ErrorType.NotAuthenticated;
      return null;
    }

    const key = `${address}_${privateKeyKey}`;
    const androidEncryptionPin = auth.androidEncryptionPin ?? (await kc.maybeAuthenticateWithPIN());
    const { value: privateKeyData, error } = await kc.getObject<PrivateKeyData>(key, {
      authenticationPrompt,
      androidEncryptionPin,
    });

    switch (error) {
      case kc.ErrorType.UserCanceled:
      case kc.ErrorType.NotAuthenticated:
        return error;
      case kc.ErrorType.Unavailable: {
        const checksumAddress = toChecksumAddress(address);
        if (address !== checksumAddress) return getPrivateKey(checksumAddress, auth);
        logger.error(new RainbowError('KC unavailable for PKEY lookup'), { error });
        break;
      }
      default:
        if (error) logger.error(new RainbowError('KC unknown error for PKEY lookup'), { error });
    }

    return privateKeyData ?? null;
  } catch (error) {
    logger.error(new RainbowError('[wallet]: Error in getPrivateKey'), { error });
    return null;
  }
}

export async function getHardwareKey(address: EthereumAddress): Promise<PrivateKeyData | null> {
  try {
    const key = `${address}_${privateKeyKey}`;
    const { value } = await kc.getObject<PrivateKeyData>(key);
    return value ?? null;
  } catch (error) {
    logger.error(new RainbowError('[wallet]: Error in getHardwareKey'), { error });
    return null;
  }
}

export async function loadPrivateKey(
  address: EthereumAddress,
  hardware: boolean
): Promise<EthereumPrivateKey | null | kc.ErrorType.UserCanceled | kc.ErrorType.NotAuthenticated> {
  try {
    const isSeedPhraseMigrated = await keychain.loadString(oldSeedPhraseMigratedKey);
    let privateKey: EthereumPrivateKey | HardwareKey | null | undefined;

    if (!isSeedPhraseMigrated) {
      privateKey = (await migrateWalletSecrets())?.privateKey;
    }

    if (!privateKey) {
      const privateKeyData = await getKeyForWallet(address, hardware);
      if (privateKeyData === kc.ErrorType.UserCanceled || privateKeyData === kc.ErrorType.NotAuthenticated) return privateKeyData;
      privateKey = privateKeyData?.privateKey;
    }

    return privateKey ?? null;
  } catch (error) {
    logger.error(new RainbowError('[wallet]: Error loading private key'), { error });
    return null;
  }
}

export async function saveSeedPhrase(
  seedphrase: EthereumWalletSeed,
  keychainId: RainbowWallet['id'],
  { androidEncryptionPin }: Pick<kc.KeychainOptions<SetOptions>, 'androidEncryptionPin'> = {}
): Promise<void> {
  const privateAccessControlOptions = await keychain.getPrivateAccessControlOptions();
  const key = `${keychainId}_${seedPhraseKey}`;
  const value: SeedPhraseData = {
    id: keychainId,
    seedphrase,
    version: SEED_PHRASE_VERSION,
  };

  return kc.setObject(key, value, {
    ...privateAccessControlOptions,
    androidEncryptionPin,
  });
}

export async function getSeedPhrase(
  id: RainbowWallet['id'],
  { androidEncryptionPin }: Pick<kc.KeychainOptions<GetOptions>, 'androidEncryptionPin'> = {}
): Promise<SeedPhraseData | null> {
  try {
    const key = `${id}_${seedPhraseKey}`;
    const { value, error } = await kc.getObject<SeedPhraseData>(key, {
      authenticationPrompt,
      androidEncryptionPin,
    });

    if (error === kc.ErrorType.UserCanceled) return null;
    if (!value) {
      Navigation.handleAction(Routes.WALLET_ERROR_SHEET);
      return null;
    }
    return value;
  } catch (error) {
    logger.error(new RainbowError('[wallet]: Error in getSeedPhrase'), { error });
    return null;
  }
}

export async function setSelectedWallet(wallet: RainbowWallet): Promise<void> {
  const value: RainbowSelectedWalletData = {
    version: SELECTED_WALLET_VERSION,
    wallet,
  };
  return kc.setObject(selectedWalletKey, value, keychain.publicAccessControlOptions);
}

export async function resetSelectedWallet(): Promise<void> {
  return keychain.saveObject(selectedWalletKey, {}, keychain.publicAccessControlOptions);
}

export async function getSelectedWallet(): Promise<RainbowSelectedWalletData | null> {
  try {
    const { value } = await kc.getObject<RainbowSelectedWalletData>(selectedWalletKey);
    return value ?? null;
  } catch (error) {
    logger.error(new RainbowError('[wallet]: Error in getSelectedWallet'), { error });
    return null;
  }
}

export async function saveAllWallets(wallets: AllRainbowWallets): Promise<void> {
  const value: AllRainbowWalletsData = {
    version: ALL_WALLETS_VERSION,
    wallets,
  };
  await kc.setObject(allWalletsKey, value, keychain.publicAccessControlOptions);
}

export async function getAllWallets(): Promise<AllRainbowWalletsData | null> {
  try {
    const { value } = await kc.getObject<AllRainbowWalletsData>(allWalletsKey);
    return value ?? null;
  } catch (error) {
    logger.error(new RainbowError('[wallet]: Error in getAllWallets'), { error });
    return null;
  }
}

/** Moves legacy seed and private-key records into per-wallet keychain entries. */
export async function migrateWalletSecrets(): Promise<MigratedSecretsResult | null> {
  try {
    logger.debug('[wallet]: Migrating wallet secrets', {}, DebugContext.wallet);
    const seedphrase = await loadLegacySeedPhrase();

    if (seedphrase === kc.ErrorType.UserCanceled || seedphrase === kc.ErrorType.NotAuthenticated) return null;

    if (!seedphrase) {
      await keychain.saveString(oldSeedPhraseMigratedKey, 'true', keychain.publicAccessControlOptions);
      return null;
    }

    const type = identifyWalletType(seedphrase);
    let hdnode: HDNode | undefined;
    let existingAccount: Wallet | undefined;

    switch (type) {
      case EthereumWalletType.privateKey:
        existingAccount = new Wallet(addHexPrefix(seedphrase));
        break;
      case EthereumWalletType.mnemonic: {
        const { wallet } = await deriveAccountFromMnemonic(seedphrase);
        existingAccount = new Wallet(addHexPrefix(wallet.getPrivateKey().toString('hex')));
        break;
      }
      case EthereumWalletType.seed:
        hdnode = HDNode.fromSeed(seedphrase);
        break;
    }

    if (!existingAccount && hdnode) {
      const node = hdnode.derivePath(getHdPath({ type: WalletLibraryType.ethers, index: 0 }));
      existingAccount = new Wallet(node.privateKey);
    }
    if (!existingAccount) return null;

    if (!(await keychain.hasKey(`${existingAccount.address}_${privateKeyKey}`))) {
      await saveKeyForWallet(existingAccount.address, existingAccount.privateKey, false);
    }

    const wallet = (await getSelectedWallet())?.wallet;
    if (!wallet) return null;

    if (!(await keychain.hasKey(`${wallet.id}_${seedPhraseKey}`))) {
      await saveSeedPhrase(seedphrase, wallet.id);
    }

    await keychain.saveString(oldSeedPhraseMigratedKey, 'true', keychain.publicAccessControlOptions);
    return {
      hdnode,
      privateKey: existingAccount.privateKey,
      seedphrase,
      type,
    };
  } catch (error) {
    logger.error(new RainbowError('[wallet]: Error while migrating secrets'), { error });
    return null;
  }
}

export async function cleanUpWalletKeys(): Promise<boolean> {
  const keys = [addressKey, allWalletsKey, oldSeedPhraseMigratedKey, pinKey, selectedWalletKey];
  try {
    await Promise.all(
      keys.map(async key => {
        try {
          await keychain.remove(key);
        } catch (error) {
          logger.warn('[wallet]: Failure to delete key', { key, error });
        }
      })
    );
    return true;
  } catch {
    return false;
  }
}

/** Returns keychain-backed wallet IDs mapped to their next damaged state. */
export async function checkWalletsDamagedState(wallets: AllRainbowWallets): Promise<Map<string, boolean>> {
  const updatedWalletDamagedStates = new Map<string, boolean>();
  const keychainWallets = Object.values(wallets).filter(wallet => wallet.encryptionType === EncryptionType.keychain);
  if (keychainWallets.length === 0) return updatedWalletDamagedStates;

  const isPasscodeAuthAvailable = await kc.isPasscodeAuthAvailable();
  if (!isPasscodeAuthAvailable) {
    keychainWallets.forEach(wallet => updatedWalletDamagedStates.set(wallet.id, true));
    return updatedWalletDamagedStates;
  }

  if (!CHECKS_WALLET_KEY_EXISTENCE) return updatedWalletDamagedStates;

  keychainWallets.filter(wallet => wallet.damaged).forEach(wallet => updatedWalletDamagedStates.set(wallet.id, false));

  await Promise.all(
    keychainWallets.map(async wallet => {
      const key = `${wallet.addresses[0].address}_${privateKeyKey}`;
      let hasKey = false;
      try {
        hasKey = await kc.has(key);
      } catch (error) {
        logger.debug(
          `[wallet]: Error checking keychain key existence for wallet ${wallet.id}: ${ensureError(error).message}`,
          {},
          DebugContext.wallet
        );
      }
      if (!hasKey) updatedWalletDamagedStates.set(wallet.id, true);
    })
  );

  return updatedWalletDamagedStates;
}
