import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { UniqueAsset } from '@/entities';
import { createQueryStore } from '../internal/createQueryStore';
import { fetchUserNftCollections, fetchUserNfts, fetchUserNftsByCollection } from '@/resources/nfts';
import { time } from '@/utils';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { useAccountSettings } from '@/hooks';
import reduxStore from '@/redux/store';
import { MMKV } from 'react-native-mmkv';
import { UniqueAssetFamily } from '@/entities/uniqueAssets';
import { useStore } from 'zustand';
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
type UserNftsState = {
  nfts: UniqueAsset[];
  nftsMap: Map<string, UniqueAsset>;
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
        sortBy: $ => $(useNftSortStore, s => s.getNftSort(config.address).sortBy),
        sortDirection: $ => $(useNftSortStore, s => s.getNftSort(config.address).sortDirection),
      },
      staleTime: time.minutes(10),
    },
    () => ({
      nfts: [],
      nftsMap: new Map<string, UniqueAsset>(),
    }),
    config.address?.length
      ? {
          storageKey: `userNfts_${config.address}`,
          version: 1,
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

type UserNftCollectionsParams = {
  address: string;
  sortBy: NftCollectionSortCriterion;
  sortDirection: SortDirection;
};

type UserNftCollectionsResponse = {
  collections: Map<string, UniqueAssetFamily>;
};

type UserNftCollectionsState = {
  collections: Map<string, UniqueAssetFamily>;
  getCollections: () => UniqueAssetFamily[];
};

type NftCollectionsFactoryConfig = {
  address: string;
};

export const createUserNftCollectionsStore = (config: NftCollectionsFactoryConfig) =>
  createQueryStore<UserNftCollectionsResponse, UserNftCollectionsParams, UserNftCollectionsState>(
    {
      enabled: config.address !== '',
      cacheTime: time.weeks(1),
      fetcher: fetchUserNftCollections,
      params: {
        address: config.address,
        sortBy: $ => $(useNftSortStore, s => s.getNftSort(config.address).sortBy),
        sortDirection: $ => $(useNftSortStore, s => s.getNftSort(config.address).sortDirection),
      },
      staleTime: time.minutes(10),
    },
    (set, get) => ({
      collections: new Map<string, UniqueAssetFamily>(),
      getCollections: () => {
        // @ts-ignore
        const collections = get()?.getData()?.collections;
        return (collections ? Array.from(collections.values()) : []) as UniqueAssetFamily[];
      },
    }),
    config.address?.length
      ? {
          storageKey: `userNftCollections_${config.address}`,
          version: 1,
        }
      : undefined
  );

type UserNftCollectionsStoreType = ReturnType<typeof createUserNftCollectionsStore>;

interface CollectionsStoreManagerState {
  cachedAddress: string | null;
  cachedStore: UserNftCollectionsStoreType | null;
}

export const userNftCollectionsStoreManager = createRainbowStore<CollectionsStoreManagerState>(
  () => ({ cachedStore: null, cachedAddress: null }),
  {
    storageKey: 'userNftCollectionsStoreManager',
  }
);

function getOrCreateCollectionsStore(address: string): UserNftCollectionsStoreType {
  const { cachedAddress, cachedStore } = userNftCollectionsStoreManager.getState();
  const rawAddress = address?.length ? address : reduxStore.getState().settings.accountAddress;
  const accountAddress = rawAddress?.length ? rawAddress : cachedAddress ?? rawAddress;

  if (cachedStore && cachedAddress === accountAddress) return cachedStore;

  const newStore = createUserNftCollectionsStore({ address });
  userNftCollectionsStoreManager.setState({ cachedStore: newStore, cachedAddress: address });
  return newStore;
}

export function useNftCollectionsStore<T>(address: string, selector: (state: ReturnType<UserNftCollectionsStoreType['getState']>) => T) {
  return useStore(getOrCreateCollectionsStore(address), selector);
}

export function useUserNftCollections<T>(selector: (state: ReturnType<UserNftCollectionsStoreType['getState']>) => T) {
  const { accountAddress } = useAccountSettings();
  return useNftCollectionsStore(accountAddress, selector);
}

type UserNftsByCollectionParams = {
  address: string;
  collectionId: string;
  open?: boolean;
};

type UserNftsByCollectionResponse = {
  nfts: Map<string, UniqueAsset>;
};

type UserNftsByCollectionState = {
  nfts: Map<string, UniqueAsset>;
};

type UserNftsByCollectionStoreType = ReturnType<typeof createUserNftsByCollectionStore>;

type NftsByCollectionFactoryConfig = {
  address: string;
  collectionId: string;
};

export const createUserNftsByCollectionStore = (config: NftsByCollectionFactoryConfig) => {
  return createQueryStore<UserNftsByCollectionResponse, UserNftsByCollectionParams, UserNftsByCollectionState>(
    {
      // TODO: talk to Christian about this, this doesn't react to the open state changes
      // enabled: $ => $(useOpenFamiliesStore, s => s.getOpenFamilies(config.address)[config.collectionName]),
      cacheTime: time.weeks(1),
      fetcher: fetchUserNftsByCollection,
      params: {
        address: config.address,
        collectionId: config.collectionId,
        open: $ => $(useOpenFamiliesStore, s => s.getOpenFamilies(config.address)[config.collectionId]),
      },
      staleTime: time.minutes(10),
    },
    () => ({
      nfts: new Map(),
    }),
    config.address?.length
      ? {
          storageKey: `userNftsByCollection_${config.address}_${config.collectionId}`,
          version: 1,
        }
      : undefined
  );
};

type UserNftsByCollectionStoreManagerState = {
  cachedAddress: string | null;
  cachedStores: Record<string, UserNftsByCollectionStoreType>;
};

const userNftsByCollectionStoreManager = createRainbowStore<UserNftsByCollectionStoreManagerState>(
  () => ({
    cachedAddress: null,
    cachedStores: {},
  }),
  {
    storageKey: 'userNftsByCollectionStoreManager',
  }
);

export function getOrCreateNftsByCollectionStore(address: string, collectionId: string) {
  const cacheKey = `${address}-${collectionId}`;
  const cachedStore = userNftsByCollectionStoreManager.getState().cachedStores[cacheKey];
  const managerState = userNftsByCollectionStoreManager.getState();

  if (cachedStore) {
    return cachedStore;
  }

  const store = createUserNftsByCollectionStore({ address, collectionId });
  userNftsByCollectionStoreManager.setState({
    ...managerState,
    cachedStores: {
      ...managerState.cachedStores,
      [cacheKey]: store,
    },
  });

  return store;
}

export const userNftsByCollectionStore = {
  getState: (address: string, collectionId: string) => getOrCreateNftsByCollectionStore(address, collectionId)?.getState(),
  setState: (address: string, collectionId: string, partial: Partial<UserNftsByCollectionState>) =>
    getOrCreateNftsByCollectionStore(address, collectionId)?.setState(partial),
  subscribe: (address: string, collectionId: string, listener: (state: UserNftsByCollectionState) => void) =>
    getOrCreateNftsByCollectionStore(address, collectionId)?.subscribe(listener),
};

export function useNftCollection<T>(
  address: string,
  collectionId: string,
  selector: (state: ReturnType<UserNftsByCollectionStoreType['getState']>) => T
) {
  return useStore(getOrCreateNftsByCollectionStore(address, collectionId), selector);
}

type OpenFamiliesStore = {
  openFamilies: Record<string, boolean>;
  getOpenFamilies: (address?: string) => Record<string, boolean>;
  updateOpenFamilies: (address: string, updates: Record<string, boolean>) => void;
};

export const useOpenFamiliesStore = createRainbowStore<OpenFamiliesStore>(
  (set, get) => ({
    openFamilies: {},
    getOpenFamilies: (address?: string) => {
      if (!address) {
        return { Showcase: true };
      }
      const state = get();
      return state.openFamilies?.[address] || getPersistedOpenFamilies(address);
    },
    updateOpenFamilies: (address, updates) => {
      const state = get();
      set({
        ...state,
        openFamilies: {
          ...state.openFamilies,
          [address]: {
            ...(state.openFamilies[address] || getPersistedOpenFamilies(address)),
            ...updates,
          },
        },
      });
    },
  }),
  {
    storageKey: 'openFamilies',
    version: 0,
  }
);

const getOpenFamiliesStorageKey = (accountAddress: string) => `open-families-${accountAddress}`;
const getPersistedOpenFamilies = (accountAddress: string) => {
  const stored = mmkv.getString(getOpenFamiliesStorageKey(accountAddress));
  return stored ? JSON.parse(stored) : { Showcase: true };
};
