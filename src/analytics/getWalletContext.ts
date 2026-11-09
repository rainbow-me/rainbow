import type { Address } from 'viem';

import { securelyHashWalletAddress } from '@/analytics/utils';
import { type RainbowWallet } from '@/features/wallet/types';
import { EthereumWalletType } from '@/helpers/walletTypes';

/** Wallet identity attached to telemetry, without exposing its address. */
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

const EMPTY_WALLET_CONTEXT: WalletContext = {};

/**
 * Builds telemetry context from a wallet address and type (`owned`, `hardware`, `watched`).
 */
export function getWalletContext(address: Address, type: RainbowWallet['type'] | undefined): WalletContext {
  if (!address) return EMPTY_WALLET_CONTEXT;
  return {
    walletType: type === undefined ? undefined : walletContextTypes[type],
    walletAddressHash: securelyHashWalletAddress(address),
  };
}
