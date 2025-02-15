import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { UniqueAsset } from '@/entities';
import { createQueryStore } from '../internal/createQueryStore';
import { fetchUserNfts } from '@/resources/nfts';
import { time } from '@/utils';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { useAccountSettings } from '@/hooks';
import reduxStore from '@/redux/store';
import { MMKV } from 'react-native-mmkv';
import { useEffect, useState } from 'react';

const mmkv = new MMKV();

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
type NftFactoryConfig = {
  address: string;
  internal?: boolean;
};

export const createUserNftsStore = (config: NftFactoryConfig) =>
  createQueryStore<UserNftsResponse, UserNftsParams>(
    {
      enabled: config.address !== '',
      cacheTime: config.internal ? time.weeks(1) : time.hours(1),
      fetcher: fetchUserNfts,
      params: {
        address: config.address,
        sortBy: $ => $(useNftSortStore, s => s.getNftSort(config.address).sortBy),
        sortDirection: $ => $(useNftSortStore, s => s.getNftSort(config.address).sortDirection),
      },
      staleTime: time.minutes(10),
    },
    () => null,
    config.address?.length
      ? {
          storageKey: `userNfts_${config.address}`,
          version: 0,
        }
      : undefined
  );

function getOrCreateStore(address: string, internal?: boolean): UserNftsStoreType {
  const { cachedAddress, cachedStore } = userNftsStoreManager.getState();
  const rawAddress = address?.length ? address : reduxStore.getState().settings.accountAddress;

  /**
   * This fallback can be removed once Redux is no longer the source of truth for the current
   * accountAddress. It's needed to ensure there's an address available immediately upon app
   * launch, which currently is not the case — the initial Redux address is an empty string.
   */
  const accountAddress = rawAddress?.length ? rawAddress : cachedAddress ?? rawAddress;

  if (cachedStore && cachedAddress === accountAddress) return cachedStore;

  const newStore = createUserNftsStore({ address, internal });
  userNftsStoreManager.setState({ cachedStore: newStore, cachedAddress: address });
  return newStore;
}

export function useNftsStore(address: string, internal?: boolean) {
  return getOrCreateStore(address, internal);
}

export function useUserNftsStore<T>(selector: (state: ReturnType<UserNftsStoreType['getState']>) => T) {
  const { accountAddress } = useAccountSettings();
  return useNftsStore(accountAddress, true)(selector);
}

export function useUniqueTokensProfile(address: string) {
  const [data, setData] = useState<UniqueAsset[]>([]);
  const [loading, setLoading] = useState(!!address);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) return;

    setLoading(true);
    getOrCreateStore(address, true)
      .getState()
      .fetch({ address }, { force: true, skipStoreUpdates: true })
      .then(d => {
        setData(d?.nfts || []);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [address]);

  return { data, loading, error };
}

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
      const currentSort = state.nftSort?.[address] || getPersistedSort(address);
      const [sortBy, sortDirection] = parseNftSortAction(currentSort);
      return {
        sortBy,
        sortDirection,
      };
    },
    updateNftSort: (address, sortAction) => {
      const state = get();
      set({
        ...state,
        nftSort: {
          ...state.nftSort,
          [address]: sortAction,
        },
      });
    },
  }),
  {
    storageKey: 'nftSort',
    version: 0,
  }
);

const getSortStorageKey = (accountAddress: string) => `nfts-sort-${accountAddress}`;
const getPersistedSort = (accountAddress: string) => {
  return mmkv.getString(getSortStorageKey(accountAddress)) as NftSortAction | undefined;
};
const parseNftSortAction = (s: string | undefined) => {
  const [sortBy = NftCollectionSortCriterion.MostRecent, sortDirection = SortDirection.Desc] = (s?.split('|') || []) as [
    sortBy?: NftCollectionSortCriterion,
    sortDirection?: SortDirection,
  ];
  return [sortBy, sortDirection] as const;
};
