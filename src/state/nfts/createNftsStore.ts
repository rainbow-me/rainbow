import { createQueryStore } from '@storesjs/stores';
import { type Address } from 'viem';

import { arcClient } from '@/graphql';

import { NFTS_PAGE_SIZE, NFTS_PAGINATION_STALE_TIME, NFTS_STALE_TIME } from './constants';
import {
  type Collection,
  type FetchedNftCollections,
  type NftParams,
  type NftsState,
  type NftsStoreType,
  type PersistedNftsState,
} from './types';

/**
 * Queries and persists an account's collection summaries and pagination cursor.
 */
export function createNftsStore(address: Address | string): NftsStoreType {
  return createQueryStore<FetchedNftCollections, NftParams, NftsState, FetchedNftCollections, PersistedNftsState>(
    {
      fetcher: fetchNftCollections,
      setData: ({ data, params, set }) => {
        if (data) set(state => setNftCollections(state, data, params.pageKey));
      },
      enabled: address.length > 0,
      keepPreviousData: true,
      params: { walletAddress: address, limit: NFTS_PAGE_SIZE, pageKey: null },
      staleTime: NFTS_STALE_TIME,
    },

    (_, get) => ({
      collections: new Map(),
      lastPageFetchedAt: 0,
      nextPageKey: null,

      fetchNextNftCollectionPage: async () => {
        const state = get();
        if (!state.nextPageKey) return;

        if (Date.now() - state.lastPageFetchedAt > NFTS_PAGINATION_STALE_TIME) {
          const firstPage = await state.fetch({ pageKey: null }, { force: true });
          if (!firstPage) return;
        }

        const pageKey = get().nextPageKey;
        if (pageKey) await get().fetch({ pageKey }, { force: true });
      },

      hasNextNftCollectionPage: () => !!get().nextPageKey,
    }),

    address.length
      ? {
          storageKey: `nfts_${address}`,
          version: 3,
          partialize: state => ({
            collections: state.collections,
            lastPageFetchedAt: state.lastPageFetchedAt,
            nextPageKey: state.nextPageKey,
          }),
        }
      : undefined
  );
}

// ============ Fetching and Publication ======================================== //

async function fetchNftCollections(params: NftParams, abortController: AbortController | null): Promise<FetchedNftCollections> {
  const data = await arcClient.getNftCollections(params, { abortController });
  return data.nftCollections;
}

/**
 * Replaces the first page or appends a continuation, publishing its cursor with the summaries.
 */
function setNftCollections(
  state: NftsState,
  data: NonNullable<FetchedNftCollections>,
  pageKey: string | null
): Pick<NftsState, 'collections' | 'nextPageKey' | 'lastPageFetchedAt'> {
  const collections = pageKey ? new Map(state.collections) : new Map<string, Collection>();
  for (const collection of data.data) {
    if (collection) collections.set(collection.id.toLowerCase(), collection);
  }

  return { collections, nextPageKey: data.nextPageKey || null, lastPageFetchedAt: Date.now() };
}
