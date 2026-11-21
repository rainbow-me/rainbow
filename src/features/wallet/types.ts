import { type HDNode } from '@ethersproject/hdnode';

import { type EthereumAddress } from '@/entities/wallet';
import { type SolanaAddress } from '@/features/solana/core/address';
import { type HardwareKey } from '@/features/wallet/core/hardwareWalletKey';
import { type EthereumPrivateKey, type EthereumWalletSeed } from '@/features/wallet/core/walletDerivation';
import { type EthereumWalletType } from '@/helpers/walletTypes';

export interface RainbowAccount {
  index: number;
  label: string;
  address: EthereumAddress;
  avatar: null | string;
  color: number;
  visible: boolean;
  emoji?: string;
  ens?: string | null;
  image?: string | null;
}

export enum EncryptionType {
  rainbowPin = 'rainbowPin',
  keychain = 'keychain',
  none = 'none',
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

export interface PrivateKeyData {
  address: EthereumAddress;
  privateKey: EthereumPrivateKey | HardwareKey | null;
  version: number;
}

export interface SeedPhraseData {
  id: RainbowWallet['id'];
  seedphrase: EthereumWalletSeed;
  version: number;
}

export interface MigratedSecretsResult {
  hdnode: HDNode | undefined;
  privateKey: EthereumPrivateKey;
  seedphrase: EthereumWalletSeed;
  type: EthereumWalletType;
}

export const DEFAULT_WALLET_NAME = 'My Wallet';

// Additive Solana records; legacy wallet and keychain types above retain their contracts.
export type SupportedCaipNamespace = 'eip155' | 'solana';
export type WalletAddress = EthereumAddress | SolanaAddress;
export type AccountProfile = Omit<RainbowAccount, 'address' | 'ens'> & { walletId: RainbowWallet['id'] };
export type AccountRef = Pick<AccountProfile, 'walletId' | 'index'>;
export type AccountAddressMetadata = { address: WalletAddress; ens?: string | null };
export type AccountAddresses = Readonly<Partial<Record<SupportedCaipNamespace, AccountAddressMetadata>>>;
export type MultiAddressAccount = AccountProfile & { addresses: AccountAddresses; address?: never };
export type AccountMetadataRecord = AccountRef & { address: WalletAddress; namespace: SupportedCaipNamespace; version: 1 };
export type AccountPrivateKeyData = { address: WalletAddress; privateKey: string; format: 'ed25519-seed-base58'; version: 1 };
