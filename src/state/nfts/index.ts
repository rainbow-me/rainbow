import { UniqueAsset } from '@/entities';
import { createQueryStore } from '../internal/createQueryStore';
import { fetchUserNftCollections, fetchUserNftsByCollection } from '@/resources/nfts';
import { time } from '@/utils';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { UniqueAssetFamily } from '@/entities/uniqueAssets';
import { userAssetsStoreManager } from '../assets/userAssetsStoreManager';
import { SignalFunction } from '../internal/signal';
import { createRainbowStore } from '../internal/createRainbowStore';
import { useNftSortStore } from '@/hooks/useNFTsSortBy';

type ExternalProfileState = {
  externalProfile: string | null;
  setExternalProfile: (externalProfile: string) => void;
};

export const useExternalProfileStore = createRainbowStore<ExternalProfileState>((set) => ({
  externalProfile: null,
  setExternalProfile: (externalProfile: string) => set({ externalProfile }),
}), {
  storageKey: 'externalProfile',
  version: 0,
});

export type UserNftsParams = { address?: string | null; sortBy: NftCollectionSortCriterion; sortDirection: SortDirection };
export type UserNftsResponse = {
  address?: string;
  nfts: UniqueAsset[];
  nftsMap: Map<string, UniqueAsset>;
};
type UserNftCollectionsState = {
  collections: Map<string, UniqueAssetFamily>;
  getCollections: () => UniqueAssetFamily[] | undefined;
} & {
  openFamilies: Record<string, Record<string, boolean>>;
  getOpenFamilies: (address?: string) => Record<string, boolean>;
  updateOpenFamilies: (updates: Record<string, boolean>) => void;
  getUserOpenFamilies: () => Record<string, boolean>;
  getUserExpandedFamilies: () => string[];
  getUserExpandedCollectionIds: () => string | undefined;
};

type NftsByCollectionParams = {
  address?: string | null;
  collectionId?: string;
};

type NftsByCollectionResponse = {
  nfts: Map<string, UniqueAsset>;
};

type NftCollectionsParams = {
  address?: string | null;
  sortBy: NftCollectionSortCriterion;
  sortDirection: SortDirection;
};

type NftCollectionsResponse = {
  collections: Map<string, UniqueAssetFamily>;
};

// Factory function to create NFT stores for any address
function createNftStores(config: {
  getAddress: (signal: SignalFunction) => ReturnType<typeof signal<string | null | undefined>>;
  shouldPersist: boolean;
  debugPrefix?: string;
}) {
  const { getAddress, shouldPersist, debugPrefix = '' } = config;

  type CollectionsState = {
    collections: Map<string, UniqueAssetFamily>;
    getCollections: () => UniqueAssetFamily[];
    openFamilies: Record<string, Record<string, boolean>>;
    getOpenFamilies: (address?: string) => Record<string, boolean>;
    updateOpenFamilies: (updates: Record<string, boolean>) => void;
    getUserOpenFamilies: () => Record<string, boolean>;
    getUserExpandedFamilies: () => string[];
    getUserExpandedCollectionIds: () => string | undefined;
  };

  type NftsState = {
    nftsMap: Map<string, UniqueAsset>;
    getNfts: () => UniqueAsset[];
    getNft: (uniqueId: string) => UniqueAsset | undefined;
    // Track when each batch was fetched
    fetchedAt: Record<string, number>;
  };

  const collectionsStore = createQueryStore<NftCollectionsResponse, NftCollectionsParams, CollectionsState>(
    {
      cacheTime: shouldPersist ? time.weeks(1) : time.days(1),
      fetcher: fetchUserNftCollections,
      debugMode: true,
      params: {
        address: ($) => getAddress($),
        sortBy: ($) => $(useNftSortStore, s => s.getNftSort().sortBy),
        sortDirection: ($) => $(useNftSortStore, s => s.getNftSort().sortDirection),
      },
      staleTime: time.minutes(10),
    },
    (set, get) => ({
      collections: new Map(),
      getCollections: () => {
        const data = get().getData() as NftCollectionsResponse | null;
        return data?.collections ? Array.from(data.collections.values()) : [];
      },
      openFamilies: {},
      getOpenFamilies: () => {
        const address = (shouldPersist ? userAssetsStoreManager.getState().address : useExternalProfileStore.getState().externalProfile) || '';
        return get().openFamilies[address] || {};
      },
      updateOpenFamilies: (updates) => {
        const address = (shouldPersist ? userAssetsStoreManager.getState().address : useExternalProfileStore.getState().externalProfile) || '';
        set(state => ({
          ...state,
          openFamilies: {
            ...state.openFamilies,
            [address]: {
              ...(state.openFamilies[address] || {}),
              ...updates,
            },
          },
        }));
      },
      getUserOpenFamilies: () => {
        const state = get();
        const address = shouldPersist ? userAssetsStoreManager.getState().address : useExternalProfileStore.getState().externalProfile;
        return state.getOpenFamilies(address || '');
      },
      getUserExpandedFamilies: () => {
        const openFamilies = get().getUserOpenFamilies() || {};
        return Object.entries(openFamilies)
          .filter(([, isOpen]) => isOpen)
          .map(([family]) => family);
      },
      getUserExpandedCollectionIds: () => {
        const expandedFamilies = get().getUserExpandedFamilies();
        const collections = get().getCollections();
        return collections
          ?.filter(c => expandedFamilies.includes(c.familyName))
          .map(c => c.collectionId)
          .join(',');
      },
    }),
    shouldPersist ? {
      storageKey: `${debugPrefix}nftCollections`,
      version: 0,
    } : undefined
  );

  const nftsStore = createQueryStore<NftsByCollectionResponse, NftsByCollectionParams, NftsState>(
    {
      abortInterruptedFetches: false,
      cacheTime: shouldPersist ? time.weeks(1) : time.days(1),
      fetcher: fetchUserNftsByCollection,
      keepPreviousData: true,
      debugMode: true,
      params: {
        address: ($) => {
          const addressSignal = getAddress($);
          return addressSignal;
        },
        collectionId: ($) => $(collectionsStore, s => {
          const collections = s.getCollections();
          const expandedFamilies = s.getUserExpandedFamilies();
          return collections
            ?.filter(c => expandedFamilies.includes(c.familyName))
            .map(c => c.collectionId)
            .join(',');
        }),
      },
      setData: ({ data, params, set }) => {
        set(state => ({
          ...state,
          nftsMap: new Map([...state.nftsMap, ...data.nfts]),
          fetchedAt: {
            ...state.fetchedAt,
            [params.collectionId || 'all']: Date.now(),
          },
        }));
      },
      onFetched: async ({ fetch, params }) => {
        const expandedIds = collectionsStore.getState().getUserExpandedCollectionIds();
        if (params.collectionId !== expandedIds) return;

        const allCollections = collectionsStore.getState().getCollections();
        
        if (!allCollections?.length) return;

        // Ideally we should only fetch the collections that are not in the currentIds
        // However, this unpredicatably alters our batch query keys and prevents us from
        // grabbing cached data when the user expands a different set of collections
        // const currentIds = new Set(params.collectionId?.split(',') || []);
        // const remainingCollections = allCollections
        //   .filter(c => !currentIds.has(c.collectionId))
        //   .map(c => c.collectionId);

        const BATCH_SIZE = 50;
        const promises = [];
        for (let i = 0; i < allCollections.length; i += BATCH_SIZE) {
          const batchIds = allCollections.slice(i, i + BATCH_SIZE).map(c => c.collectionId).join(',');
          promises.push(fetch(
            { address: params.address, collectionId: batchIds },
            { 
              updateQueryKey: false,
            }
          ));
        }
        await Promise.all(promises);
      },
      staleTime: time.minutes(10),
    },
    (_, get) => ({
      nftsMap: new Map(),
      fetchedAt: {},
      getNfts: () => Array.from(get().nftsMap.values()),
      getNft: (uniqueId: string) => get().nftsMap.get(uniqueId),
    }),
    shouldPersist ? {
      storageKey: `${debugPrefix}nftsByCollection`,
      version: 1,
    } : undefined
  );

  return {
    collectionsStore,
    nftsStore,
  };
}

// Create stores for the current user
export const {
  collectionsStore: useUserNftCollectionsStore,
  nftsStore: useUserNftsStore,
} = createNftStores({
  getAddress: ($) => $(userAssetsStoreManager, state => state.address || null),
  shouldPersist: true,
});

// Create stores for external profiles
export const {
  collectionsStore: useExternalNftCollectionsStore,
  nftsStore: useExternalNftsStore,
} = createNftStores({
  getAddress: ($) => $(useExternalProfileStore, state => state.externalProfile || null),
  shouldPersist: false,
  debugPrefix: 'external',
});