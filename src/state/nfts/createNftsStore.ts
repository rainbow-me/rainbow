import { Address } from 'viem';
import { arcClient } from '@/graphql';
import { logger, RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils';
import { nftsStoreManager } from './nftsStoreManager';
import { NftsState, NftParams, NftStore, NftsStateRequiredForPersistence, CollectionName, UniqueId } from './types';

const fetchCollections = async (params: NftParams) => {
  try {
    if (!params.walletAddress) return null;

    const { walletAddress, sortBy, sortDirection } = params;
    const data = await arcClient.getNftCollections({ walletAddress, sortBy, sortDirection });
    return data;
  } catch (error) {
    logger.error(new RainbowError('Failed to fetch NFT data', error));
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
                uniqueId: item.collection_id,
                image: item.collection_details.image_url,
                name: item.collection_details.name,
                total: item.total_copies_owned,
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
      staleTime: time.minutes(10),
      params: {
        walletAddress: address,
        sortBy: $ => $(nftsStoreManager, state => state.sortBy),
        sortDirection: $ => $(nftsStoreManager, state => state.sortDirection),
      },
    },
    (_, get) => ({
      address,
      collections: new Map(),
      nftsByCollection: new Map(),
      getCollection: (name: CollectionName) => get().collections.get(name),
      getCollections: () => Array.from(get().collections.values()),
      getNftsByCollection: (collectionName: CollectionName) => get().nftsByCollection.get(collectionName),
      getNft: (collectionName: CollectionName, uniqueId: UniqueId) => get().nftsByCollection.get(collectionName)?.get(uniqueId),
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
