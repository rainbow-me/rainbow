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

const fetchMultipleCollectionNfts = async (collectionId: string): Promise<NftsQueryData> => {
  const tokens = collectionId === 'showcase' ? store.getState().showcaseTokens.showcaseTokens : store.getState().hiddenTokens.hiddenTokens;

  const payloads = tokens
    .map(token => parseUniqueId(token))
    .filter(p => p.network && p.contractAddress && p.tokenId)
    .map(p => ({
      network: p.network as string,
      contractAddress: p.contractAddress,
      tokenId: p.tokenId,
    }));

  const chainIds = useBackendNetworksStore.getState().getChainsIdByName();

  const data = await Promise.all(payloads.map(payload => arcClient.getNft(payload)));

  const nftsByCollection = new Map();

  data.forEach(item => {
    const { network, contractAddress } = parseUniqueId(item.nft.uniqueId);
    const collectionId = `${network}_${contractAddress}`;
    const uniqueAsset = parseUniqueAsset(item.nft, chainIds);

    const existingCollection = nftsByCollection.get(collectionId);
    if (existingCollection) {
      existingCollection.set(item.nft.uniqueId, uniqueAsset);
    } else {
      const newCollection = new Map();
      newCollection.set(item.nft.uniqueId, uniqueAsset);
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

    if (collectionId) {
      if (collectionId === 'showcase' || collectionId === 'hidden') {
        return fetchMultipleCollectionNfts(collectionId);
      }
      const data = await arcClient.getNftsByCollection({ walletAddress, collectionId });
      if (!data) return EMPTY_RETURN_DATA;

      const chainIds = useBackendNetworksStore.getState().getChainsIdByName();

      const collectionNfts = new Map();
      data.nftsByCollection.forEach(item => {
        collectionNfts.set(item.uniqueId, parseUniqueAsset(item, chainIds));
      });

      return {
        collections: new Map(),
        nftsByCollection: new Map([[collectionId, collectionNfts]]),
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
      debugMode: true,
      staleTime: STALE_TIME,
    },

    (set, get) => ({
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
          return getData()?.collections ? Array.from(getData()!.collections.values()) : null;
        }
        return Array.from(collections.values());
      },

      getCollection: collectionId => {
        const { collections, getData } = get();
        if (!collections.size) {
          return getData()?.collections?.get(collectionId) || null;
        }
        return collections.get(collectionId) || null;
      },

      getNftsByCollection: collectionId => {
        const { nftsByCollection, getData } = get();
        if (!nftsByCollection.size) {
          return getData()?.nftsByCollection?.get(collectionId) || null;
        }
        return nftsByCollection.get(collectionId) || null;
      },

      getNftByUniqueId: (collectionId, uniqueId) => {
        const { nftsByCollection, getData } = get();
        if (!nftsByCollection.size) {
          return getData()?.nftsByCollection?.get(collectionId)?.get(uniqueId) || null;
        }
        return nftsByCollection.get(collectionId)?.get(uniqueId) || null;
      },

      getNft: (collectionId, index) => {
        const { nftsByCollection, getData } = get();
        if (!nftsByCollection.size) {
          const nftArray = Array.from(getData()?.nftsByCollection?.get(collectionId)?.values() || []);
          return nftArray[index] || null;
        }
        const nftArray = Array.from(nftsByCollection.get(collectionId)?.values() || []);
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
      return {
        ...currentState,
        nftsByCollection: new Map([...nftsByCollection, ...data.nftsByCollection]),
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
