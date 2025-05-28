import { Address } from 'viem';
import { arcClient, arcPOSTClient } from '@/graphql';
import { logger, RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils';
import { NftsState, NftParams, NftsQueryData, PaginationInfo } from './types';
import { simpleHashNFTToUniqueAsset } from '@/resources/nfts/simplehash/utils';

export const PAGE_SIZE = 12;

const EMPTY_RETURN_DATA: NftsQueryData = {
  collections: new Map(),
  nftsByCollection: new Map(),
  pagination: null,
};
const STALE_TIME = time.minutes(10);

let paginationPromise: { address: Address | string; promise: Promise<void> } | null = null;

const fetchNftData = async (params: NftParams): Promise<NftsQueryData> => {
  try {
    const { walletAddress, collectionId } = params;

    if (collectionId) {
      const data = await arcClient.getNftsByCollection({ walletAddress, collectionId });
      if (!data) return EMPTY_RETURN_DATA;

      const collectionNfts = new Map();
      data.nftsByCollection.forEach(item => {
        collectionNfts.set(item.nft_id!, simpleHashNFTToUniqueAsset(item, params.walletAddress));
      });

      return {
        collections: new Map(),
        nftsByCollection: new Map([[collectionId, collectionNfts]]),
        pagination: null,
      };
    }

    const data = await arcClient.getNftCollectionsPaginated(params);
    if (!data?.getNftCollectionsForAddress) return EMPTY_RETURN_DATA;

    const collections = new Map(data.getNftCollectionsForAddress.data.filter(Boolean).map(item => [item.id, item]));

    const pagination: PaginationInfo = {
      pageKey: data.getNftCollectionsForAddress.nextPageKey || null,
      hasNext: !!data.getNftCollectionsForAddress.nextPageKey,
      total_elements: data.getNftCollectionsForAddress.totalCollections,
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
      staleTime: STALE_TIME,
    },

    (set, get) => ({
      nfts: null,

      async fetchNextPage() {
        if (paginationPromise && paginationPromise.address === address) {
          return paginationPromise.promise;
        }

        const { nfts: storedNfts, fetch, getPaginationInfo } = get();
        const nfts = storedNfts?.address === address ? storedNfts : null;
        const paginationInfo = getPaginationInfo();
        const nextPageKey = (nfts ? paginationInfo?.pageKey : null) ?? null;
        const hasNextPage = nextPageKey !== null && paginationInfo?.hasNext;

        if (hasNextPage) {
          const now = Date.now();
          const isStale = nfts ? Object.values(nfts.fetchedPages).some(fetchedAt => now - fetchedAt > STALE_TIME) : false;

          if (!isStale) {
            paginationPromise = {
              address,
              promise: fetch({ pageKey: nextPageKey, limit: PAGE_SIZE }, { force: true, skipStoreUpdates: true })
                .then(data => {
                  if (!data) return;
                  set({
                    nfts: {
                      address,
                      collections: nfts?.collections ? new Map([...nfts.collections, ...data.collections]) : data.collections,
                      nftsByCollection: nfts?.nftsByCollection
                        ? new Map([...nfts.nftsByCollection, ...data.nftsByCollection])
                        : data.nftsByCollection,
                      fetchedPages: nfts?.fetchedPages
                        ? { ...nfts.fetchedPages, [nextPageKey]: Date.now() }
                        : { [nextPageKey]: Date.now() },
                      pagination: data.pagination,
                    },
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
                  nfts: {
                    address,
                    collections: data.collections,
                    nftsByCollection: data.nftsByCollection,
                    fetchedPages: { initial: now },
                    pagination: data.pagination,
                  },
                });
              })
              .finally(() => (paginationPromise = null)),
          };

          return paginationPromise.promise;
        }
      },

      getCollections: () => {
        const { nfts, getData } = get();
        if (!nfts || !nfts.collections.size || address !== nfts.address) {
          return getData()?.collections ? Array.from(getData()!.collections.values()) : null;
        }
        return Array.from(nfts.collections.values());
      },

      getCollection: collectionId => {
        const { nfts, getData } = get();
        if (!nfts || !nfts.collections.size || address !== nfts.address) {
          return getData()?.collections?.get(collectionId) || null;
        }
        return nfts.collections.get(collectionId) || null;
      },

      getNftsByCollection: collectionId => {
        const { nfts, getData } = get();
        if (!nfts || !nfts.nftsByCollection.size || address !== nfts.address) {
          return getData()?.nftsByCollection?.get(collectionId) || null;
        }
        return nfts.nftsByCollection.get(collectionId) || null;
      },

      getNft: (collectionId, uniqueId) => {
        const { nfts, getData } = get();
        if (!nfts || address !== nfts.address) {
          return getData()?.nftsByCollection?.get(collectionId)?.get(uniqueId) || null;
        }
        return nfts.nftsByCollection.get(collectionId)?.get(uniqueId) || null;
      },

      getPaginationInfo: () => {
        const { nfts, getData } = get();
        if (!nfts || address !== nfts.address) {
          return getData()?.pagination ?? null;
        }
        return nfts.pagination;
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
            // Only persist collections and nftsByCollection, not pagination state
            nfts: state.nfts
              ? {
                  address: state.nfts.address,
                  collections: state.nfts.collections,
                  nftsByCollection: state.nfts.nftsByCollection,
                  fetchedPages: {},
                  pagination: null,
                }
              : null,
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
  // Handle collection-specific NFT fetches (when collectionId is provided)
  if (params.collectionId && params.walletAddress) {
    // Use set function to access current state
    set(currentState => {
      const { nfts } = currentState;

      if (nfts && nfts.address === params.walletAddress) {
        // Update only the NFTs for this specific collection, preserve existing collections and pagination
        return {
          ...currentState,
          nfts: {
            ...nfts,
            nftsByCollection: new Map([...nfts.nftsByCollection, ...data.nftsByCollection]),
          },
        };
      } else {
        // Create new nfts state with just the collection NFTs
        return {
          ...currentState,
          nfts: {
            address: params.walletAddress,
            collections: new Map(),
            nftsByCollection: data.nftsByCollection,
            fetchedPages: { collection: Date.now() },
            pagination: null,
          },
        };
      }
    });
    return;
  }

  // For collections pagination, we need to access the current state to check conditions
  set(currentState => {
    const { nfts } = currentState;

    // Handle pull-to-refresh cases (when pageKey is null and we're fetching collections from the beginning)
    if (!params.pageKey && params.limit === PAGE_SIZE && params.walletAddress && !params.collectionId) {
      return {
        ...currentState,
        nfts: {
          address: params.walletAddress,
          collections: data.collections,
          nftsByCollection: data.nftsByCollection,
          fetchedPages: { initial: Date.now() },
          pagination: data.pagination,
        },
      };
    }

    // If we don't have stored NFTs data, don't modify state
    if (!nfts) {
      return currentState;
    }

    // If the address changed, clear the stored data
    const didAddressChange = nfts.address !== params.walletAddress;
    if (didAddressChange) {
      return { ...currentState, nfts: null };
    }

    // Check if data is stale
    const now = Date.now();
    const isStale = Object.values(nfts.fetchedPages).some(fetchedAt => now - fetchedAt > STALE_TIME);
    if (isStale) {
      return { ...currentState, nfts: null };
    }

    return currentState;
  });
}
