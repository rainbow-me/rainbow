import { UniqueAsset } from '@/entities';
import { UniqueAssetFamily } from '@/entities/uniqueAssets';
import { SortDirection, NftCollectionSortCriterion } from '@/graphql/__generated__/arc';
import { createQueryStore } from '../internal/createQueryStore';

export type UserNftsParams = { address: string | null; sortBy: NftCollectionSortCriterion; sortDirection: SortDirection };

export type UserNftsResponse = {
  nfts: UniqueAsset[];
  nftsMap: Map<string, UniqueAsset>;
};

export type UserNftsState = {
  nftsMap: Map<string, UniqueAsset>;
  nfts: UniqueAsset[];
  getNfts: () => UniqueAsset[];
  getNft: (uniqueId: string) => UniqueAsset | undefined;
  getNftsForSale: () => UniqueAsset[];
  getSendableUniqueTokens: () => UniqueAsset[];
};

export type UserNftCollectionsState = {
  collections: Map<string, UniqueAssetFamily>;
  getActiveAddress: () => string;
  getCollections: () => UniqueAssetFamily[];
  openFamilies: Record<string, Record<string, boolean>>;
  getOpenFamilies: (address?: string) => Record<string, boolean>;
  updateOpenFamilies: (updates: Record<string, boolean>) => void;
  getUserOpenFamilies: () => Record<string, boolean>;
  getUserExpandedFamilies: () => string[];
  getUserExpandedCollectionIds: () => string | undefined;
};

export type OpenNftCollectionsState = {
  nftsMap: Map<string, UniqueAsset>;
  nfts: UniqueAsset[];
};

export type NftsByCollectionParams = {
  address?: string | null;
  collectionId?: string;
};

export type NftsByCollectionResponse = {
  nfts: Map<string, UniqueAsset>;
};

export type NftCollectionsParams = {
  address?: string | null;
  sortBy: NftCollectionSortCriterion;
  sortDirection: SortDirection;
};

export type NftCollectionsResponse = {
  collections: Map<string, UniqueAssetFamily>;
};

export type UserNftsStoreType = ReturnType<typeof createQueryStore<UserNftsResponse, UserNftsParams, UserNftsState, UserNftsResponse>>;

export type QueryEnabledUserNftsState = ReturnType<UserNftsStoreType['getState']>;
