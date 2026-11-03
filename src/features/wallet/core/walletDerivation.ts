import { type HDNode } from '@ethersproject/hdnode';
import { type Wallet } from '@ethersproject/wallet';
import { isValidAddress } from 'ethereumjs-util';
import { type hdkey as EthereumHDKey, type default as LibWallet } from 'ethereumjs-wallet';

import { type EthereumAddress } from '@/entities/wallet';
import { type WalletLibraryType } from '@/features/wallet/core/walletLibrary';
import { addHexPrefix, isHexStringIgnorePrefix, isValidBluetoothDeviceId, isValidMnemonic } from '@/handlers/web3';
import { EthereumWalletType } from '@/helpers/walletTypes';

export type EthereumPrivateKey = string;
export type EthereumWalletSeed = string;

export type ReadOnlyWallet = {
  address: EthereumAddress;
  privateKey: string | null;
};

export type EthereumWallet = Wallet | ReadOnlyWallet | LibWallet;

export type EthereumWalletFromSeed = {
  address: EthereumAddress;
  hdnode: HDNode | null;
  isHDWallet: boolean;
  root: EthereumHDKey | null;
  type: EthereumWalletType;
  wallet: EthereumWallet | null;
  walletType: WalletLibraryType;
};

export interface EthereumWalletFromMnemonic extends EthereumWalletFromSeed {
  root: EthereumHDKey;
  type: EthereumWalletType.mnemonic;
  wallet: LibWallet;
  walletType: WalletLibraryType.bip39;
}

/**
 * Determines the {@link EthereumWalletType} based on the provided wallet seed.
 */
export function identifyWalletType(walletSeed: EthereumWalletSeed): EthereumWalletType {
  if (isHexStringIgnorePrefix(walletSeed) && addHexPrefix(walletSeed).length === 66) {
    return EthereumWalletType.privateKey;
  }

  if (isValidBluetoothDeviceId(walletSeed)) return EthereumWalletType.bluetooth;
  if (isValidMnemonic(walletSeed)) return EthereumWalletType.mnemonic;
  if (isValidAddress(walletSeed)) return EthereumWalletType.readOnly;

  return EthereumWalletType.seed;
}
