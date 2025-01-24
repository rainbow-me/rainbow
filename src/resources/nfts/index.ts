import { useQuery } from '@tanstack/react-query';
import { createQueryKey, queryClient } from '@/react-query';
import { fetchSimpleHashNFTListing } from '@/resources/nfts/simplehash';
import { simpleHashNFTToUniqueAsset } from '@/resources/nfts/simplehash/utils';
import { UniqueAsset } from '@/entities';
import { arcClient } from '@/graphql';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { ChainId } from '@/state/backendNetworks/types';

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

export const fetchUserNfts = async ({
  address,
  sortBy,
  sortDirection,
}: {
  address: string;
  sortBy: NftCollectionSortCriterion;
  sortDirection: SortDirection;
}) => {
  const queryResponse = await arcClient.getNFTs({ walletAddress: address, sortBy, sortDirection });
  const nfts = queryResponse?.nftsV2?.map(nft => simpleHashNFTToUniqueAsset(nft, address));

  const map = new Map<string, UniqueAsset>();
  // ⚠️ TODO: Delete this and rework the code that uses it
  const nftsMap = nfts?.reduce((acc, nft) => {
    // Track down why these both exist - we should not be doing this
    acc.set(nft.uniqueId, nft);
    acc.set(nft.fullUniqueId, nft);
    return acc;
  }, map);

  return {
    nfts: nfts || [],
    nftsMap: nftsMap ?? map,
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
