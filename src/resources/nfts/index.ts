import { QueryFunction, UseInfiniteQueryResult, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { QueryConfigWithSelect, createQueryKey } from '@/react-query';
import { fetchSimpleHashNFTListing } from '@/resources/nfts/simplehash';
import { simpleHashNFTToUniqueAsset } from '@/resources/nfts/simplehash/utils';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { Network } from '@/helpers';
import { UniqueAsset } from '@/entities';
import { arcClient } from '@/graphql';
import { createSelector } from 'reselect';

const NFTS_STALE_TIME = 600000; // 10 minutes
const NFTS_CACHE_TIME_EXTERNAL = 3600000; // 1 hour
const NFTS_CACHE_TIME_INTERNAL = 604800000; // 1 week

export const nftsQueryKey = ({ address }: { address: string }) => createQueryKey('nfts', { address }, { persisterVersion: 3 });
export const nftsByPageQueryKey = ({ address, limit }: { address: string; limit: number }) =>
  createQueryKey('nfts-by-page', { address, limit }, { persisterVersion: 1 });

export const nftListingQueryKey = ({
  contractAddress,
  tokenId,
  network,
}: {
  contractAddress: string;
  tokenId: string;
  network: Omit<Network, Network.goerli>;
}) => createQueryKey('nftListing', { contractAddress, tokenId, network });

const walletsSelector = (state: AppState) => state.wallets?.wallets;

const isImportedWalletSelector = createSelector(
  walletsSelector,
  (_: AppState, address: string) => address,
  (wallets, address) => {
    if (!wallets) {
      return false;
    }
    for (const wallet of Object.values(wallets)) {
      if (wallet.addresses.some(account => account.address === address)) {
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

interface NFTsByPageData {
  data: UniqueAsset[];
  previousCursor?: string;
  nextCursor?: string;
}

type NFTQueryKey = ReturnType<typeof nftsQueryKey>;

const fetchNFTData: QueryFunction<NFTData, NFTQueryKey> = async ({ queryKey }) => {
  const [{ address }] = queryKey;
  const queryResponse = await arcClient.getNFTs({ walletAddress: address });

  const nfts = queryResponse?.nfts?.map(nft => simpleHashNFTToUniqueAsset(nft, address));

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

export function usePaginatedNFTs({
  address,
  cursor = 'start',
  limit = 50,
  config,
}: {
  address: string;
  cursor?: string;
  limit?: number;
  config?: any; // what the hell is this type supposed to be.. InfiniteQueryConfig does NOT work
}): UseInfiniteQueryResult<NFTsByPageData, unknown> {
  const isImportedWallet = useSelector((state: AppState) => isImportedWalletSelector(state, address));

  const queryKey = nftsByPageQueryKey({ address, limit });

  return useInfiniteQuery<NFTsByPageData, unknown>(
    queryKey,
    async ({ pageParam = cursor }) => {
      const queryResponse = await arcClient.getNFTsByPage({
        walletAddress: address,
        cursor: pageParam || 'start',
        limit,
      });

      const nfts = queryResponse.nftsByPage?.data.map(nft => simpleHashNFTToUniqueAsset(nft, address));
      if (!nfts)
        return {
          ...queryResponse.nftsByPage,
          data: [],
          previousCursor: queryResponse.nftsByPage?.previousCursor ?? undefined, // Ensure it's string or undefined
          nextCursor: queryResponse.nftsByPage?.nextCursor ?? undefined, // Ensure it's string or undefined
        };

      return {
        ...queryResponse.nftsByPage,
        data: nfts,
        previousCursor: queryResponse.nftsByPage?.previousCursor ?? undefined, // Ensure it's string or undefined
        nextCursor: queryResponse.nftsByPage?.nextCursor ?? undefined, // Ensure it's string or undefined
      };
    },
    {
      enabled: !!address,
      cacheTime: isImportedWallet ? NFTS_CACHE_TIME_INTERNAL : NFTS_CACHE_TIME_EXTERNAL,
      retry: 3,
      staleTime: NFTS_STALE_TIME,
      ...config,
    }
  );
}

export function useLegacyNFTs<TSelected = NFTData>({
  address,
  config,
}: {
  address: string;
  config?: QueryConfigWithSelect<NFTData, unknown, TSelected, NFTQueryKey>;
}) {
  const isImportedWallet = useSelector((state: AppState) => isImportedWalletSelector(state, address));

  const { data, error, isFetching } = useQuery(nftsQueryKey({ address }), fetchNFTData, {
    cacheTime: isImportedWallet ? NFTS_CACHE_TIME_INTERNAL : NFTS_CACHE_TIME_EXTERNAL,
    enabled: !!address,
    retry: 3,
    staleTime: NFTS_STALE_TIME,
    ...config,
  });

  return {
    data: (config?.select ? data ?? config.select(FALLBACK_DATA) : data ?? FALLBACK_DATA) as TSelected,
    error,
    isInitialLoading: !data && isFetching,
  };
}

export function useNFTListing({
  contractAddress,
  tokenId,
  network,
}: {
  contractAddress: string;
  tokenId: string;
  network: Omit<Network, Network.goerli>;
}) {
  return useQuery(
    nftListingQueryKey({ contractAddress, tokenId, network }),
    async () => (await fetchSimpleHashNFTListing(contractAddress, tokenId, network)) ?? null,
    {
      enabled: !!network && !!contractAddress && !!tokenId,
      staleTime: 0,
      cacheTime: 0,
    }
  );
}
