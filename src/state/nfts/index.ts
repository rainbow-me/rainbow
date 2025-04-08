import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { UniqueAsset } from '@/entities';
import { createQueryStore } from '../internal/createQueryStore';
import { fetchUserNftCollections, fetchUserNfts, fetchUserNftsByCollection } from '@/resources/nfts';
import { time } from '@/utils';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { UniqueAssetFamily } from '@/entities/uniqueAssets';

import { userAssetsStoreManager } from '../assets/userAssetsStoreManager';
import { useNftSortStore } from '@/hooks/useNFTsSortBy';
import { useOpenFamiliesStore } from '@/hooks/useOpenFamilies';

export type UserNftsParams = { address?: string | null; sortBy: NftCollectionSortCriterion; sortDirection: SortDirection };
export type UserNftsResponse = {
  address?: string;
  nfts: UniqueAsset[];
  nftsMap: Map<string, UniqueAsset>;
};
type UserNftsState = {
  nfts: UniqueAsset[];
  nftsMap: Map<string, UniqueAsset>;
  getNft: (uniqueId: string) => UniqueAsset | undefined;
};

export const useUserNftsStore = createQueryStore<UserNftsResponse, UserNftsParams, UserNftsState>(
  {
    enabled: $ => $(userAssetsStoreManager, s => !!s.address),
    cacheTime: time.hours(1),
    fetcher: fetchUserNfts,
    keepPreviousData: true,
    params: {
      address: $ => $(userAssetsStoreManager).address,
      sortBy: $ => $(useNftSortStore, s => s.getNftSort().sortBy),
      sortDirection: $ => $(useNftSortStore, s => s.getNftSort().sortDirection),
    },
    staleTime: time.minutes(10),
  },
  (_, get) => ({
    nfts: [],
    nftsMap: new Map<string, UniqueAsset>(),
    getNft: (uniqueId: string) => {
      return get()?.getData()?.nftsMap.get(uniqueId);
    },
  }),
  {
    storageKey: `userNfts`,
    version: 1,
  }
);

type ExternalProfileStore = {
  externalProfile: string | null;
  setExternalProfile: (externalProfile: string) => void;
};

export const useExternalProfileStore = createRainbowStore<ExternalProfileStore>(set => ({
  externalProfile: null,
  setExternalProfile: (externalProfile: string) => {
    set({ externalProfile });
  },
}));

type ExternalNftsState = {
  nfts: UniqueAsset[];
  nftsMap: Map<string, UniqueAsset>;
  getNft: (uniqueId: string) => UniqueAsset | undefined;
  getNfts: (address: string) => UniqueAsset[] | undefined;
};

export const externalNftsStore = createQueryStore<UserNftsResponse, UserNftsParams, ExternalNftsState>(
  {
    enabled: $ => $(useExternalProfileStore, s => s.externalProfile !== null),
    cacheTime: time.days(1),
    fetcher: fetchUserNfts,
    params: {
      address: $ => $(useExternalProfileStore).externalProfile,
      sortBy: NftCollectionSortCriterion.MostRecent,
      sortDirection: SortDirection.Desc,
    },
    staleTime: time.days(1),
  },
  (_, get) => ({
    nfts: [],
    nftsMap: new Map<string, UniqueAsset>(),
    getNft: (uniqueId: string) => {
      return get()?.getData()?.nftsMap.get(uniqueId);
    },
    getNfts: (address: string) => {
      const externalProfile = useExternalProfileStore.getState().externalProfile;
      if (externalProfile !== address) {
        useExternalProfileStore.getState().setExternalProfile(address);
      }
      return get()?.getData()?.nfts;
    },
  })
);

type UserNftCollectionsParams = {
  address?: string | null;
  sortBy: NftCollectionSortCriterion;
  sortDirection: SortDirection;
};

type UserNftCollectionsResponse = {
  collections: Map<string, UniqueAssetFamily>;
};

type UserNftCollectionsState = {
  collections: Map<string, UniqueAssetFamily>;
  getCollections: () => UniqueAssetFamily[] | undefined;
  getOpenCollections: () => UniqueAssetFamily[] | undefined;
};

export const useUserNftCollectionsStore = createQueryStore<UserNftCollectionsResponse, UserNftCollectionsParams, UserNftCollectionsState>(
  {
    enabled: $ => $(userAssetsStoreManager, s => s.address !== ''),
    cacheTime: time.weeks(1),
    fetcher: fetchUserNftCollections,
    debugMode: true,
    params: {
      address: $ => $(userAssetsStoreManager).address,
      sortBy: $ => $(useNftSortStore, s => s.getNftSort().sortBy),
      sortDirection: $ => $(useNftSortStore, s => s.getNftSort().sortDirection),
    },
    staleTime: time.minutes(10),
  },
  (set, get) => ({
    collections: new Map<string, UniqueAssetFamily>(),
    getCollections: () => {
      const collections = get()?.getData()?.collections;
      return (collections ? Array.from(collections.values()) : []) as UniqueAssetFamily[];
    },
    getOpenCollections: () => {
      const openFamilies = useOpenFamiliesStore.getState().getOpenFamilyNames();
      const collections = get()?.getCollections();
      const c = collections?.filter(collection => openFamilies.includes(collection.familyName));
      return c;
    },
  })
);

type ExternalNftCollectionsState = {
  collections: Map<string, UniqueAssetFamily>;
  getCollections: (address: string) => UniqueAssetFamily[] | undefined;
};

export const useExternalNftCollectionsStore = createQueryStore<
  UserNftCollectionsResponse,
  UserNftCollectionsParams,
  ExternalNftCollectionsState
>(
  {
    enabled: $ => $(useExternalProfileStore, s => s.externalProfile !== null),
    cacheTime: time.weeks(1),
    fetcher: fetchUserNftCollections,
    params: {
      address: $ => $(useExternalProfileStore).externalProfile,
      sortBy: NftCollectionSortCriterion.MostRecent,
      sortDirection: SortDirection.Desc,
    },
    staleTime: time.minutes(10),
  },
  (set, get) => ({
    collections: new Map<string, UniqueAssetFamily>(),
    getCollections: (address: string) => {
      const externalProfile = useExternalProfileStore.getState().externalProfile;

      if (externalProfile !== address) {
        useExternalProfileStore.getState().setExternalProfile(address);
      }

      const collections = get()?.getData()?.collections;
      return (collections ? Array.from(collections.values()) : []) as UniqueAssetFamily[];
    },
  })
);
