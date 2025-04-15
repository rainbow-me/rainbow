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
}

export const userNftsStoreManager = createRainbowStore<UserNftsStoreManagerState>(
  () => ({
    cachedStore: null,
    cachedAddress: null,
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
      setData: ({ data, set }) => {
        set(state => {
          return {
            ...state,
            nftsMap: new Map([...state.nftsMap, ...data.nftsMap]),
            nfts: data.nfts,
          };
        });
      },
      params: {
        address: address as string,
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
        getNft: (uniqueId: string) => {
          const nft = get().nftsMap.get(uniqueId);
          return nft;
        },
        getNftsForSale: () => get().nfts.filter(nft => nft.currentPrice),
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
  userNftsStoreManager.setState({ cachedStore: newStore, cachedAddress: addressToUse });
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
