import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { UniqueAsset } from '@/entities';
import { createQueryStore } from '../internal/createQueryStore';
import { fetchUserNfts } from '@/resources/nfts';
import { time } from '@/utils';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { useAccountSettings } from '@/hooks';

type UserNftsStoreType = ReturnType<typeof createUserNftsStore>;

interface StoreManagerState {
  cachedAddress: string | null;
  cachedStore: UserNftsStoreType | null;
}

export const userNftsStoreManager = createRainbowStore<StoreManagerState>(() => ({ cachedStore: null, cachedAddress: null }), {
  storageKey: 'userNftsStoreManager',
});

export type UserNftsParams = { address: string; sortBy: NftCollectionSortCriterion; sortDirection: SortDirection };
export type UserNftsResponse = {
  nfts: UniqueAsset[];
  nftsMap: Map<string, UniqueAsset>;
};
type UserNftsState = {
  nfts: UniqueAsset[];
  nftsMap: Map<string, UniqueAsset>;
  getNft: (uniqueId: string) => UniqueAsset | undefined;
};
type NftFactoryConfig = {
  address: string;
  internal?: boolean;
};

export const createUserNftsStore = (config: NftFactoryConfig) =>
  createQueryStore<UserNftsResponse, UserNftsParams, UserNftsState>(
    {
      enabled: config.address !== '',
      cacheTime: config.internal ? time.weeks(1) : time.hours(1),
      fetcher: fetchUserNfts,
      params: {
        address: config.address,
        sortBy: $ => $(useNftSortStore, s => s.getNftSort(config.address)).sortBy,
        sortDirection: $ => $(useNftSortStore, s => s.getNftSort(config.address)).sortDirection,
      },
      setData: ({ data, set }) => {
        set(() => {
          return {
            nfts: data.nfts,
            nftsMap: data.nftsMap,
          };
        });
      },
      staleTime: time.minutes(10),
    },
    (_, get) => ({
      nfts: [],
      nftsMap: new Map<string, UniqueAsset>(),
      getNft: (uniqueId: string) => {
        const data = get();
        return data.nftsMap.get(uniqueId);
      },
    }),
    { storageKey: `userNfts_${config.address}` }
  );

function getOrCreateStore(address: string, internal?: boolean): UserNftsStoreType {
  const { cachedAddress, cachedStore } = userNftsStoreManager.getState();
  if (cachedAddress && cachedAddress === address && cachedStore) {
    return cachedStore;
  }

  const newStore = createUserNftsStore({ address, internal });
  userNftsStoreManager.setState({ cachedStore: newStore, cachedAddress: address });
  return newStore;
}

export function useNftsStore(address: string, internal?: boolean) {
  return getOrCreateStore(address, internal);
}

export function useUserNftsStore() {
  const { accountAddress } = useAccountSettings();
  return useNftsStore(accountAddress, true);
}

// SORT

export type NftSortAction = `${NftCollectionSortCriterion}|${SortDirection}`;
type NftSortByAddress = Record<string, NftSortAction>;
type NftSort = {
  sortBy: NftCollectionSortCriterion;
  sortDirection: SortDirection;
};

interface NftSortStore {
  nftSort: NftSortByAddress;
  getNftSort: (address?: string) => NftSort;
  updateNftSort: (address: string, params: NftSortAction) => void;
}

const DEFAULT_NFT_SORT: NftSort = {
  sortBy: NftCollectionSortCriterion.MostRecent,
  sortDirection: SortDirection.Desc,
};

export const useNftSortStore = createRainbowStore<NftSortStore>(
  (set, get) => ({
    nftSort: {},
    getNftSort: (address?: string) => {
      if (!address) {
        return DEFAULT_NFT_SORT;
      }
      const state = get();
      const currentOrder = state.nftSort?.[address];
      const [sortBy, sortDirection] = parseNftSortAction(currentOrder);
      return {
        sortBy,
        sortDirection,
      };
    },
    updateNftSort: (address, sortAction) => {
      const state = get();
      const newState = {
        ...state,
        nftSort: {
          ...state.nftSort,
          [address]: sortAction,
        },
      };
      set(newState);
    },
  }),
  {
    storageKey: 'nftSort',
    version: 0,
  }
);

const parseNftSortAction = (s: string | undefined) => {
  const [sortBy = NftCollectionSortCriterion.MostRecent, sortDirection = SortDirection.Desc] = (s?.split('|') || []) as [
    sortBy?: NftCollectionSortCriterion,
    sortDirection?: SortDirection,
  ];
  return [sortBy, sortDirection] as const;
};
