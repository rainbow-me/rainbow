import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { UniqueAsset } from '@/entities';
import { createQueryStore } from '../internal/createQueryStore';
import { fetchUserNfts } from '@/resources/nfts';
import { time } from '@/utils';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { useAccountSettings } from '@/hooks';

type UpdateNftSortParams = {
  sortBy?: NftCollectionSortCriterion;
  sortDirection?: SortDirection;
};

interface NftSortStore {
  sortBy: NftCollectionSortCriterion;
  sortDirection: SortDirection;
  updateNftSort: (params: UpdateNftSortParams) => void;
}

export const nftSortStore = createRainbowStore<NftSortStore>(
  (set, get) => ({
    sortBy: NftCollectionSortCriterion.MostRecent,
    sortDirection: SortDirection.Desc,
    updateNftSort: params => {
      const state = get();
      set({
        sortBy: params?.sortBy || state.sortBy,
        sortDirection: params?.sortDirection || state.sortDirection,
      });
    },
  }),
  {
    storageKey: 'nftSort',
    version: 0,
  }
);

type UserNftsStoreType = ReturnType<typeof createUserNftsStore>;
type UserNftsParams = { address: string; sortBy: NftCollectionSortCriterion; sortDirection: SortDirection };
type UserNftsState = {
  nfts: UniqueAsset[];
  nftsMap: Map<string, UniqueAsset>;
};

interface StoreManagerState {
  cachedAddress: string | null;
  cachedStore: UserNftsStoreType | null;
}

export const userNftsStoreManager = createRainbowStore<StoreManagerState>(() => ({ cachedStore: null, cachedAddress: null }), {
  storageKey: 'userNftsStoreManager',
});

export const createUserNftsStore = (address: string, internal?: boolean) =>
  createQueryStore<UserNftsState, UserNftsParams, UserNftsState>(
    {
      fetcher: fetchUserNfts,
      cacheTime: internal ? time.weeks(1) : time.hours(1),
      staleTime: time.minutes(10),
      params: {
        address,
        sortBy: $ => $(nftSortStore).sortBy,
        sortDirection: $ => $(nftSortStore).sortDirection,
      },
    },
    () => ({
      nfts: [],
      nftsMap: new Map<string, UniqueAsset>(),
    }),
    { storageKey: `userNfts_${address}` }
  );

function getOrCreateStore(address: string, internal?: boolean): UserNftsStoreType {
  const { cachedAddress, cachedStore } = userNftsStoreManager.getState();
  if (cachedAddress && cachedAddress === address && cachedStore) {
    return cachedStore;
  }

  const newStore = createUserNftsStore(address, internal);
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
