import { type HDNode } from '@ethersproject/hdnode';

import { type EthereumAddress } from '@/entities/wallet';
import { type SolanaAddress } from '@/features/solana/core/address';
import { type HardwareKey } from '@/features/wallet/core/hardwareWalletKey';
import { type EthereumPrivateKey } from '@/features/wallet/core/walletDerivation';
import { type EthereumWalletType } from '@/helpers/walletTypes';

export interface RainbowAccount {
  address: EthereumAddress;
  ens?: string | null;
  index: number;
  label: string;
  avatar: null | string;
  color: number;
  visible: boolean;
  emoji?: string;
  image?: string | null;
}

export enum EncryptionType {
  rainbowPin = 'rainbowPin',
  keychain = 'keychain',
  none = 'none',
}

export interface RainbowWallet {
  id: string;
  name: string;
  color: number;
  imported: boolean;
  primary: boolean;
  backedUp?: boolean;
  backupFile?: string | null;
  backupDate?: number;
  backupType?: string;
  deviceId?: string;
  type: EthereumWalletType;
  addresses: RainbowAccount[];
  damaged?: boolean;
  encryptionType: EncryptionType;
}

export interface AllRainbowWallets {
  [key: string]: RainbowWallet;
}

export interface AllRainbowWalletsData {
  wallets: AllRainbowWallets;
  version: number;
}

export interface RainbowSelectedWalletData {
  wallet: RainbowWallet;
  version: number;
}

/** Raw wallet addresses only. String aliases remain permissive; validate at runtime. */
export type WalletAddress = EthereumAddress | SolanaAddress;

/** Legacy stored account values; these aliases document meaning, not validation. */
export type WalletAccountMaterial = EthereumPrivateKey | HardwareKey | WalletAddress | null;

export interface PrivateKeyData {
  address: WalletAddress;
  privateKey: WalletAccountMaterial;
  version: number;
  /** Required on new software-key records; legacy records retain their existing shape. */
  format?: PrivateKeyFormat;
}

/** Unclassified wallet import text; validate before treating it as source material. */
export type WalletImportInput = string;

export interface SeedPhraseData<TMaterial = WalletImportInput> {
  id: RainbowWallet['id'];
  seedphrase: TMaterial;
  version: number;
}

export interface MigratedSecretsResult {
  hdnode: HDNode | undefined;
  privateKey: EthereumPrivateKey;
  seedphrase: WalletImportInput;
  type: EthereumWalletType;
}

export const DEFAULT_WALLET_NAME = 'My Wallet';

// Opt-in wallet, account, and identifier types
export type SupportedCaipNamespace = 'eip155' | 'solana';

// Construct through validated parsers; these brands are not runtime validators.
export type Caip2ChainId = string & { readonly __caip2: unique symbol };
export type Caip10AccountId = string & { readonly __caip10: unique symbol };
export type Caip19AssetType = string & { readonly __caip19AssetType: unique symbol };
export type Caip19AssetId = string & { readonly __caip19AssetId: unique symbol };

export type AccountRef = Pick<AccountProfile, 'walletId' | 'index'>;

export type AccountAddressMetadata = {
  address: WalletAddress;
  ens?: string | null;
};

export type AccountAddresses = Readonly<Partial<Record<SupportedCaipNamespace, AccountAddressMetadata>>>;

export type AccountProfile = Omit<RainbowAccount, 'address' | 'ens'> & {
  walletId: RainbowWallet['id'];
};

export type SingleAddressAccount = AccountProfile & {
  address: WalletAddress;
  namespace: SupportedCaipNamespace;
  ens?: string | null;
  addresses?: never;
};

export type MultiAddressAccount = AccountProfile & {
  addresses: AccountAddresses;
  address?: never;
};

export type WalletCommon = Pick<RainbowWallet, 'id' | 'name' | 'color' | 'imported' | 'primary' | 'encryptionType' | 'damaged'>;

export type WalletBackupMetadata = Pick<RainbowWallet, 'backedUp' | 'backupFile' | 'backupDate' | 'backupType'>;

export type MnemonicWallet = WalletCommon & {
  type: EthereumWalletType.mnemonic;
  accounts: readonly MultiAddressAccount[];
  backup: WalletBackupMetadata;
};

export type PrivateKeyWallet = WalletCommon & {
  type: EthereumWalletType.privateKey;
  account: SingleAddressAccount;
  backup: WalletBackupMetadata;
};

export type WatchOnlyWallet = WalletCommon & {
  type: EthereumWalletType.readOnly;
  account: SingleAddressAccount;
};

export type HardwareWallet = WalletCommon & {
  type: EthereumWalletType.bluetooth;
  accounts: readonly MultiAddressAccount[];
  device: {
    vendor: 'ledger';
    transport: 'bluetooth';
    deviceId: string;
  };
};

// Preserve existing seed records without claiming they are BIP39 phrases.
export type SeedWallet = WalletCommon & {
  type: EthereumWalletType.seed;
  accounts: readonly MultiAddressAccount[];
  backup: WalletBackupMetadata;
};

export type WalletDescriptor = MnemonicWallet | PrivateKeyWallet | WatchOnlyWallet | HardwareWallet | SeedWallet;

export type DerivedAccount = {
  index: number;
  addresses: AccountAddresses;
};

// Created only after runtime BIP39 validation; serialization remains a string.
export type Bip39Mnemonic = string & { readonly __bip39Mnemonic: unique symbol };

export type MnemonicDerivationInput = {
  mnemonic: Bip39Mnemonic;
  index: number;
  chains: readonly Caip2ChainId[];
};

// The first signer adapter supports only the Solana namespace.
export type SolanaSigningRequest = AccountRef & {
  accountId: Caip10AccountId & `solana:${string}:${string}`;
};

export type WalletAccessResult<T> =
  | { status: 'ok'; value: T }
  | {
      status:
        | 'cancelled'
        | 'not-authenticated'
        | 'disabled'
        | 'missing-key'
        | 'unavailable'
        | 'unsupported-source'
        | 'invalid-record'
        | 'account-changed'
        | 'address-mismatch'
        | 'legacy-migration-required';
    };

// Validated source and protected account-key types
export interface MnemonicData extends SeedPhraseData<Bip39Mnemonic> {
  version: 1;
}

// Shared identity and metadata records
export type AccountKeyRef = AccountRef & {
  address: WalletAddress;
  namespace: SupportedCaipNamespace;
};

export type KeyOrigin =
  | {
      kind: 'derived';
      scheme: string;
      path: string;
      sourceAddress: WalletAddress;
      sourceNamespace: SupportedCaipNamespace;
    }
  | { kind: 'imported' };

export type AccountKeyBinding = AccountKeyRef & {
  origin: KeyOrigin;
};

export type PrivateKeyFormat = 'secp256k1-private-key-hex' | 'ed25519-seed-base64';

// Key material is shared by address; ownership/provenance stays in AccountKeyBinding.
export type AccountPrivateKeyData = PrivateKeyData & {
  privateKey: string;
  version: 1;
  format: PrivateKeyFormat;
};

export type AccountMetadataRecord = AccountKeyRef & {
  version: 1;
};

// Wallet source material
export type SoftwarePrivateKeyMaterial = Pick<AccountPrivateKeyData, 'format' | 'privateKey'>;

// Only after the existing raw-seed decoder accepts the value.
export type LegacySeedMaterial = string & { readonly __legacySeedMaterial: unique symbol };

export type WalletSourceMaterial =
  | Bip39Mnemonic
  | WalletAddress
  | SoftwarePrivateKeyMaterial
  | HardwareWallet['device']
  | LegacySeedMaterial;
