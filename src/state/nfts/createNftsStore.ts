import { Address } from 'viem';
import { arcClient } from '@/graphql';
import { logger, RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils';
import { simpleHashNFTToUniqueAsset } from '@/resources/nfts/simplehash/utils';
import { nftsStoreManager } from './nftsStoreManager';
import { NftsState, NftParams, NftStore } from './types';

const fetchNfts = async (params: NftParams) => {
  try {
    if (!params.walletAddress) return null;

    const { walletAddress, sortBy, sortDirection } = params;
    const data = await arcClient.getNFTs({ walletAddress, sortBy, sortDirection });
    return data;
  } catch (error) {
    logger.error(new RainbowError('Failed to fetch NFT data', error));
    return null;
  }
};

export type RawNftResponse = Awaited<ReturnType<typeof fetchNfts>>;

export const createNftsStore = (address: Address | string) =>
  createQueryStore<RawNftResponse, NftParams, NftsState, NftStore>(
    {
      fetcher: fetchNfts,
      transform: (data, params) => {
        if (!data?.nftsV2?.length || !params.walletAddress) {
          return { nfts: new Map() } satisfies NftStore;
        }
        const nfts = data.nftsV2.map(nft => simpleHashNFTToUniqueAsset(nft, params.walletAddress));
        return { nfts: new Map(nfts.map(item => [item.uniqueId, item])) } satisfies NftStore;
      },
      setData: ({ data, set }) => {
        if (!data?.nfts || !data.nfts.size) return;

        set(state => {
          const nftsMap = new Map(state.nfts);
          for (const [uniqueId, asset] of data.nfts) {
            nftsMap.set(uniqueId, asset);
          }
          return { nfts: nftsMap };
        });
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
      nfts: new Map(),
      getNft: uniqueId => get().nfts.get(uniqueId) || null,
      getNfts: () => Array.from(get().nfts.values()),
      getUniqueIds: () => Array.from(get().nfts.keys()),
    }),

    address.length
      ? {
          partialize: state => ({ nfts: state.nfts }) satisfies NftStore,
          storageKey: `nfts_${address}`,
          version: 1,
        }
      : undefined
  );
