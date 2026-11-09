import { createBaseStore, createStoreActions } from '@storesjs/stores';
import delay from 'delay';
import { type Address } from 'viem';

import { analytics } from '@/analytics';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { fetchHiddenTokens } from '@/features/nfts/data/hiddenNftsStore';
import { fetchShowcaseTokens } from '@/features/nfts/data/showcaseStore';
import { hyperliquidAccountActions } from '@/features/perps/stores/hyperliquidAccountStore';
import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { usePolymarketPositionsStore } from '@/features/polymarket/stores/polymarketPositionsStore';
import { usePositionsStore } from '@/features/positions/stores/positionsStore';
import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';
import { createQueryKey, queryClient } from '@/react-query';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { NFTS_PAGE_SIZE } from '@/state/nfts/constants';
import { useNftsStore } from '@/state/nfts/nfts';
import { refetchWalletSummary } from '@/state/wallets/useWalletSummaryStore';
import { getAccountAddress, refreshWalletInfo } from '@/state/wallets/walletsStore';

const MIN_PULL_TO_REFRESH_DURATION = time.seconds(1.25);

type RefreshStore = {
  isRefreshing: boolean;
  refreshAccountData: () => Promise<void>;
  setIsRefreshing: (isRefreshing: boolean) => void;
};

export const useAccountRefreshStore = createBaseStore<RefreshStore>((set, get) => {
  let lastAddress: Address | undefined;

  return {
    isRefreshing: false,

    refreshAccountData: async () => {
      const address = getAccountAddress();
      const state = get();

      if (state.isRefreshing && lastAddress === address) return;

      lastAddress = address;
      state.setIsRefreshing(true);

      try {
        const start = performance.now();
        await refreshAccountDataInternal(address);
        analytics.track(analytics.event.refreshAccountData, { duration: performance.now() - start });
      } catch (error) {
        logger.error(new RainbowError(`[useRefreshAccountData]: Error calling fetchAccountData`, error));
      } finally {
        state.setIsRefreshing(false);
      }
    },

    setIsRefreshing: isRefreshing => set(state => (isRefreshing === state.isRefreshing ? state : { isRefreshing })),
  };
});

export const accountRefreshActions = createStoreActions(useAccountRefreshStore);

async function refreshAccountDataInternal(accountAddress: Address): Promise<void> {
  // These queries can take too long to fetch, so we do not wait for them
  refetchWalletSummary();
  queryClient.invalidateQueries(createQueryKey('nfts', { address: accountAddress }));
  void fetchShowcaseTokens({ address: accountAddress }, { force: true });
  void fetchHiddenTokens({ address: accountAddress }, { force: true });

  await Promise.allSettled([
    delay(MIN_PULL_TO_REFRESH_DURATION),
    refreshWalletInfo({ addresses: [accountAddress] }),
    hyperliquidAccountActions.fetch(undefined, { force: true }),
    useUserAssetsStore.getState().fetch(undefined, { staleTime: 0 }),
    usePolymarketPositionsStore.getState().fetch(undefined, { staleTime: time.seconds(2) }),
    usePolymarketBalanceStore.getState().fetch(undefined, { staleTime: 0 }),
    useBackendNetworksStore.getState().fetch(undefined, { staleTime: time.seconds(30) }),
    usePositionsStore.getState().fetch(undefined, { staleTime: time.seconds(5) }),
    useClaimablesStore.getState().fetch(undefined, { staleTime: time.seconds(5) }),
    useNftsStore.getState().fetch({ limit: NFTS_PAGE_SIZE }, { staleTime: time.seconds(5) }),
  ]).then(() => refreshWalletInfo({ useCachedENS: true }));
}
