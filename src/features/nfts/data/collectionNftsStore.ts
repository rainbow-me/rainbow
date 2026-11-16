import { type Address } from 'viem';

import { type UniqueAsset } from '@/entities/uniqueAssets';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { arcClient } from '@/graphql';
import { type GetNftsByCollectionQuery } from '@/graphql/__generated__/arc';
import { parseUniqueAsset } from '@/resources/nfts/utils';
import { createQueryCollectionStore } from '@/state/internal/createQueryCollectionStore';
import { NFTS_STALE_TIME } from '@/state/nfts/constants';

// ============ Types ========================================================== //

export type CollectionNfts = Map<string, UniqueAsset>;

type CollectionParams = { walletAddress: Address; collectionId: string };

// ============ Collection NFTs ================================================ //

export const useCollectionNftsStore = createQueryCollectionStore<CollectionParams, CollectionNfts>(
  {
    key: params => `${params.walletAddress.toLowerCase()}:${params.collectionId.toLowerCase()}`,
    fetcher: async (params, signal) => {
      const data = await arcClient.getNftsByCollection(params, { signal });
      return parseNfts(data.nftsByCollection);
    },
    staleTime: NFTS_STALE_TIME,
    cacheTime: Infinity,
  },
  { storageKey: 'collectionNftsStore' }
);

/**
 * Parses each NFT once at admission, retaining the backend's order.
 */
function parseNfts(data: GetNftsByCollectionQuery['nftsByCollection']): CollectionNfts {
  const chainIds = useBackendNetworksStore.getState().getChainsIdByName();
  const nfts: CollectionNfts = new Map();
  for (const nft of data) nfts.set(nft.uniqueId.toLowerCase(), parseUniqueAsset(nft, chainIds));
  return nfts;
}
