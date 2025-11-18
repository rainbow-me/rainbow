import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { deriveSafeWalletAddress } from '@/features/polymarket/utils/deriveSafeWalletAddress';

export const usePolymarketProxyAddress = createDerivedStore(
  $ => {
    const address = $(useWalletsStore).accountAddress;

    return {
      proxyAddress: deriveSafeWalletAddress(address),
    };
  },
  { fastMode: true }
);
