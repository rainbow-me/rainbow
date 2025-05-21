import { UniqueAsset } from '@/entities';
import { arcClient } from '@/graphql';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { logger, RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils';
import { Address } from 'viem';
import { simpleHashNFTToUniqueAsset } from './simplehash/utils';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

type UniqueId = string;
type NftParams = {
  walletAddress: Address | string | null;
  sortBy: NftCollectionSortCriterion;
  sortDirection: SortDirection;
};

const fetchNfts = async (params: NftParams) => {
  try {
    const data = await arcClient.getNFTs(params);
    return data;
  } catch (error) {
    logger.error(new RainbowError('Failed to fetch NFT data', error));
    return null;
  }
};

type NftResponse = Awaited<ReturnType<typeof fetchNfts>>;

type NftStore = {
  nfts: Map<UniqueId, UniqueAsset>;
};

type NftState = {
  sortBy: NftCollectionSortCriterion;
  sortDirection: SortDirection;
  setSortBy: (sortBy: NftCollectionSortCriterion) => void;
  setSortDirection: (sortDirection: SortDirection) => void;
};

// @ts-expect-error TODO - should this be stored per address as it currently is?
// seems like a waste of storage space if you ask me
export const nftsStoreStore = createRainbowStore<NftState>(
  set => ({
    sortBy: NftCollectionSortCriterion.MostRecent,
    sortDirection: SortDirection.Desc,
    setSortBy: (sortBy: NftCollectionSortCriterion) => set({ sortBy }),
    setSortDirection: (sortDirection: SortDirection) => set({ sortDirection }),
  }),
  {
    storageKey: 'nfts-sort',
    version: 1,
  }
);

export const nftsStore = createQueryStore<NftResponse, NftParams, undefined, NftStore>(
  {
    fetcher: fetchNfts,
    cacheTime: time.hours(1),
    staleTime: time.minutes(10),
    transform(data, params) {
      if (!data?.nftsV2 || data.nftsV2?.length === 0) {
        return {
          nfts: new Map(),
        };
      }

      const nfts = data.nftsV2.map(nft => simpleHashNFTToUniqueAsset(nft, params.walletAddress));
      return {
        nfts: new Map(nfts.map(nft => [nft.uniqueId, nft])),
      };
    },
    params: {
      walletAddress: $ => $(userAssetsStoreManager, state => state.address),
      sortBy: $ => $(nftsStoreStore, state => state.sortBy),
      sortDirection: $ => $(nftsStoreStore, state => state.sortDirection),
    },
  },
  () => {},
  {
    storageKey: 'nfts',
    version: 1,
  }
);
