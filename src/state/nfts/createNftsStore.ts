import { createQueryStore, getQueryKey, type SetDataParams } from '@storesjs/stores';

import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { time } from '@/framework/core/utils/time';
import { arcClient } from '@/graphql';
import { parseUniqueAsset } from '@/resources/nfts/utils';

import { NFTS_PAGE_SIZE, NFTS_PAGINATION_STALE_TIME, NFTS_STALE_TIME } from './constants';
import {
  type Collection,
  type CollectionNfts,
  type NftParams,
  type NftRequest,
  type NftResponse,
  type NftsState,
  type NftsStoreType,
} from './types';

// ============ Query Keys and Limits ========================================== //

const MAX_OPEN_COLLECTIONS = 20;
const FIRST_PAGE = { request: { type: 'page', pageKey: null } } as const;
const FIRST_PAGE_KEY = getQueryKey(FIRST_PAGE);

// ============ Account NFT Store ============================================== //

/**
 * Loads collection summaries and owned NFTs for one wallet. Addressed edits to an
 * inactive wallet use a disabled instance and do not start a request.
 */
export function createNftsStore(address: string, enabled = !!address): NftsStoreType {
  const store: NftsStoreType = createQueryStore<NftResponse, NftParams, NftsState>(
    {
      enabled,
      keepPreviousData: true,
      params: FIRST_PAGE,
      staleTime: NFTS_STALE_TIME,
      fetcher: ({ request }, abortController) => fetchNfts(address, request, abortController),
      setData: setNftData,
      onFetched: ({ data }) => {
        if (data.type === 'page') void store.getState().fetchOpenCollections();
      },
    },

    (set, get) => {
      function updateExpansion(key: string, action: 'open' | 'toggle'): void {
        const state = get();
        const id = key.toLowerCase();
        const wasOpen = state.openCollections.has(id);
        if (wasOpen && action === 'open') return;

        const openCollections = new Set(state.openCollections);
        if (wasOpen) {
          openCollections.delete(id);
        } else {
          openCollections.add(id);
          limitOpenCollections(openCollections);
        }

        set({ openCollections });
        if (!wasOpen && state.enabled && state.collections.has(id)) void state.fetch(collectionRequest(id));
      }

      return {
        address,
        collections: new Map(),
        collectionNfts: new Map(),
        nextPageKey: null,
        lastPageFetchedAt: 0,
        openCollections: new Set(['showcase']),

        fetchNextPage: async () => {
          const state = get();
          if (!state.nextPageKey) return;
          if (!state.getCacheEntry(FIRST_PAGE_KEY)?.lastFetchedAt || Date.now() - state.lastPageFetchedAt > NFTS_PAGINATION_STALE_TIME) {
            const firstPage = await state.fetch(FIRST_PAGE, { force: true });
            if (!firstPage) return;
          }

          const pageKey = get().nextPageKey;
          if (pageKey) await state.fetch({ request: { type: 'page', pageKey } }, { force: true });
        },

        fetchOpenCollections: async (force = false) => {
          const state = get();
          const requests: Promise<unknown>[] = [];
          for (const id of state.openCollections) {
            if (!state.collections.has(id)) continue;
            requests.push(state.fetch(collectionRequest(id), { force }));
          }
          await Promise.all(requests);
        },

        openCollection: key => updateExpansion(key, 'open'),
        toggleCollection: key => updateExpansion(key, 'toggle'),

        refresh: async () => {
          const state = get();
          await Promise.all([state.fetch(FIRST_PAGE, { staleTime: time.seconds(5) }), state.fetchOpenCollections(true)]);
        },

        invalidateCollection: collectionId => {
          const state = get();
          const id = collectionId.toLowerCase();
          const params = collectionRequest(id);
          const queryCache = { ...state.queryCache };
          delete queryCache[FIRST_PAGE_KEY];
          delete queryCache[getQueryKey(params)];

          const collectionNfts = new Map(state.collectionNfts);
          collectionNfts.delete(id);
          set({ collectionNfts, queryCache });

          if (state.enabled) {
            void state.fetch(FIRST_PAGE);
            void state.fetch(params);
          }
        },
      };
    },

    address
      ? {
          storageKey: `accountNfts_${address}`,
          partialize: ({ collections, collectionNfts, openCollections, nextPageKey, lastPageFetchedAt }) => ({
            collections,
            collectionNfts,
            openCollections,
            nextPageKey,
            lastPageFetchedAt,
          }),
        }
      : undefined
  );

  return store;
}

// ============ Fetching and Publication ======================================== //

async function fetchNfts(walletAddress: string, request: NftRequest, abortController: AbortController | null): Promise<NftResponse> {
  if (request.type === 'page') {
    const { nftCollections } = await arcClient.getNftCollections(
      { walletAddress, limit: NFTS_PAGE_SIZE, pageKey: request.pageKey },
      { abortController }
    );
    return { type: 'page', page: nftCollections, pageKey: request.pageKey };
  }

  const { nftsByCollection } = await arcClient.getNftsByCollection({ walletAddress, collectionId: request.id }, { abortController });
  const chainIds = useBackendNetworksStore.getState().getChainsIdByName();
  const assets: CollectionNfts = new Map();
  for (const nft of nftsByCollection) {
    const asset = parseUniqueAsset(nft, chainIds);
    assets.set(asset.uniqueId, asset);
  }
  return { type: 'collection', id: request.id, assets };
}

function setNftData({ data, set }: SetDataParams<NftResponse, NftParams, NftsState>): void {
  if (data.type === 'collection') {
    set(state => ({ collectionNfts: new Map(state.collectionNfts).set(data.id, data.assets) }));
    return;
  }

  set(state => {
    const collections = data.pageKey ? new Map(state.collections) : new Map<string, Collection>();
    for (const collection of data.page.data) {
      if (collection) collections.set(collection.id.toLowerCase(), collection);
    }
    return { collections, nextPageKey: data.page.nextPageKey || null, lastPageFetchedAt: Date.now() };
  });
}

function collectionRequest(id: string): NftParams {
  return { request: { type: 'collection', id } };
}

// ============ Collection Preferences ========================================== //

function limitOpenCollections(open: Set<string>): void {
  const savedGroups = Number(open.has('showcase')) + Number(open.has('hidden'));
  if (open.size - savedGroups <= MAX_OPEN_COLLECTIONS) return;

  for (const id of open) {
    if (id === 'showcase' || id === 'hidden') continue;
    open.delete(id);
    return;
  }
}
