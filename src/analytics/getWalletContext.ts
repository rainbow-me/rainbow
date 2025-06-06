import { securelyHashWalletAddress } from '@/analytics/utils';
import { EthereumWalletType } from '@/helpers/walletTypes';
import { getWalletWithAccount } from '@/state/wallets/walletsStore';
import type { Address } from 'viem';

export type WalletContext = {
  walletType?: 'owned' | 'hardware' | 'watched';
  walletAddressHash?: string;
};

const walletContextTypes = {
  [EthereumWalletType.mnemonic]: 'owned',
  [EthereumWalletType.privateKey]: 'owned',
  [EthereumWalletType.seed]: 'owned',
  [EthereumWalletType.readOnly]: 'watched',
  [EthereumWalletType.bluetooth]: 'hardware',
} as const;

export async function getWalletContext(address: Address): Promise<WalletContext> {
  // currentAddressStore address is initialized to ''
  if (!address || address === ('' as Address)) return {};

  // walletType maybe undefined after initial wallet creation
  const wallet = getWalletWithAccount(address);
  const walletType = walletContextTypes[wallet?.type!];
  const walletAddressHash = securelyHashWalletAddress(address);

  return {
    walletType,
    walletAddressHash,
  };
}
