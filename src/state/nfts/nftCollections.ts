import { createQueryStore } from '../internal/createQueryStore';
import { fetchUserNftCollections, fetchUserNftsByCollection } from '@/resources/nfts';
import { time } from '@/utils';
import { userAssetsStoreManager } from '../assets/userAssetsStoreManager';
import { SignalFunction } from '../internal/signal';
import { useNftSortStore } from '@/hooks/useNFTsSortBy';
import { useExternalNftsStore, useExternalProfileStore } from './externalNfts';
import {
  NftCollectionsParams,
  NftCollectionsResponse,
  NftsByCollectionParams,
  NftsByCollectionResponse,
  UserNftCollectionsState,
  UserNftsState,
} from './types';
import { userNftsStoreManager, useUserNftsStore } from './userNfts';
import { UniqueAsset } from '@/entities/uniqueAssets';

export const { collectionsStore: useUserNftCollectionsStore } = createNftCollectionsStore({
  getAddress: $ => $(userAssetsStoreManager, state => state.address || null),
  shouldPersist: true,
});

export const { collectionsStore: useExternalNftCollectionsStore } = createNftCollectionsStore({
  getAddress: $ => $(useExternalProfileStore, state => state.externalProfile || null),
  shouldPersist: false,
});

function createNftCollectionsStore(config: {
  getAddress: (signal: SignalFunction) => ReturnType<typeof signal<string | null | undefined>>;
  shouldPersist: boolean;
}) {
  const { getAddress, shouldPersist } = config;

  const collectionsStore = createQueryStore<NftCollectionsResponse, NftCollectionsParams, UserNftCollectionsState>(
    {
      cacheTime: shouldPersist ? time.weeks(1) : time.days(1),
      fetcher: fetchUserNftCollections,
      params: {
        address: $ => getAddress($),
        sortBy: $ => $(useNftSortStore, s => s.getNftSort().sortBy),
        sortDirection: $ => $(useNftSortStore, s => s.getNftSort().sortDirection),
      },
      staleTime: time.minutes(10),
    },
    (set, get) => ({
      collections: new Map(),
      getActiveAddress: () => {
        const userAddress = userAssetsStoreManager.getState().address || '';
        const externalAddress = useExternalProfileStore.getState().externalProfile || '';
        return shouldPersist ? userAddress : externalAddress;
      },
      openFamilies: {},
      getCollections: () => {
        const data = get().getData();
        return data?.collections ? Array.from(data.collections.values()) : [];
      },
      getOpenFamilies: () => {
        const address = get().getActiveAddress();
        return get().openFamilies[address];
      },
      updateOpenFamilies: updates => {
        const address = get().getActiveAddress();
        set(state => ({
          ...state,
          openFamilies: {
            ...state.openFamilies,
            [address]: {
              ...state.openFamilies[address],
              ...updates,
            },
          },
        }));
      },
      getUserOpenFamilies: () => {
        const address = get().getActiveAddress();
        return get().getOpenFamilies(address) || {};
      },
      getUserExpandedFamilies: () => {
        const openFamilies = get().getUserOpenFamilies();
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
    shouldPersist
      ? {
          storageKey: `nftCollections`,
          version: 0,
        }
      : undefined
  );

  const openCollectionNftsStore = createQueryStore<NftsByCollectionResponse, NftsByCollectionParams, UserNftsState>(
    {
      abortInterruptedFetches: false,
      cacheTime: shouldPersist ? time.weeks(1) : time.days(1),
      enabled: $ => $(userNftsStoreManager, s => !s.hasCompletedInitialFetch || !shouldPersist),
      fetcher: fetchUserNftsByCollection,
      keepPreviousData: true,
      params: {
        address: $ => getAddress($),
        collectionId: $ => $(collectionsStore, s => s.getUserExpandedCollectionIds()),
      },
      setData: ({ data: { nfts }, set }) => set(state => ({ ...state, nftsMap: nfts })),
      onFetched: ({ data, params }) => {
        const addressFromParams = params.address;
        const addressFromStore = shouldPersist
          ? userAssetsStoreManager.getState().address
          : useExternalProfileStore.getState().externalProfile;
        const storeToUse = shouldPersist ? useUserNftsStore : useExternalNftsStore;
        if (addressFromParams === addressFromStore) {
          storeToUse.setState({
            nftsMap: new Map([...storeToUse.getState().nftsMap, ...data.nfts]),
          });
        }
      },
      staleTime: time.minutes(10),
    },
    (_, get) => ({
      nfts: [],
      nftsMap: new Map<string, UniqueAsset>(),
      getNfts: () => Array.from(get().nftsMap.values()),
      getNft: (uniqueId: string) => get().nftsMap.get(uniqueId),
      getNftsForSale: () => get().nfts.filter(nft => nft.currentPrice),
    }),
    shouldPersist
      ? {
          storageKey: `nftsByCollection`,
          version: 0,
        }
      : undefined
  );

  return {
    collectionsStore,
    openCollectionNftsStore,
  };
}
