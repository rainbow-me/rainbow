import { type HDNode } from '@ethersproject/hdnode';

import { type EthereumAddress } from '@/entities/wallet';
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
