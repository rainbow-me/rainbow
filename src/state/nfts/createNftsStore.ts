import { Address } from 'viem';
import { arcClient } from '@/graphql';
import { logger, RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils';
import { NftsState, NftParams, NftsQueryData, PaginationInfo } from './types';
import { parseUniqueAsset, parseUniqueId } from '@/resources/nfts/utils';
import { useBackendNetworksStore } from '../backendNetworks/backendNetworks';
import Routes from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { useNftsStore } from './nfts';
import store from '@/redux/store';

export const PAGE_SIZE = 12;

const EMPTY_RETURN_DATA: NftsQueryData = {
  collections: new Map(),
  nftsByCollection: new Map(),
  pagination: null,
};
const STALE_TIME = time.minutes(10);

let paginationPromise: { address: Address | string; promise: Promise<void> } | null = null;

const replaceEthereumWithMainnet = (network: string | undefined) => {
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
    const { walletAddress, collectionId } = params;

    /**
     * Instead of one collectionId, we should read from openFamilies and fetch for all openFamilies
     */

    if (collectionId) {
      if (collectionId === 'showcase' || collectionId === 'hidden') {
        return fetchMultipleCollectionNfts(collectionId, walletAddress);
      }
      const data = await arcClient.getNftsByCollection({ walletAddress, collectionId });
      if (!data) return EMPTY_RETURN_DATA;

      const chainIds = useBackendNetworksStore.getState().getChainsIdByName();

      const collectionNfts = new Map();
      data.nftsByCollection.forEach(item => {
        collectionNfts.set(item.uniqueId.toLowerCase(), parseUniqueAsset(item, chainIds));
      });

      return {
        collections: new Map(),
        nftsByCollection: new Map([[collectionId.toLowerCase(), collectionNfts]]),
        pagination: null,
      };
    }

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
      },
      // keepPreviousData: true,
      debugMode: true,
      staleTime: STALE_TIME,
    },

    (set, get) => ({
      hasMigratedShowcase: false,
      hasMigratedHidden: false,
      collections: new Map(),
      nftsByCollection: new Map(),
      fetchedPages: {},
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

          // If the NFTs data is stale, refetch from the beginning
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
            hasMigratedShowcase: state.hasMigratedShowcase,
            hasMigratedHidden: state.hasMigratedHidden,
          }),
          storageKey: `nfts_${address}`,
          version: 3,
        }
      : undefined
  );

function isOnNftRoute(): boolean {
  const { activeRoute } = useNavigationStore.getState();
  return activeRoute === Routes.WALLET_SCREEN || activeRoute === Routes.EXPANDED_ASSET_SHEET;
}

function setOrPruneNftsData(
  data: NftsQueryData,
  params: NftParams,
  set: (partial: NftsState | Partial<NftsState> | ((state: NftsState) => NftsState | Partial<NftsState>)) => void
): void {
  if (params.collectionId) {
    set(currentState => {
      const { nftsByCollection } = currentState;
      const mergedNftsByCollection = new Map(nftsByCollection);

      // Deep merge: for each collection in the new data
      for (const [collectionId, newNftsMap] of data.nftsByCollection) {
        const normalizedCollectionId = collectionId.toLowerCase();
        const existingNftsMap = mergedNftsByCollection.get(normalizedCollectionId);

        if (existingNftsMap) {
          // Merge NFTs within the same collection
          const mergedNftsMap = new Map([...existingNftsMap, ...newNftsMap]);
          mergedNftsByCollection.set(normalizedCollectionId, mergedNftsMap);
        } else {
          // New collection, just add it
          mergedNftsByCollection.set(normalizedCollectionId, newNftsMap);
        }
      }

      return {
        ...currentState,
        nftsByCollection: mergedNftsByCollection,
      };
    });
    return;
  }

  const { collections, fetchedPages, pagination } = useNftsStore.getState(params.walletAddress);

  // Handle initial fetch (similar to airdrops pull-to-refresh)
  if (!params.pageKey && params.limit === PAGE_SIZE && params.walletAddress) {
    set({
      collections: data.collections,
      nftsByCollection: data.nftsByCollection,
      fetchedPages: { initial: Date.now() },
      pagination: data.pagination,
    });
    return;
  }

  // If no existing collections data or on NFT route, don't prune
  if (!collections.size || isOnNftRoute()) {
    return;
  }

  // Check conditions that warrant pruning the NFT data
  const didCollectionCountChange = pagination?.total_elements !== data.pagination?.total_elements;
  if (didCollectionCountChange) {
    set({
      collections: new Map(),
      nftsByCollection: new Map(),
      fetchedPages: {},
      pagination: null,
    });
    return;
  }

  // Check if data is stale
  const now = Date.now();
  const isStale = Object.values(fetchedPages).some((fetchedAt: number) => now - fetchedAt > STALE_TIME);
  if (isStale) {
    set({
      collections: new Map(),
      nftsByCollection: new Map(),
      fetchedPages: {},
      pagination: null,
    });
  }
}
