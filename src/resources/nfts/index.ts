import { useQuery } from '@tanstack/react-query';
import { createQueryKey, queryClient } from '@/react-query';
import { fetchSimpleHashNFTListing } from '@/resources/nfts/simplehash';
import { simpleHashCollectionToUniqueAssetFamily, simpleHashNFTToUniqueAsset } from '@/resources/nfts/simplehash/utils';
import { AppState } from '@/redux/store';
import { UniqueAsset } from '@/entities';
import { arcClient } from '@/graphql';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { createSelector } from 'reselect';
import { ChainId } from '@/state/backendNetworks/types';
import { UniqueAssetFamily } from '@/entities/uniqueAssets';

export const nftsQueryKey = ({
  address,
  sortBy,
  sortDirection,
}: {
  address: string;
  sortBy: NftCollectionSortCriterion;
  sortDirection: SortDirection;
}) => createQueryKey('nfts', { address, sortBy, sortDirection }, { persisterVersion: 1 });

export const invalidateAddressNftsQueries = (address: string) => {
  queryClient.invalidateQueries(createQueryKey('nfts', { address }));
};

export const nftListingQueryKey = ({
  contractAddress,
  tokenId,
  chainId,
}: {
  contractAddress: string;
  tokenId: string;
  chainId: Omit<ChainId, ChainId.goerli>;
}) => createQueryKey('nftListing', { contractAddress, tokenId, chainId });

const walletsSelector = (state: AppState) => state.wallets?.wallets;

const isImportedWalletSelector = createSelector(
  walletsSelector,
  (_: AppState, address: string) => address,
  (wallets, address) => {
    if (!wallets) {
      return false;
    }
    for (const wallet of Object.values(wallets)) {
      if ((wallet.addresses || []).some(account => account.address === address)) {
        return true;
      }
    }
    return false;
  }
);

export const fetchUserNfts = async ({
  address,
  sortBy,
  sortDirection,
}: {
  address?: string | null;
  sortBy: NftCollectionSortCriterion;
  sortDirection: SortDirection;
  collectionIds?: string[];
}) => {
  const nftsMap = new Map<string, UniqueAsset>();

  if (!address) {
    return {
      nfts: [],
      nftsMap,
    };
  }
  const queryResponse = await arcClient.getNFTs({ walletAddress: address, sortBy, sortDirection });
  const nfts = queryResponse?.nftsV2?.map(nft => simpleHashNFTToUniqueAsset(nft, address));

  // ⚠️ TODO: Delete this and rework the code that uses it
  nfts?.forEach(nft => {
    // Track down why these both exist - we should not be doing this
    nftsMap.set(nft.uniqueId, nft);
    nftsMap.set(nft.fullUniqueId, nft);
  });

  return {
    nfts: nfts || [],
    nftsMap,
    address,
  };
};

export const fetchUserNftCollections = async ({
  address,
  sortBy,
  sortDirection,
}: {
  address?: string | null;
  sortBy: NftCollectionSortCriterion;
  sortDirection: SortDirection;
}) => {
  if (!address) {
    return {
      collections: new Map<string, UniqueAssetFamily>(),
    };
  }

  const response = await arcClient.getNFTCollections({
    walletAddress: address,
    sortBy,
    sortDirection,
  });

  const collections = new Map<string, UniqueAssetFamily>();
  response?.nftCollections?.forEach(collection => {
    collections.set(collection.collection_id, simpleHashCollectionToUniqueAssetFamily(collection));
  });
  return {
    collections,
  };
};

export const fetchUserNftsByCollection = async ({ address, collectionId }: { address?: string | null; collectionId?: string }) => {
  if (!address || !collectionId) {
    return {
      nfts: new Map<string, UniqueAsset>(),
    };
  }
  const response = await arcClient.getNFTsByCollection({
    walletAddress: address,
    sortBy: NftCollectionSortCriterion.MostRecent,
    sortDirection: SortDirection.Asc,
    collectionId,
  });
  const nfts = new Map<string, UniqueAsset>();
  response?.nftsByCollection?.forEach(nft => {
    const uniqueAsset = simpleHashNFTToUniqueAsset(nft, address);
    nfts.set(uniqueAsset.fullUniqueId, uniqueAsset);
  });
  return {
    nfts,
  };
};

export function useNFTListing({
  contractAddress,
  tokenId,
  chainId,
}: {
  contractAddress: string;
  tokenId: string;
  chainId: Omit<ChainId, ChainId.goerli>;
}) {
  return useQuery(
    nftListingQueryKey({ contractAddress, tokenId, chainId }),
    async () => (await fetchSimpleHashNFTListing(contractAddress, tokenId, chainId)) ?? null,
    {
      enabled: !!chainId && !!contractAddress && !!tokenId,
      staleTime: 0,
      cacheTime: 0,
    }
  );
}
