import { QueryEnabledUserNftsState, UserNftsState, UserNftsStoreType, UserNftsParams, UserNftsResponse } from './types';
import { createQueryStore } from '../internal/createQueryStore';
import { createRainbowStore } from '../internal/createRainbowStore';
import { fetchUserNfts } from '@/resources/nfts';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { time } from '@/utils';
import { UniqueAsset } from '@/entities';
import { userAssetsStoreManager } from '../assets/userAssetsStoreManager';

interface UserNftsStoreManagerState {
  cachedAddress: string | null;
  cachedStore: UserNftsStoreType | null;
  // Used to determine if we need to grab nfts by open collection while we wait
  // Adds an additional concern to getOrCreateStore but saves us from a messy attach value otherwise
  hasCompletedInitialFetch: boolean;
}

export const userNftsStoreManager = createRainbowStore<UserNftsStoreManagerState>(
  () => ({
    cachedStore: null,
    cachedAddress: null,
    hasCompletedInitialFetch: false,
  }),
  {
    storageKey: 'userNftsStoreManager',
  }
);

type CreateNftCollectionsParams = {
  address: string | null;
  external?: boolean;
};

export const createUserNftsStore = ({ address, external = false }: CreateNftCollectionsParams) =>
  createQueryStore<UserNftsResponse, UserNftsParams, UserNftsState, UserNftsResponse>(
    {
      enabled: !!address && address !== '',
      cacheTime: time.weeks(1),
      fetcher: fetchUserNfts,
      onFetched: () => userNftsStoreManager.setState({ hasCompletedInitialFetch: true }),
      setData: ({ data: { nftsMap }, set }) => set(state => ({ ...state, nftsMap })),
      params: {
        address,
        sortBy: NftCollectionSortCriterion.MostRecent,
        sortDirection: SortDirection.Desc,
      },
      staleTime: time.minutes(10),
    },
    (_, get) => {
      return {
        nftsMap: new Map<string, UniqueAsset>(),
        nfts: [],
        getNfts: () => Array.from(get().nftsMap.values()),
        getNft: (uniqueId: string) => get().nftsMap.get(uniqueId),
        getNftsForSale: () => get().nfts.filter(nft => nft.currentPrice),
        getSendableUniqueTokens: () => get().nfts.filter(nft => nft.isSendable),
      };
    },
    address?.length && !external
      ? {
          storageKey: `userNfts_${address}`,
          version: 0,
        }
      : undefined
  );

function getOrCreateStore(address?: string | null): ReturnType<typeof createUserNftsStore> {
  const { cachedAddress, cachedStore } = userNftsStoreManager.getState();
  const addressToUse = address || cachedAddress;

  if (cachedStore && cachedAddress === addressToUse) return cachedStore;

  const newStore = createUserNftsStore({ address: addressToUse });
  const newState = newStore.getState();

  userNftsStoreManager.setState({
    cachedStore: newStore,
    cachedAddress: addressToUse,
    hasCompletedInitialFetch: newState.getNfts().length > 0,
  });

  return newStore;
}

export function useUserNftsStoreInteral<T>(selector: (state: QueryEnabledUserNftsState) => T): T {
  const address = userAssetsStoreManager(state => state.address);
  return getOrCreateStore(address)(selector);
}

export const useUserNftsStore = Object.assign(useUserNftsStoreInteral, {
  getState: (address?: string | null) => getOrCreateStore(address).getState(),

  setState: (
    partial:
      | QueryEnabledUserNftsState
      | Partial<QueryEnabledUserNftsState>
      | ((state: QueryEnabledUserNftsState) => QueryEnabledUserNftsState | Partial<QueryEnabledUserNftsState>),
    replace?: boolean,
    address?: string | null
  ) => getOrCreateStore(address).setState(partial, replace),

  subscribe: (listener: (state: QueryEnabledUserNftsState, prevState: QueryEnabledUserNftsState) => void, address?: string | null) =>
    getOrCreateStore(address).subscribe(listener),
});
