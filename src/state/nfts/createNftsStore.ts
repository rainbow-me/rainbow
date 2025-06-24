import { Address } from 'viem';
import { arcClient } from '@/graphql';
import { logger, RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils';
import { NftsState, NftParams, NftsQueryData, PaginationInfo, CollectionId, UniqueId } from './types';
import { parseUniqueAsset, parseUniqueId } from '@/resources/nfts/utils';
import { useBackendNetworksStore } from '../backendNetworks/backendNetworks';
import { IS_DEV } from '@/env';
import { getShowcase } from '@/hooks/useFetchShowcaseTokens';
import { getHidden } from '@/hooks/useFetchHiddenTokens';
import { mergeMaps, replaceEthereumWithMainnet } from '@/state/nfts/utils';
import { UniqueAsset } from '@/entities';

export const PAGE_SIZE = 12;
export const STALE_TIME = time.minutes(10);

const EMPTY_RETURN_DATA: NftsQueryData = {
  collections: new Map(),
  nftsByCollection: new Map(),
  pagination: null,
};

let paginationPromise: { address: Address | string; promise: Promise<void> } | null = null;

const fetchMultipleCollectionNfts = async (collectionId: string, walletAddress: string): Promise<NftsQueryData> => {
  console.log('fetchMultipleCollectionNfts called with:', { collectionId, walletAddress });

  const tokensForCategory = collectionId === 'showcase' ? (await getShowcase(walletAddress)) || [] : (await getHidden(walletAddress)) || [];

  console.log('tokensForCategory', tokensForCategory);

  const tokens = tokensForCategory
    .map((token: string) => parseUniqueId(token))
    .filter(p => p.network && p.contractAddress && p.tokenId)
    .reduce(
      (acc, curr) => {
        const network = replaceEthereumWithMainnet(curr.network);
        if (!network) return acc;

        acc[network] ||= [];
        acc[network].push({
          contractAddress: curr.contractAddress,
          tokenId: curr.tokenId,
        });
        return acc;
      },
      {} as Record<string, { contractAddress: string; tokenId: string }[]>
    );

  console.log('parsed tokens:', tokens);

  const chainIds = useBackendNetworksStore.getState().getChainsIdByName();
  console.log('chainIds:', chainIds);

  const response = await arcClient.getNftsMetadata({ tokens, walletAddress });
  console.log('getNftsMetadata response:', response);

  if (!response.getNftsMetadata) {
    console.log('No getNftsMetadata in response, returning EMPTY_RETURN_DATA');
    return EMPTY_RETURN_DATA;
  }

  const nftsByCollection = new Map();

  response.getNftsMetadata.forEach(item => {
    const { network, contractAddress } = parseUniqueId(item.uniqueId);
    const collectionId = `${network}_${contractAddress}`.toLowerCase();
    const uniqueAsset = parseUniqueAsset(item, chainIds);

    console.log('Processing NFT:', { uniqueId: item.uniqueId, collectionId, uniqueAsset });

    const existingCollection = nftsByCollection.get(collectionId);
    if (existingCollection) {
      existingCollection.set(item.uniqueId.toLowerCase(), uniqueAsset);
    } else {
      const newCollection = new Map();
      newCollection.set(item.uniqueId.toLowerCase(), uniqueAsset);
      nftsByCollection.set(collectionId, newCollection);
    }
  });

  console.log('Final nftsByCollection:', nftsByCollection);

  return {
    collections: new Map(),
    nftsByCollection,
    pagination: null,
  };
};

const fetchNftData = async (params: NftParams): Promise<NftsQueryData> => {
  try {
    const { walletAddress, collectionId } = params;

    if (collectionId) {
      const nftsByCollection = new Map<CollectionId, Map<UniqueId, UniqueAsset>>();

      if (collectionId === 'showcase' || collectionId === 'hidden') {
        const results = await fetchMultipleCollectionNfts(collectionId, walletAddress);
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

      async fetchNextNftCollectionPage() {
        if (paginationPromise && paginationPromise.address === address) {
          return paginationPromise.promise;
        }

        const { fetchedPages, fetch, getNftPaginationInfo } = get();
        const paginationInfo = getNftPaginationInfo();
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

      getNftCollections: () => {
        const { collections, getData } = get();
        if (!collections.size) {
          const data = getData();
          return data?.collections ? Array.from(data.collections.values()) : null;
        }
        return Array.from(collections.values());
      },

      getNftCollection: collectionId => {
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

      getNftPaginationInfo: () => {
        const { pagination, getData } = get();
        if (!pagination) {
          return getData()?.pagination ?? null;
        }
        return pagination;
      },

      hasNextNftCollectionPage: () => {
        const paginationInfo = get().getNftPaginationInfo();
        return Boolean(paginationInfo?.hasNext);
      },

      getCurrentNftCollectionPageKey: () => get().getNftPaginationInfo()?.pageKey ?? null,

      getNextNftCollectionPageKey: () => {
        const paginationInfo = get().getNftPaginationInfo();
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
          version: 100000,
        }
      : undefined
  );

async function setOrPruneNftsData(
  data: NftsQueryData,
  params: NftParams,
  set: (partial: NftsState | Partial<NftsState> | ((state: NftsState) => NftsState | Partial<NftsState>)) => void
): Promise<void> {
  const now = Date.now();

  const showcaseUniqueIds = await getShowcase(params.walletAddress);
  const hiddenUniqueIds = await getHidden(params.walletAddress);

  // Extract collection IDs from unique IDs for comparison
  const showcaseCollectionIds = new Set(
    showcaseUniqueIds.map(uniqueId => {
      const { network, contractAddress } = parseUniqueId(uniqueId);
      return `${network}_${contractAddress}`.toLowerCase();
    })
  );

  const hiddenCollectionIds = new Set(
    hiddenUniqueIds.map(uniqueId => {
      const { network, contractAddress } = parseUniqueId(uniqueId);
      return `${network}_${contractAddress}`.toLowerCase();
    })
  );

  // when performing a specific fetch for a collection, we also want to handle pruning
  // previously opened collections that are no longer opened
  // this is a bit of a hack, but it works for now
  if (params.collectionId) {
    set(currentState => {
      const { nftsByCollection, fetchedCollections, openCollections } = currentState;
      const mergedNftsByCollection = new Map(nftsByCollection);
      const updatedFetchedCollections = { ...fetchedCollections };

      const isHiddenOpen = openCollections.has('hidden');

      // Deep merge: for each collection in the new data
      for (const [collectionId, newNftsMap] of data.nftsByCollection) {
        const normalizedId = collectionId.toLowerCase();

        // Determine if this collection should be kept
        let shouldKeepCollection = false;

        if (showcaseCollectionIds.has(normalizedId)) {
          // for showcase tokens, we should always keep them and never prune them
          shouldKeepCollection = true;
        } else if (hiddenCollectionIds.has(normalizedId)) {
          // for hidden tokens, we should keep them if hidden is open
          shouldKeepCollection = isHiddenOpen;
        } else {
          // for every other token, we should keep them if they are still opened
          shouldKeepCollection = openCollections?.has(normalizedId) ?? false;
        }

        if (shouldKeepCollection) {
          const existingNftsMap = mergedNftsByCollection.get(normalizedId);
          if (existingNftsMap) {
            const mergedNftsMap = mergeMaps(existingNftsMap, newNftsMap);
            mergedNftsByCollection.set(normalizedId, mergedNftsMap);
          } else {
            // New collection, just add it
            mergedNftsByCollection.set(normalizedId, newNftsMap);
          }
          // Update fetch time for this collection
          updatedFetchedCollections[normalizedId] = now;
        } else {
          // Collection should be pruned
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
