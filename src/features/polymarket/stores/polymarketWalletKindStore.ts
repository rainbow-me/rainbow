import { RelayClient } from '@polymarket/builder-relayer-client';
import { type Address } from 'viem';

import { BUILDER_CONFIG, POLYMARKET_RELAYER_PROXY_URL } from '@/features/polymarket/constants';
import { deriveSafeWalletAddress } from '@/features/polymarket/utils/deriveSafeWalletAddress';
import { time } from '@/framework/core/utils/time';
import { RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { ChainId } from '@rainbow-me/swaps';

export type PolymarketWalletKind = 'safe' | 'depositWallet';

type Params = { owner: Address | null };

export const usePolymarketWalletKindStore = createQueryStore<PolymarketWalletKind, Params>(
  {
    cacheTime: time.weeks(1),
    enabled: $ => $(useWalletsStore, s => !!s.accountAddress),
    fetcher: createWalletKindFetcher(),
    params: { owner: $ => $(useWalletsStore, s => s.accountAddress ?? null) },
    staleTime: Infinity,
  },
  { storageKey: 'polymarketWalletKindStore' }
);

function createWalletKindFetcher() {
  const relayClient = new RelayClient(POLYMARKET_RELAYER_PROXY_URL, ChainId.polygon, undefined, BUILDER_CONFIG);
  return async ({ owner }: Params): Promise<PolymarketWalletKind> => {
    if (!owner) throw new RainbowError('[PolymarketWalletKindStore] owner is required');
    const safeIsDeployed = await relayClient.getDeployed(deriveSafeWalletAddress(owner));
    return safeIsDeployed ? 'safe' : 'depositWallet';
  };
}
