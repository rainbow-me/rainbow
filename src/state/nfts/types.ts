import { type QueryStoreState, type Store } from '@storesjs/stores';

import { type UniqueAsset } from '@/entities/uniqueAssets';
import { type GetNftCollectionsQuery } from '@/graphql/__generated__/arc';

type CollectionPage = GetNftCollectionsQuery['nftCollections'];
export type Collection = NonNullable<CollectionPage['data'][number]>;

/** Owned NFTs in the order returned by the collection endpoint. */
export type CollectionNfts = Map<string, UniqueAsset>;

/** Independent query keys for an account's summary and member pages. */
export type NftRequest = { type: 'page'; pageKey: string | null } | { type: 'collection'; id: string };
export type NftParams = { request: NftRequest };

/** Identifies where each Arc response belongs in the account. */
export type NftResponse =
  | { type: 'page'; page: CollectionPage; pageKey: string | null }
  | { type: 'collection'; id: string; assets: CollectionNfts };

/** Collection summaries, owned pages and expansion choices for one wallet. */
export interface NftsState {
  address: string;
  collections: Map<string, Collection>;
  collectionNfts: Map<string, CollectionNfts>;
  nextPageKey: string | null;
  lastPageFetchedAt: number;
  openCollections: ReadonlySet<string>;
  /** Restarts from the first page before using an expired cursor. */
  fetchNextPage: () => Promise<void>;
  fetchOpenCollections: (force?: boolean) => Promise<void>;
  openCollection: (id: string) => void;
  toggleCollection: (id: string) => void;
  refresh: () => Promise<void>;
  /** Discards the member page and expires the first summary page. Reloads both for the selected wallet. */
  invalidateCollection: (collectionId: string) => void;
}

export type NftsQueryState = QueryStoreState<NftResponse, NftParams, NftsState>;
export type NftsStoreType = Store<NftsQueryState>;
