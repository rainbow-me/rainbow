import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { deriveSafeWalletAddress } from '@/features/polymarket/utils/deriveSafeWalletAddress';
import { Address } from 'viem';

export const usePolymarketProxyAddress = createDerivedStore(
  $ => {
    const address = $(useWalletsStore).accountAddress;

    return {
      address: address as Address,
      proxyAddress: deriveSafeWalletAddress(address) as Address,
    };
  },
  { fastMode: true }
);
