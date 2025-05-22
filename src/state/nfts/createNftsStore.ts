import { Address } from 'viem';
import { arcClient } from '@/graphql';
import { logger, RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils';
import { nftsStoreManager } from './nftsStoreManager';
import { NftsState, NftParams, NftStore, NftsStateRequiredForPersistence, CollectionId } from './types';
import { simpleHashNFTToUniqueAsset } from '@/resources/nfts/simplehash/utils';

const fetchCollections = async (params: NftParams) => {
  try {
    if (!params.walletAddress) return null;

    const { walletAddress, sortBy, sortDirection } = params;
    const data = await arcClient.getNftCollections({ walletAddress, sortBy, sortDirection });
    return data;
  } catch (error) {
    logger.error(new RainbowError('Failed to fetch collections data', error));
    return null;
  }
};

const fetchNftsForCollection = async (params: NftParams & { collectionId: CollectionId }) => {
  try {
    if (!params.walletAddress) return null;

    const { walletAddress, sortBy, sortDirection, collectionId } = params;
    const data = await arcClient.getNftsByCollection({ walletAddress, sortBy, sortDirection, collectionId });
    return data;
  } catch (error) {
    logger.error(new RainbowError('Failed to fetch collection data', error), {
      collectionId: params.collectionId,
    });
    return null;
  }
};

export type RawCollectionResponse = Awaited<ReturnType<typeof fetchCollections>>;

export const createNftsStore = (address: Address | string) =>
  createQueryStore<RawCollectionResponse, NftParams, NftsState, NftStore>(
    {
      fetcher: fetchCollections,
      transform: (data, params) => {
        if (!data?.nftCollections?.length || !params.walletAddress) {
          return { collections: new Map() } satisfies NftStore;
        }
        return {
          collections: new Map(
            data.nftCollections.map(item => [
              item.collection_id,
              {
                image: item.collection_details.image_url,
                name: item.collection_details.name,
                total: item.nft_ids.length.toString(),
                nftIds: item.nft_ids ?? [],
              },
            ])
          ),
        } satisfies NftStore;
      },
      setData: ({ data, set }) => {
        if (!data?.collections.size) return;
        set({ collections: new Map(data.collections) });
      },
      keepPreviousData: true,
      cacheTime: time.hours(1),
      staleTime: time.seconds(10),
      params: {
        walletAddress: address,
        sortBy: $ => $(nftsStoreManager, state => state.sortBy),
        sortDirection: $ => $(nftsStoreManager, state => state.sortDirection),
      },
    },
    (set, get) => ({
      address,
      collections: new Map(),
      nftsByCollection: new Map(),
      getCollection: collectionId => get().collections.get(collectionId),
      getCollections: () => Array.from(get().collections.values()),
      getNftsByCollection: collectionId => get().nftsByCollection.get(collectionId),
      getNft: (collectionId, uniqueId) => get().nftsByCollection.get(collectionId)?.get(uniqueId),

      fetchNftsForCollection: async collectionId => {
        const { queryKey, nftsByCollection } = get();
        const [sortBy, sortDirection, walletAddress] = JSON.parse(queryKey);

        if (!walletAddress || !sortBy || !sortDirection) return;

        const data = await fetchNftsForCollection({ walletAddress, sortBy, sortDirection, collectionId });

        if (!data?.nftsByCollection?.length) return;

        const nftsForCollection = new Map();

        data.nftsByCollection.forEach(item => {
          nftsForCollection.set(item.nft_id!, simpleHashNFTToUniqueAsset(item, walletAddress));
        });

        console.log({
          nftsByCollection,
          nftsForCollection,
        });

        set({
          nftsByCollection: new Map(nftsByCollection).set(collectionId, nftsForCollection),
        });
      },
    }),

    address.length
      ? {
          partialize: state =>
            ({
              collections: state.collections,
              nftsByCollection: state.nftsByCollection,
            }) satisfies NftsStateRequiredForPersistence,
          storageKey: `nfts_${address}`,
          version: 1,
        }
      : undefined
  );
