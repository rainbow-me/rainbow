import { Address } from 'viem';
import { arcClient } from '@/graphql';
import { logger, RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils';
import { NftsState, NftParams, NftsQueryData, PaginationInfo, Collection } from './types';
import { parseUniqueAsset, parseUniqueId } from '@/resources/nfts/utils';
import { useBackendNetworksStore } from '../backendNetworks/backendNetworks';
import store from '@/redux/store';
import { IS_DEV } from '@/env';

export const PAGE_SIZE = 12;

export const mergeMaps = (map1: Map<string, Collection>, map2: Map<string, Collection>) => {
  return new Map(
    (function* () {
      yield* map1;
      yield* map2;
    })()
  );
};

const EMPTY_RETURN_DATA: NftsQueryData = {
  collections: new Map(),
  nftsByCollection: new Map(),
  pagination: null,
};
export const STALE_TIME = time.minutes(10);

let paginationPromise: { address: Address | string; promise: Promise<void> } | null = null;

export const replaceEthereumWithMainnet = (network: string | undefined) => {
  if (!network) return undefined;

  if (network === 'ethereum') {
    return 'mainnet';
  }
  return network;
};

const fetchMultipleCollectionNfts = async (collectionId: string, walletAddress: string): Promise<NftsQueryData> => {
  const tokensForCategory =
    collectionId === 'showcase' ? store.getState().showcaseTokens.showcaseTokens : store.getState().hiddenTokens.hiddenTokens;

  const tokens = tokensForCategory
    .map(token => parseUniqueId(token))
    .filter(p => p.network && p.contractAddress && p.tokenId)
    .reduce(
      (acc, curr) => {
        const network = replaceEthereumWithMainnet(curr.network);
        if (!network) return acc;

        acc[network] = acc[network] || [];
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

  if (!response.getNftsMetadata) return EMPTY_RETURN_DATA;

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

  return {
    collections: new Map(),
    nftsByCollection,
    pagination: null,
  };
};

const fetchNftData = async (params: NftParams): Promise<NftsQueryData> => {
  try {
    const { walletAddress, openCollections } = params;

    // If we have specific collections to fetch (open collections)
    if (openCollections?.length) {
      const chainIds = useBackendNetworksStore.getState().getChainsIdByName();
      const nftsByCollection = new Map();

      // Process each collection
      const promises = openCollections.map(async collectionId => {
        try {
          if (collectionId === 'showcase' || collectionId === 'hidden') {
            const showcaseData = await fetchMultipleCollectionNfts(collectionId, walletAddress);
            return { collectionId, data: showcaseData };
          } else {
            const collectionData = await arcClient.getNftsByCollection({ walletAddress, collectionId });
            return { collectionId, data: collectionData };
          }
        } catch (error) {
          logger.error(new RainbowError(`Failed to fetch collection ${collectionId}`, error));
          return { collectionId, data: null };
        }
      });

      const results = await Promise.allSettled(promises);

      for (const result of results) {
        if (result.status === 'rejected') continue;

        const { collectionId, data } = result.value;
        if (!data) continue;

        if (collectionId === 'showcase' || collectionId === 'hidden') {
          if (data.nftsByCollection instanceof Map) {
            for (const [id, nftsMap] of data.nftsByCollection) {
              nftsByCollection.set(id, nftsMap);
            }
          }
        } else {
          if ('nftsByCollection' in data && Array.isArray(data.nftsByCollection)) {
            const collectionNfts = new Map();
            data.nftsByCollection.forEach(item => {
              collectionNfts.set(item.uniqueId.toLowerCase(), parseUniqueAsset(item, chainIds));
            });
            nftsByCollection.set(collectionId.toLowerCase(), collectionNfts);
          }
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

export type RawCollectionResponse = Awaited<ReturnType<typeof fetchNftData>>;

export const createNftsStore = (address: Address | string) =>
  createQueryStore<NftsQueryData, NftParams, NftsState>(
    {
      fetcher: fetchNftData,
      onFetched: ({ data, params, set }) => setOrPruneNftsData(data, params, set),
      cacheTime: time.hours(1),
      params: {
        walletAddress: address,
        limit: PAGE_SIZE,
        pageKey: null,
        openCollections: [],
      },
      keepPreviousData: true,
      debugMode: IS_DEV,
      staleTime: STALE_TIME,
    },

    (set, get) => ({
      collections: new Map(),
      openCollections: new Set(),
      nftsByCollection: new Map(),
      fetchedPages: {},
      fetchedCollections: {},
      pagination: null,

      async fetchNextPage() {
        if (paginationPromise && paginationPromise.address === address) {
          return paginationPromise.promise;
        }

        const { fetchedPages, fetch, getPaginationInfo } = get();
        const paginationInfo = getPaginationInfo();
        const nextPageKey = paginationInfo?.pageKey ?? null;
        const hasNextPage = nextPageKey !== null && paginationInfo?.hasNext;

        if (hasNextPage) {
          const now = Date.now();
          const isStale = fetchedPages ? Object.values(fetchedPages).some((fetchedAt: number) => now - fetchedAt > STALE_TIME) : false;

          if (!isStale) {
            paginationPromise = {
              address,
              promise: fetch({ pageKey: nextPageKey, limit: PAGE_SIZE }, { force: true, skipStoreUpdates: true })
                .then(data => {
                  if (!data) return;
                  const { collections, nftsByCollection } = get();
                  set({
                    collections: collections ? new Map([...collections, ...data.collections]) : data.collections,
                    nftsByCollection: nftsByCollection ? new Map([...nftsByCollection, ...data.nftsByCollection]) : data.nftsByCollection,
                    fetchedPages: { ...fetchedPages, [nextPageKey]: Date.now() },
                    pagination: data.pagination,
                  });
                })
                .finally(() => (paginationPromise = null)),
            };

            return paginationPromise.promise;
          }

          paginationPromise = {
            address,
            promise: fetch({ pageKey: null, limit: PAGE_SIZE }, { force: true, skipStoreUpdates: true })
              .then(data => {
                if (!data) return;
                set({
                  collections: data.collections,
                  nftsByCollection: data.nftsByCollection,
                  fetchedPages: { initial: now },
                  pagination: data.pagination,
                });
              })
              .finally(() => (paginationPromise = null)),
          };

          return paginationPromise.promise;
        }
      },

      getCollections: () => {
        const { collections, getData } = get();
        if (!collections.size) {
          const data = getData();
          return data?.collections ? Array.from(data.collections.values()) : null;
        }
        return Array.from(collections.values());
      },

      getCollection: collectionId => {
        const { collections, getData } = get();
        const normalizedCollectionId = collectionId.toLowerCase();
        if (!collections.size) {
          return getData()?.collections?.get(normalizedCollectionId) || null;
        }
        return collections.get(normalizedCollectionId) || null;
      },

      getNftsByCollection: collectionId => {
        const { nftsByCollection, getData } = get();
        const normalizedCollectionId = collectionId.toLowerCase();
        if (!nftsByCollection.size) {
          return getData()?.nftsByCollection?.get(normalizedCollectionId) || null;
        }
        return nftsByCollection.get(normalizedCollectionId) || null;
      },

      getNftByUniqueId: (collectionId, uniqueId) => {
        const { nftsByCollection, getData } = get();
        const normalizedCollectionId = collectionId.toLowerCase();
        const normalizedUniqueId = uniqueId.toLowerCase();

        if (!nftsByCollection.size) {
          return getData()?.nftsByCollection?.get(normalizedCollectionId)?.get(normalizedUniqueId) || null;
        }
        return nftsByCollection.get(normalizedCollectionId)?.get(normalizedUniqueId) || null;
      },

      getNft: (collectionId, index) => {
        const { nftsByCollection, getData } = get();
        const normalizedCollectionId = collectionId.toLowerCase();
        if (!nftsByCollection.size) {
          const nftArray = Array.from(getData()?.nftsByCollection?.get(normalizedCollectionId)?.values() || []);
          return nftArray[index] || null;
        }
        const nftArray = Array.from(nftsByCollection.get(normalizedCollectionId)?.values() || []);
        return nftArray[index] || null;
      },

      getPaginationInfo: () => {
        const { pagination, getData } = get();
        if (!pagination) {
          return getData()?.pagination ?? null;
        }
        return pagination;
      },

      hasNextPage: () => {
        const paginationInfo = get().getPaginationInfo();
        return Boolean(paginationInfo?.hasNext);
      },

      getCurrentPageKey: () => get().getPaginationInfo()?.pageKey ?? null,

      getNextPageKey: () => {
        const paginationInfo = get().getPaginationInfo();
        return paginationInfo?.hasNext ? paginationInfo.pageKey : null;
      },
    }),

    address.length
      ? {
          partialize: state => ({
            collections: state.collections,
            nftsByCollection: state.nftsByCollection,
            fetchedCollections: state.fetchedCollections,
            openCollections: state.openCollections,
          }),
          storageKey: `nfts_${address}`,
          version: 3,
        }
      : undefined
  );

function setOrPruneNftsData(
  data: NftsQueryData,
  params: NftParams,
  set: (partial: NftsState | Partial<NftsState> | ((state: NftsState) => NftsState | Partial<NftsState>)) => void
): void {
  const now = Date.now();

  if (params.openCollections?.length) {
    set(currentState => {
      const { nftsByCollection, fetchedCollections } = currentState;
      const mergedNftsByCollection = new Map(nftsByCollection);
      const updatedFetchedCollections = { ...fetchedCollections };

      // Deep merge: for each collection in the new data
      for (const [collectionId, newNftsMap] of data.nftsByCollection) {
        const normalizedId = collectionId.toLowerCase();
        if (params.openCollections?.includes(normalizedId)) {
          const existingNftsMap = mergedNftsByCollection.get(normalizedId);
          if (existingNftsMap) {
            // Create a new Map to maintain immutability for UI stability
            const mergedNftsMap = new Map();

            // First add existing NFTs
            for (const [uniqueId, nft] of existingNftsMap) {
              mergedNftsMap.set(uniqueId, nft);
            }

            // Then add/update with new NFTs
            for (const [uniqueId, nft] of newNftsMap) {
              mergedNftsMap.set(uniqueId, nft);
            }

            mergedNftsByCollection.set(normalizedId, mergedNftsMap);
          } else {
            // New collection, just add it
            mergedNftsByCollection.set(normalizedId, newNftsMap);
          }
          // Update fetch time for this collection
          updatedFetchedCollections[normalizedId] = now;
        } else {
          // If the collection is not open, we need to prune the data
          mergedNftsByCollection.delete(normalizedId);
          delete updatedFetchedCollections[normalizedId];
        }
      }

      return {
        ...currentState,
        nftsByCollection: mergedNftsByCollection,
        fetchedCollections: updatedFetchedCollections,
      };
    });

    return;
  }

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
