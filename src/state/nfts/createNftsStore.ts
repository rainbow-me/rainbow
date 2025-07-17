import { Address } from 'viem';
import { arcClient } from '@/graphql';
import { logger, RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils';
import { NftsState, NftParams, NftsQueryData, PaginationInfo, CollectionId, UniqueId, Collection } from './types';
import { parseUniqueAsset, parseUniqueId } from '@/resources/nfts/utils';
import { useBackendNetworksStore } from '../backendNetworks/backendNetworks';
import { IS_DEV } from '@/env';
import { getShowcase } from '@/hooks/useFetchShowcaseTokens';
import { getHidden } from '@/hooks/useFetchHiddenTokens';
import {
  getHiddenAndShowcaseCollectionIds,
  mergeMaps,
  migrateTokens,
  pruneStaleAndClosedCollections,
  replaceEthereumWithMainnet,
} from '@/state/nfts/utils';
import { UniqueAsset } from '@/entities';
import { useNftsStore } from '@/state/nfts/nfts';
import { isEmpty } from 'lodash';
import { updateWebHidden, updateWebShowcase } from '@/helpers/webData';
import { getIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import { useOpenCollectionsStore } from '@/state/nfts/openCollectionsStore';

export const PAGE_SIZE = 12;
export const STALE_TIME = time.minutes(10);
export const PAGINATION_STALE_TIME = time.seconds(30);
export const TIME_BETWEEN_PRUNES = time.minutes(10);
const MAX_RETRIES = 3;

const EMPTY_RETURN_DATA: NftsQueryData = {
  collections: new Map(),
  nftsByCollection: new Map(),
  pagination: null,
};

const uninitialized = Symbol();
let paginationPromise: { address: Address | string; promise: Promise<void> } | null = null;
const collectionsPromises: Map<Address | string, Map<string, Promise<void>>> = new Map();
let prunePromise: { address: Address | string; promise: Promise<void>; lastPruneAt: number } | null = null;

const fetchMultipleCollectionNfts = async (collectionId: string, walletAddress: string, isMigration = false): Promise<NftsQueryData> => {
  let tokensForCategory: string[] = [];

  if (collectionId === 'showcase') {
    tokensForCategory = (await getShowcase(walletAddress, isMigration)) || [];
  } else if (collectionId === 'hidden') {
    tokensForCategory = (await getHidden(walletAddress, isMigration)) || [];
  }

  if (isMigration) {
    tokensForCategory = (await migrateTokens(walletAddress, tokensForCategory)) || [];
  }

  const tokens = tokensForCategory
    .map((token: string) => parseUniqueId(token))
    .filter(p => p.network && p.contractAddress && p.tokenId)
    .reduce(
      (acc, curr) => {
        const network = replaceEthereumWithMainnet(curr.network);
        if (!network) {
          return acc;
        }

        acc[network] ||= [];
        acc[network].push({
          contractAddress: curr.contractAddress,
          tokenId: curr.tokenId,
        });
        return acc;
      },
      {} as Record<string, { contractAddress: string; tokenId: string }[]>
    );

  const chainIds = useBackendNetworksStore.getState().getChainsIdByName();
  const response = await arcClient.getNftsMetadata({ tokens, walletAddress });

  if (!response.getNftsMetadata) {
    return EMPTY_RETURN_DATA;
  }

  const nftsByCollection = new Map();

  response.getNftsMetadata.forEach(item => {
    const { network, contractAddress } = parseUniqueId(item.uniqueId);
    const collectionId = `${network}_${contractAddress}`.toLowerCase();
    const uniqueAsset = parseUniqueAsset(item, chainIds);

    const existingCollection = nftsByCollection.get(collectionId);
    if (existingCollection) {
      existingCollection.set(item.uniqueId.toLowerCase(), uniqueAsset);
    } else {
      const newCollection = new Map();
      newCollection.set(item.uniqueId.toLowerCase(), uniqueAsset);
      nftsByCollection.set(collectionId, newCollection);
    }
  });

  if (isMigration) {
    const isReadOnlyWallet = getIsReadOnlyWallet();
    if (!isReadOnlyWallet) {
      if (collectionId === 'showcase') {
        await updateWebShowcase(walletAddress, tokensForCategory, true);
        useOpenCollectionsStore.getState(walletAddress).setCollectionOpen('showcase', true);
      } else if (collectionId === 'hidden') {
        await updateWebHidden(walletAddress, tokensForCategory, true);
      }
    }
  }

  return {
    collections: new Map(),
    nftsByCollection,
    pagination: null,
  };
};

const fetchNftData = async (params: NftParams): Promise<NftsQueryData> => {
  try {
    const { walletAddress, collectionId, isMigration = false } = params;

    if (collectionId) {
      const nftsByCollection = new Map<CollectionId, Map<UniqueId, UniqueAsset>>();

      if (collectionId === 'showcase' || collectionId === 'hidden') {
        const results = await fetchMultipleCollectionNfts(collectionId, walletAddress, isMigration);
        for (const [id, nftsMap] of results.nftsByCollection) {
          nftsByCollection.set(id.toLowerCase(), nftsMap);
        }
      } else {
        const chainIds = useBackendNetworksStore.getState().getChainsIdByName();
        const collectionData = await arcClient.getNftsByCollection({ walletAddress, collectionId });
        const collectionMap = new Map<UniqueId, UniqueAsset>();
        if (!nftsByCollection.has(collectionId.toLowerCase())) {
          nftsByCollection.set(collectionId.toLowerCase(), collectionMap);
        }

        for (const nft of collectionData.nftsByCollection) {
          const uniqueAsset = parseUniqueAsset(nft, chainIds);
          nftsByCollection.get(collectionId.toLowerCase())?.set(nft.uniqueId.toLowerCase(), uniqueAsset);
        }
      }

      return {
        collections: new Map(),
        nftsByCollection,
        pagination: null,
      };
    }

    // If no specific collections, fetch the main collections list (pagination)
    const data = await arcClient.getNftCollections(params);
    if (!data?.nftCollections) return EMPTY_RETURN_DATA;

    const collections = new Map(data.nftCollections.data.filter(Boolean).map(item => [item.id, item]));

    const pagination: PaginationInfo = {
      pageKey: data.nftCollections.nextPageKey || null,
      hasNext: !!data.nftCollections.nextPageKey,
      total_elements: data.nftCollections.totalCollections,
    };

    return {
      collections,
      nftsByCollection: new Map(),
      pagination,
    };
  } catch (error) {
    logger.error(new RainbowError('Failed to fetch NFT collections data', error));
    return EMPTY_RETURN_DATA;
  }
};

function createSelector<T>(
  selectorFn: (
    collections: Map<CollectionId, Collection>,
    nftsByCollection: Map<CollectionId, Map<UniqueId, UniqueAsset>>,
    pagination: PaginationInfo | null
  ) => T
): () => T {
  let cachedResult: T | typeof uninitialized = uninitialized;
  let memoizedFn: typeof selectorFn | null = null;
  let lastCollections: Map<CollectionId, Collection> | null = null;
  let lastNftsByCollection: Map<CollectionId, Map<UniqueId, UniqueAsset>> | null = null;
  let lastPagination: PaginationInfo | null = null;

  return () => {
    const { collections, nftsByCollection, pagination } = useNftsStore.getState();

    if (
      cachedResult !== uninitialized &&
      lastCollections === collections &&
      lastNftsByCollection === nftsByCollection &&
      lastPagination === pagination
    ) {
      return cachedResult;
    }

    if (lastCollections !== collections) lastCollections = collections;
    if (lastNftsByCollection !== nftsByCollection) lastNftsByCollection = nftsByCollection;
    if (lastPagination !== pagination) lastPagination = pagination;

    if (!memoizedFn) memoizedFn = selectorFn;

    cachedResult = memoizedFn(collections, nftsByCollection, pagination);
    return cachedResult;
  };
}

function createParameterizedSelector<T, Args extends unknown[]>(
  selectorFn: (
    collections: Map<CollectionId, Collection>,
    nftsByCollection: Map<CollectionId, Map<UniqueId, UniqueAsset>>,
    pagination: PaginationInfo | null
  ) => (...args: Args) => T
): (...args: Args) => T {
  let cachedResult: T | typeof uninitialized = uninitialized;
  let lastArgs: Args | null = null;
  let memoizedFn: ((...args: Args) => T) | null = null;
  let lastCollections: Map<CollectionId, Collection> | null = null;
  let lastNftsByCollection: Map<CollectionId, Map<UniqueId, UniqueAsset>> | null = null;
  let lastPagination: PaginationInfo | null = null;

  return (...args: Args) => {
    const { collections, nftsByCollection, pagination } = useNftsStore.getState();
    const argsChanged = !lastArgs || args.length !== lastArgs.length || args.some((arg, i) => arg !== lastArgs?.[i]);

    if (
      cachedResult !== uninitialized &&
      lastCollections === collections &&
      lastNftsByCollection === nftsByCollection &&
      lastPagination === pagination &&
      !argsChanged
    ) {
      return cachedResult;
    }

    if (!memoizedFn || lastCollections !== collections || lastNftsByCollection !== nftsByCollection || lastPagination !== pagination) {
      lastCollections = collections;
      lastNftsByCollection = nftsByCollection;
      lastPagination = pagination;
      memoizedFn = selectorFn(collections, nftsByCollection, pagination);
    }

    lastArgs = args;
    cachedResult = memoizedFn(...args);
    return cachedResult;
  };
}

export type RawCollectionResponse = Awaited<ReturnType<typeof fetchNftData>>;

export const createNftsStore = (address: Address | string) =>
  createQueryStore<NftsQueryData, NftParams, NftsState>(
    {
      fetcher: fetchNftData,
      onFetched: ({ data, params, set }) => setOrPruneNftsData(data, params, set),
      cacheTime: time.hours(1),
      abortInterruptedFetches: false,
      params: {
        walletAddress: address,
        limit: PAGE_SIZE,
        pageKey: null,
        collectionId: undefined,
      },
      staleTime: STALE_TIME,
    },

    (set, get) => ({
      collections: new Map(),
      nftsByCollection: new Map(),
      fetchedPages: {},
      fetchedCollections: {},
      pagination: null,

      async fetchNextNftCollectionPage() {
        if (paginationPromise && paginationPromise.address === address) {
          return paginationPromise.promise;
        }

        const { fetchedPages, fetch, getNftPaginationInfo, collections } = get();
        const paginationInfo = getNftPaginationInfo();
        const nextPageKey = paginationInfo?.pageKey ?? null;
        const hasNextPage = nextPageKey !== null && paginationInfo?.hasNext;

        // If we have collections but no fetchedPages, it means we loaded from cache
        // Set an initial timestamp to prevent immediate refetch
        const currentFetchedPages = { ...fetchedPages };
        if (collections.size > 0 && Object.keys(currentFetchedPages).length === 0) {
          currentFetchedPages.initial = Date.now() - PAGINATION_STALE_TIME / 2; // Set to half stale time ago
          set({ fetchedPages: currentFetchedPages });
        }

        if (hasNextPage) {
          const now = Date.now();

          // Check if the last pagination fetch is stale
          // We need to check when we last fetched ANY page, not the specific nextPageKey
          // The most recent fetch time is the maximum of all fetch times
          const lastFetchTime =
            Object.values(currentFetchedPages).length > 0 ? Math.max(...Object.values(currentFetchedPages)) : currentFetchedPages.initial;

          const isPageKeyStale = lastFetchTime ? now - lastFetchTime > PAGINATION_STALE_TIME : true; // Default to stale if no timestamp

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
            paginationPromise = {
              address,
              promise: fetch({ pageKey: nextPageKey, limit: PAGE_SIZE }, { force: true, skipStoreUpdates: true })
                .then(data => {
                  if (!data) return;
                  const { collections } = get();
                  set({
                    collections: collections ? new Map([...collections, ...data.collections]) : data.collections,
                    fetchedPages: { ...cleanedFetchedPages, [nextPageKey]: Date.now() },
                    pagination: data.pagination,
                  });
                })
                .catch(async () => {
                  // If the pageKey is expired or invalid, refetch from the beginning
                  const data = await fetch({ pageKey: null, limit: PAGE_SIZE }, { force: true, skipStoreUpdates: true });
                  if (!data) return;

                  // Set initial data
                  set({
                    collections: data.collections,
                    fetchedPages: { initial: now },
                    pagination: data.pagination,
                  });

                  // If there's a next page, fetch it immediately
                  if (data.pagination?.hasNext && data.pagination?.pageKey) {
                    const nextPageData = await fetch(
                      { pageKey: data.pagination.pageKey, limit: PAGE_SIZE },
                      { force: true, skipStoreUpdates: true }
                    );

                    if (nextPageData) {
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
                }),
            };

            return paginationPromise.promise;
          }

          // PageKey is stale, refetch from the beginning and then fetch next page
          paginationPromise = {
            address,
            promise: fetch({ pageKey: null, limit: PAGE_SIZE }, { force: true, skipStoreUpdates: true })
              .then(async data => {
                if (!data) return;

                // Set initial data
                set({
                  collections: data.collections,
                  fetchedPages: { initial: now },
                  pagination: data.pagination,
                });

                // If there's a next page, fetch it immediately
                if (data.pagination?.hasNext && data.pagination?.pageKey) {
                  const nextPageData = await fetch(
                    { pageKey: data.pagination.pageKey, limit: PAGE_SIZE },
                    { force: true, skipStoreUpdates: true }
                  );

                  if (nextPageData) {
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
              }),
          };

          return paginationPromise.promise;
        }
      },

      async fetchNftCollection(collectionId, force = false) {
        const normalizedCollectionId = collectionId.toLowerCase();

        let addressPromises = collectionsPromises.get(address);
        if (!addressPromises) {
          addressPromises = new Map();
          collectionsPromises.set(address, addressPromises);
        }

        const existingPromise = addressPromises.get(normalizedCollectionId);
        if (existingPromise && !force) {
          return existingPromise;
        }

        const now = Date.now();
        if (!prunePromise || prunePromise.address !== address || now - prunePromise.lastPruneAt > TIME_BETWEEN_PRUNES) {
          prunePromise = {
            address,
            lastPruneAt: now,
            promise: pruneStaleAndClosedCollections({ address, set }).finally(() => {
              prunePromise = null;
            }),
          };
        }

        const { fetch, getNftsByCollection } = get();

        if (!force) {
          if (normalizedCollectionId === 'showcase' || normalizedCollectionId === 'hidden') {
            let needsFetch = false;
            const { collectionIds } = await getHiddenAndShowcaseCollectionIds(address, normalizedCollectionId);
            if (!collectionIds) {
              return;
            }

            if (!needsFetch) {
              for (const collectionId of collectionIds) {
                const normalizedCollectionId = collectionId.toLowerCase();
                const collection = getNftsByCollection(normalizedCollectionId);
                if (!collection || isEmpty(collection)) {
                  needsFetch = true;
                  break;
                }
              }
            }

            if (!needsFetch) {
              return;
            }
          } else {
            const collection = getNftsByCollection(normalizedCollectionId);
            if (collection && !isEmpty(collection)) {
              return;
            }
          }
        }

        const promise = (async () => {
          for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
              const data = await fetch(
                { collectionId: normalizedCollectionId },
                { force, skipStoreUpdates: true, cacheTime: time.infinity, staleTime: time.infinity }
              );

              // retry clause for if there are no nfts in the collection data
              if (!data?.nftsByCollection.size) continue;

              const now = Date.now();
              set(state => ({
                nftsByCollection: new Map([...state.nftsByCollection, ...data.nftsByCollection]),
                fetchedCollections: { ...state.fetchedCollections, [normalizedCollectionId]: now },
              }));
              return;
            } catch (error) {
              logger.error(new RainbowError(`Failed to fetch NFT collection`, error), {
                collectionId: normalizedCollectionId,
                address,
                attempt,
                error,
              });
              if (attempt === MAX_RETRIES) {
                return;
              }
            }
          }
        })().finally(() => {
          // Clean up the promise when it's done
          const addressPromises = collectionsPromises.get(address);
          if (addressPromises) {
            addressPromises.delete(normalizedCollectionId);
            // Clean up the address entry if no more promises
            if (addressPromises.size === 0) {
              collectionsPromises.delete(address);
            }
          }
        });

        addressPromises.set(normalizedCollectionId, promise);
        return promise;
      },

      getNftCollections: createSelector(collections => {
        if (!collections.size) {
          const { getData } = get();
          return getData()?.collections ?? null;
        }
        return collections;
      }),

      getNftCollection: createParameterizedSelector(collections => collectionId => {
        const normalizedCollectionId = collectionId.toLowerCase();
        if (!collections.size) {
          const { getData } = get();
          return getData()?.collections?.get(normalizedCollectionId) || null;
        }
        return collections.get(normalizedCollectionId) || null;
      }),

      getNftsByCollection: createParameterizedSelector((_, nftsByCollection) => collectionId => {
        const normalizedCollectionId = collectionId.toLowerCase();
        if (!nftsByCollection.size) {
          const { getData } = get();
          return getData()?.nftsByCollection?.get(normalizedCollectionId) || null;
        }
        return nftsByCollection.get(normalizedCollectionId) || null;
      }),

      getNftByUniqueId: createParameterizedSelector((_, nftsByCollection) => (collectionId, uniqueId) => {
        const normalizedCollectionId = collectionId.toLowerCase();
        const normalizedUniqueId = uniqueId.toLowerCase();
        if (!nftsByCollection.size) {
          const { getData } = get();
          return getData()?.nftsByCollection?.get(normalizedCollectionId)?.get(normalizedUniqueId) || null;
        }
        return nftsByCollection.get(normalizedCollectionId)?.get(normalizedUniqueId) || null;
      }),

      // TODO: Need to think about this one more
      // I don't like having to create a new Array for each call to this accessor
      getNft: createParameterizedSelector((_, nftsByCollection) => (collectionId, index) => {
        const normalizedCollectionId = collectionId.toLowerCase();
        if (!nftsByCollection.size) {
          const { getData } = get();
          const nftArray = Array.from(getData()?.nftsByCollection?.get(normalizedCollectionId)?.values() || []);
          return nftArray[index] || null;
        }
        const nftArray = Array.from(nftsByCollection.get(normalizedCollectionId)?.values() || []);
        return nftArray[index] || null;
      }),

      getNftPaginationInfo: createSelector((_, __, pagination) => {
        if (!pagination) {
          const { getData } = get();
          return getData()?.pagination ?? null;
        }
        return pagination;
      }),

      hasNextNftCollectionPage: createSelector((_, __, pagination) => {
        if (!pagination) {
          const { getData } = get();
          return Boolean(getData()?.pagination?.hasNext);
        }
        return Boolean(pagination?.hasNext);
      }),

      getCurrentNftCollectionPageKey: createSelector((_, __, pagination) => {
        if (!pagination) {
          const { getData } = get();
          return getData()?.pagination?.pageKey ?? null;
        }
        return pagination?.pageKey ?? null;
      }),

      getNextNftCollectionPageKey: createSelector((_, __, pagination) => {
        if (!pagination) {
          const { getData } = get();
          const data = getData();
          return data?.pagination?.hasNext ? data?.pagination?.pageKey : null;
        }
        return pagination?.hasNext ? pagination.pageKey : null;
      }),
    }),

    address.length
      ? {
          partialize: state => ({
            collections: state.collections,
            nftsByCollection: state.nftsByCollection,
            fetchedCollections: state.fetchedCollections,
            fetchedPages: state.fetchedPages,
            pagination: state.pagination,
          }),
          storageKey: `nfts_${address}`,
          version: 1,
        }
      : undefined
  );

async function setOrPruneNftsData(
  data: NftsQueryData,
  params: NftParams,
  set: (partial: NftsState | Partial<NftsState> | ((state: NftsState) => NftsState | Partial<NftsState>)) => void
): Promise<void> {
  const now = Date.now();
  // Handle initial fetch or pull-to-refresh essentially resetting the pagination state
  if (!params.pageKey && params.limit === PAGE_SIZE && params.walletAddress) {
    set(state => ({
      ...state,
      collections: data.collections,
      fetchedPages: { initial: now },
      pagination: data.pagination,
    }));
    return;
  }

  // Handle pagination updates -> merge collections
  if (params.pageKey) {
    const pageKey = params.pageKey;
    set(state => {
      return {
        ...state,
        collections: mergeMaps(state.collections, data.collections),
        fetchedPages: {
          ...state.fetchedPages,
          [pageKey]: now,
        },
        pagination: data.pagination,
      };
    });
    return;
  }
}
