import { QueryFunction, useQuery } from '@tanstack/react-query';
import { QueryConfigWithSelect, createQueryKey, queryClient } from '@/react-query';
import { fetchSimpleHashNFTListing } from '@/resources/nfts/simplehash';
import { simpleHashNFTToUniqueAsset } from '@/resources/nfts/simplehash/utils';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { UniqueAsset } from '@/entities';
import { arcClient } from '@/graphql';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { createSelector } from 'reselect';
import { ChainId } from '@/state/backendNetworks/types';

const NFTS_STALE_TIME = 600000; // 10 minutes
const NFTS_CACHE_TIME_EXTERNAL = 3600000; // 1 hour
const NFTS_CACHE_TIME_INTERNAL = 604800000; // 1 week

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

interface NFTData {
  nfts: UniqueAsset[];
  nftsMap: Record<string, UniqueAsset>;
}

type NFTQueryKey = ReturnType<typeof nftsQueryKey>;

const fetchNFTData: QueryFunction<NFTData, NFTQueryKey> = async ({ queryKey }) => {
  const [{ address, sortBy, sortDirection }] = queryKey;
  const queryResponse = await arcClient.getNFTs({ walletAddress: address, sortBy, sortDirection });

  const nfts = queryResponse?.nftsV2?.map(nft => simpleHashNFTToUniqueAsset(nft, address));

  // ⚠️ TODO: Delete this and rework the code that uses it
  const nftsMap = nfts?.reduce(
    (acc, nft) => {
      // Track down why these both exist - we should not be doing this
      acc[nft.uniqueId] = nft;
      acc[nft.fullUniqueId] = nft;
      return acc;
    },
    {} as Record<string, UniqueAsset>
  );

  return { nfts: nfts ?? [], nftsMap: nftsMap ?? {} };
};

const FALLBACK_DATA: NFTData = { nfts: [], nftsMap: {} };

export function useLegacyNFTs<TSelected = NFTData>({
  address,
  sortBy = NftCollectionSortCriterion.MostRecent,
  sortDirection = SortDirection.Desc,
  config,
}: {
  address: string;
  sortBy?: NftCollectionSortCriterion;
  sortDirection?: SortDirection;
  config?: QueryConfigWithSelect<NFTData, unknown, TSelected, NFTQueryKey>;
}) {
  const isImportedWallet = useSelector((state: AppState) => isImportedWalletSelector(state, address));

  const { data, error, isLoading, isInitialLoading } = useQuery(nftsQueryKey({ address, sortBy, sortDirection }), fetchNFTData, {
    cacheTime: isImportedWallet ? NFTS_CACHE_TIME_INTERNAL : NFTS_CACHE_TIME_EXTERNAL,
    enabled: !!address,
    retry: 3,
    staleTime: NFTS_STALE_TIME,
    ...config,
  });

  return {
    data: (config?.select ? data ?? config.select(FALLBACK_DATA) : data ?? FALLBACK_DATA) as TSelected,
    error,
    isLoading,
    isInitialLoading,
  };
}

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
