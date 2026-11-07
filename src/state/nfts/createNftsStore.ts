import { createQueryStore } from '@storesjs/stores';
import { type Address } from 'viem';

import { type UniqueAsset } from '@/entities/uniqueAssets';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { parseUniqueId } from '@/features/nfts/core/uniqueId';
import { fetchHiddenTokens } from '@/features/nfts/data/hiddenNftsStore';
import { fetchShowcaseTokens } from '@/features/nfts/data/showcaseStore';
import { time } from '@/framework/core/utils/time';
import { arcClient } from '@/graphql';
import { type GetNftsByCollectionQuery } from '@/graphql/__generated__/arc';
import { logger, RainbowError } from '@/logger';
import { parseUniqueAsset } from '@/resources/nfts/utils';

import { pruneStaleAndClosedCollections } from './collectionPruning';
import { NFTS_PAGE_SIZE, NFTS_PAGINATION_STALE_TIME, NFTS_PRUNE_INTERVAL, NFTS_STALE_TIME } from './constants';
import {
  type Collection,
  type CollectionId,
  type NftParams,
  type NftsQueryData,
  type NftsState,
  type NftsStoreType,
  type PersistedNftsState,
  type UniqueId,
} from './types';
import { replaceEthereumWithMainnet } from './utils';

const MAX_RETRIES = 3;

/** Creates the account's summary query and parsed NFT state. */
export function createNftsStore(address: Address | string): NftsStoreType {
  const collectionRequests = new Map<CollectionId, Promise<void>>();
  let paginationPromise: Promise<void> | null = null;
  let lastPruneAt = 0;

  return createQueryStore<NftsQueryData, NftParams, NftsState, NftsQueryData, PersistedNftsState>(
    {
      fetcher: fetchNftData,
      setData: ({ data, params, set }) => {
        if (data.kind !== 'page') return;
        set(state => ({
          collections: mergeCollectionSummaries(state.collections, data.collections, !params.pageKey),
          fetchedPages: params.pageKey ? { ...state.fetchedPages, [params.pageKey]: Date.now() } : { initial: Date.now() },
          pagination: data.pagination,
        }));
      },
      enabled: address.length > 0,
      retryDelay: time.minutes(5),
      cacheTime: time.hours(1),
      abortInterruptedFetches: false,
      params: { walletAddress: address, limit: NFTS_PAGE_SIZE, pageKey: null },
      staleTime: NFTS_STALE_TIME,
    },
    (set, get) => ({
      collections: new Map(),
      nfts: new Map(),
      fetchedPages: {},
      pagination: null,
      async fetchNextNftCollectionPage() {
        if (paginationPromise) {
          return paginationPromise;
        }

        const { fetchedPages, fetch, getNftPaginationInfo, collections } = get();
        const paginationInfo = getNftPaginationInfo();
        const nextPageKey = paginationInfo?.pageKey ?? null;
        const hasNextPage = nextPageKey !== null && paginationInfo?.hasNext;

        // If we have collections but no fetchedPages, it means we loaded from cache
        // Set an initial timestamp to prevent immediate refetch
        const currentFetchedPages = { ...fetchedPages };
        if (collections.size > 0 && Object.keys(currentFetchedPages).length === 0) {
          currentFetchedPages.initial = Date.now() - NFTS_PAGINATION_STALE_TIME / 2; // Set to half stale time ago
          set({ fetchedPages: currentFetchedPages });
        }

        if (hasNextPage) {
          const now = Date.now();

          // Check if the last pagination fetch is stale
          // We need to check when we last fetched ANY page, not the specific nextPageKey
          // The most recent fetch time is the maximum of all fetch times
          const lastFetchTime =
            Object.values(currentFetchedPages).length > 0 ? Math.max(...Object.values(currentFetchedPages)) : currentFetchedPages.initial;

          const isPageKeyStale = lastFetchTime ? now - lastFetchTime > NFTS_PAGINATION_STALE_TIME : true; // Default to stale if no timestamp

          // Clean up old pageKey timestamps (older than 1 minute) to prevent memory leaks
          const cleanedFetchedPages = Object.entries(currentFetchedPages).reduce(
            (acc, [key, timestamp]) => {
              if (now - timestamp < time.minutes(1)) {
                acc[key] = timestamp;
              }
              return acc;
            },
            {} as typeof currentFetchedPages
          );

          if (!isPageKeyStale) {
            // Try to fetch with the current pageKey
            paginationPromise = fetch({ pageKey: nextPageKey, limit: NFTS_PAGE_SIZE }, { force: true, skipStoreUpdates: true })
              .then(data => {
                if (data?.kind !== 'page') return;
                const { collections } = get();
                set({
                  collections: collections ? mergeCollectionSummaries(collections, data.collections) : data.collections,
                  fetchedPages: { ...cleanedFetchedPages, [nextPageKey]: Date.now() },
                  pagination: data.pagination,
                });
              })
              .catch(async () => {
                // If the pageKey is expired or invalid, refetch from the beginning
                const data = await fetch({ pageKey: null, limit: NFTS_PAGE_SIZE }, { force: true, skipStoreUpdates: true });
                if (data?.kind !== 'page') return;

                // Set initial data
                set({
                  collections: mergeCollectionSummaries(get().collections, data.collections, true),
                  fetchedPages: { initial: now },
                  pagination: data.pagination,
                });

                // If there's a next page, fetch it immediately
                if (data.pagination?.hasNext && data.pagination?.pageKey) {
                  const nextPageData = await fetch(
                    { pageKey: data.pagination.pageKey, limit: NFTS_PAGE_SIZE },
                    { force: true, skipStoreUpdates: true }
                  );

                  if (nextPageData?.kind === 'page') {
                    const { collections } = get();
                    set({
                      collections: collections ? new Map([...collections, ...nextPageData.collections]) : nextPageData.collections,
                      fetchedPages: { initial: now, [data.pagination.pageKey]: now },
                      pagination: nextPageData.pagination,
                    });
                  }
                }
              })
              .finally(() => {
                paginationPromise = null;
              });

            return paginationPromise;
          }

          // PageKey is stale, refetch from the beginning and then fetch next page
          paginationPromise = fetch({ pageKey: null, limit: NFTS_PAGE_SIZE }, { force: true, skipStoreUpdates: true })
            .then(async data => {
              if (data?.kind !== 'page') return;

              // Set initial data
              set({
                collections: mergeCollectionSummaries(get().collections, data.collections, true),
                fetchedPages: { initial: now },
                pagination: data.pagination,
              });

              // If there's a next page, fetch it immediately
              if (data.pagination?.hasNext && data.pagination?.pageKey) {
                const nextPageData = await fetch(
                  { pageKey: data.pagination.pageKey, limit: NFTS_PAGE_SIZE },
                  { force: true, skipStoreUpdates: true }
                );

                if (nextPageData?.kind === 'page') {
                  const { collections } = get();
                  set({
                    collections: collections ? new Map([...collections, ...nextPageData.collections]) : nextPageData.collections,
                    fetchedPages: { initial: now, [data.pagination.pageKey]: now },
                    pagination: nextPageData.pagination,
                  });
                }
              }
            })
            .finally(() => {
              paginationPromise = null;
            });

          return paginationPromise;
        }
      },

      fetchNftCollection(collectionId, force = false) {
        if (!address) return Promise.resolve();
        const id = collectionId.toLowerCase();
        const pending = collectionRequests.get(id);
        if (pending && !force) return pending;

        const now = Date.now();
        if (now - lastPruneAt >= NFTS_PRUNE_INTERVAL) {
          lastPruneAt = now;
          void pruneStaleAndClosedCollections({ address, set });
        }
        if (!force && get().collections.get(id)?.nfts) return Promise.resolve();

        // Register before preference reads begin. The existing request's identity also
        // prevents an older forced fetch from replacing its successor's publication.
        const request = Promise.resolve()
          .then(async () => {
            const category = id === 'showcase' || id === 'hidden' ? id : null;
            const ids =
              category === 'showcase'
                ? await fetchShowcaseTokens({ address })
                : category === 'hidden'
                  ? await fetchHiddenTokens({ address })
                  : null;
            if (category && (!ids?.length || (!force && ids.every(uniqueId => get().nfts.has(uniqueId.toLowerCase()))))) return;

            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
              try {
                const data = await get().fetch(
                  { collectionId: id },
                  { force, skipStoreUpdates: true, cacheTime: time.infinity, staleTime: time.infinity }
                );
                if (data?.kind !== 'tokens') return;
                const { nfts } = data;
                if (collectionRequests.get(id) !== request) return;

                set(state => {
                  const nextNfts = nfts.size ? new Map([...state.nfts, ...nfts]) : state.nfts;
                  if (category) return nextNfts === state.nfts ? state : { nfts: nextNfts };

                  const collection = state.collections.get(id);
                  // A response for a removed/unlisted collection can supply metadata,
                  // but it cannot manufacture a collection summary.
                  if (!collection) return nextNfts === state.nfts ? state : { nfts: nextNfts };
                  return {
                    nfts: nextNfts,
                    collections: new Map(state.collections).set(id, {
                      ...collection,
                      nfts: { ids: [...nfts.keys()], fetchedAt: Date.now() },
                    }),
                  };
                });
                return;
              } catch (error) {
                logger.error(new RainbowError('Failed to fetch NFT collection', error), { collectionId: id, address, attempt });
              }
            }
          })
          .finally(() => {
            if (collectionRequests.get(id) === request) collectionRequests.delete(id);
          });
        collectionRequests.set(id, request);
        return request;
      },

      getNftCollections: () => get().collections,
      getNftCollection: collectionId => get().collections.get(collectionId.toLowerCase()) ?? null,
      getNftByUniqueId: uniqueId => get().nfts.get(uniqueId.toLowerCase()) ?? null,
      getNft: (collectionId, index) => {
        const state = get();
        const id = state.collections.get(collectionId.toLowerCase())?.nfts?.ids[index];
        return id === undefined ? null : (state.nfts.get(id) ?? null);
      },
      getNftPaginationInfo: () => get().pagination,
      hasNextNftCollectionPage: () => get().pagination?.hasNext ?? false,
      getCurrentNftCollectionPageKey: () => get().pagination?.pageKey ?? null,
      getNextNftCollectionPageKey: () => (get().pagination?.hasNext ? (get().pagination?.pageKey ?? null) : null),
    }),
    address.length
      ? {
          storageKey: `nfts_${address}`,
          version: 2,
          partialize: state => ({
            collections: state.collections,
            nfts: state.nfts,
            fetchedPages: state.fetchedPages,
            pagination: state.pagination,
          }),
          migrate: state => {
            const nfts = new Map<UniqueId, UniqueAsset>();
            for (const collection of state.nftsByCollection?.values() ?? []) {
              for (const [id, nft] of collection) nfts.set(id, nft);
            }
            return { collections: state.collections, nfts, fetchedPages: state.fetchedPages, pagination: state.pagination };
          },
        }
      : undefined
  );
}

function parseNfts(data: GetNftsByCollectionQuery['nftsByCollection']): Map<UniqueId, UniqueAsset> {
  const chainIds = useBackendNetworksStore.getState().getChainsIdByName();
  const nfts = new Map<UniqueId, UniqueAsset>();
  for (const nft of data) nfts.set(nft.uniqueId.toLowerCase(), parseUniqueAsset(nft, chainIds));
  return nfts;
}

async function fetchMetadata(address: Address | string, ids: UniqueId[]): Promise<Map<UniqueId, UniqueAsset>> {
  const tokens: Record<string, { contractAddress: string; tokenId: string }[]> = {};
  for (const id of ids) {
    const { network, contractAddress, tokenId } = parseUniqueId(id);
    const networkName = replaceEthereumWithMainnet(network);
    if (!networkName || !contractAddress || !tokenId) continue;
    (tokens[networkName] ??= []).push({ contractAddress, tokenId });
  }
  const data = await arcClient.getNftsMetadata({ walletAddress: address, tokens });
  return parseNfts(data.getNftsMetadata ?? []);
}

function mergeCollectionSummaries(
  current: Map<CollectionId, Collection>,
  incoming: Map<CollectionId, Collection>,
  replace = false
): Map<CollectionId, Collection> {
  const collections = replace ? new Map<CollectionId, Collection>() : new Map(current);
  for (const [id, collection] of incoming) {
    const nfts = current.get(id)?.nfts;
    collections.set(id, nfts && nfts.ids.length === Number(collection.totalCount) ? { ...collection, nfts } : collection);
  }
  return collections;
}

async function fetchNftData(params: NftParams): Promise<NftsQueryData> {
  const { walletAddress, collectionId } = params;
  if (collectionId === 'showcase' || collectionId === 'hidden') {
    const ids =
      collectionId === 'showcase'
        ? await fetchShowcaseTokens({ address: walletAddress })
        : await fetchHiddenTokens({ address: walletAddress });
    return { kind: 'tokens', nfts: await fetchMetadata(walletAddress, ids ?? []) };
  }
  if (collectionId) {
    const data = await arcClient.getNftsByCollection({ walletAddress, collectionId });
    return { kind: 'tokens', nfts: parseNfts(data.nftsByCollection) };
  }
  const data = await arcClient.getNftCollections(params);
  const response = data.nftCollections;
  return {
    kind: 'page',
    collections: new Map(response?.data.filter(item => item !== null).map(item => [item.id.toLowerCase(), item])),
    pagination: response
      ? {
          pageKey: response.nextPageKey || null,
          hasNext: !!response.nextPageKey,
          total_elements: response.totalCollections,
        }
      : null,
  };
}
