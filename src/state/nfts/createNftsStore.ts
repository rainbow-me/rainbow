import { Address } from 'viem';
import { arcClient } from '@/graphql';
import { logger, RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils';
import { nftsStoreManager } from './nftsStoreManager';
import { NftsState, NftParams, NftStore, NftsStateRequiredForPersistence } from './types';
import { simpleHashNFTToUniqueAsset } from '@/resources/nfts/simplehash/utils';

const fetchNftData = async (params: NftParams) => {
  try {
    const { walletAddress, sortBy, sortDirection, collectionId } = params;

    if (collectionId) {
      const data = await arcClient.getNftsByCollection({ walletAddress, sortBy, sortDirection, collectionId });
      return data;
    }

    const data = await arcClient.getNftCollections({ walletAddress, sortBy, sortDirection });
    return data;
  } catch (error) {
    logger.error(new RainbowError('Failed to fetch collections data', error));
    return null;
  }
};

export type RawCollectionResponse = Awaited<ReturnType<typeof fetchNftData>>;

export const createNftsStore = (address: Address | string) =>
  createQueryStore<RawCollectionResponse, NftParams, NftsState, NftStore>(
    {
      fetcher: fetchNftData,
      transform: (data, params) => {
        // exit early if no data is returned
        if (!data) return { collections: new Map(), nftsByCollection: new Map() } satisfies NftStore;

        if ('nftCollections' in data) {
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
            nftsByCollection: new Map(),
          };
        }

        const collectionNfts = new Map();
        data.nftsByCollection.forEach(item => {
          collectionNfts.set(item.nft_id!, simpleHashNFTToUniqueAsset(item, params.walletAddress));
        });

        return {
          collections: new Map(),
          nftsByCollection: new Map([[params.collectionId, collectionNfts]]),
        };
      },
      setData: ({ data, set }) => {
        set(state => {
          if (data.collections.size) {
            state.collections = new Map([...data.collections, ...state.collections]);
          }

          if (data.nftsByCollection.size) {
            state.nftsByCollection = new Map([...data.nftsByCollection, ...state.nftsByCollection]);
          }

          return state;
        });
      },
      keepPreviousData: true,
      cacheTime: time.hours(1),
      staleTime: time.minutes(10),
      params: {
        walletAddress: address,
        sortBy: $ => $(nftsStoreManager, state => state.sortBy),
        sortDirection: $ => $(nftsStoreManager, state => state.sortDirection),
        collectionId: undefined,
      },
    },
    (_, get) => ({
      address,
      collectionId: undefined,
      collections: new Map(),
      nftsByCollection: new Map(),
      getCollection: collectionId => get().collections.get(collectionId),
      getCollections: () => Array.from(get().collections.values()),
      getNftsByCollection: collectionId => get().nftsByCollection.get(collectionId),
      getNft: (collectionId, uniqueId) => get().nftsByCollection.get(collectionId)?.get(uniqueId),
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
