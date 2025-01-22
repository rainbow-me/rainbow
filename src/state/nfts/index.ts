import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { UniqueAsset } from '@/entities';
import { createQueryStore } from '../internal/createQueryStore';
import { fetchUserNfts } from '@/resources/nfts';
import { time } from '@/utils';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { useAccountSettings } from '@/hooks';

export type NftOrderingAction = `${NftCollectionSortCriterion}|${SortDirection}`;

interface NftSortStore {
  sortBy: NftCollectionSortCriterion;
  sortDirection: SortDirection;
  updateNftSort: (params: NftOrderingAction) => void;
}

export const useNftSortStore = createRainbowStore<NftSortStore>(
  (set, get) => ({
    sortBy: NftCollectionSortCriterion.MostRecent,
    sortDirection: SortDirection.Desc,
    updateNftSort: orderingAction => {
      const state = get();
      const [sortBy, sortDirection] = parseNftOrderingAction(orderingAction);
      set({
        sortBy: sortBy || state.sortBy,
        sortDirection: sortDirection || state.sortDirection,
      });
    },
  }),
  {
    storageKey: 'nftSort',
    version: 0,
  }
);

const parseNftOrderingAction = (s: string | undefined) => {
  const [sortBy = NftCollectionSortCriterion.MostRecent, sortDirection = SortDirection.Desc] = (s?.split('|') || []) as [
    sortBy?: NftCollectionSortCriterion,
    sortDirection?: SortDirection,
  ];
  return [sortBy, sortDirection] as const;
};

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
        sortBy: $ => $(useNftSortStore).sortBy,
        sortDirection: $ => $(useNftSortStore).sortDirection,
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
