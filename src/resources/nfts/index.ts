import { QueryFunction, UseQueryOptions, useQuery } from '@tanstack/react-query';
import { createQueryKey } from '@/react-query';
import { NFT } from '@/resources/nfts/types';
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

export const nftsQueryKey = ({ address }: { address: string }) => createQueryKey('nfts', { address }, { persisterVersion: 2 });

export const nftListingQueryKey = ({
  contractAddress,
  tokenId,
  network,
}: {
  contractAddress: string;
  tokenId: string;
  network: Omit<Network, Network.goerli>;
}) => createQueryKey('nftListing', { contractAddress, tokenId, network });

export function useNFTs(): NFT[] {
  // normal react query where we get new NFT formatted data
  return [];
}

const fetchNFTData: QueryFunction<NFTData, [string, { address: string }]> = async ({ queryKey }) => {
  const [, { address }] = queryKey;
  const queryResponse = await arcClient.getNFTs({ walletAddress: address });

  const nfts = queryResponse?.nfts?.map(nft => simpleHashNFTToUniqueAsset(nft, address));
  const nftsMap = nfts?.reduce(
    (acc, nft) => {
      acc[nft.uniqueId] = nft;
      acc[nft.fullUniqueId] = nft;
      return acc;
    },
    {} as Record<string, UniqueAsset>
  );

  return { nfts: nfts ?? [], nftsMap: nftsMap ?? {} };
};

const FALLBACK_DATA: NFTData = { nfts: [], nftsMap: {} };

interface NFTData {
  nfts: UniqueAsset[];
  nftsMap: Record<string, UniqueAsset>;
}

type UseLegacyNFTsReturnType<TSelected> = TSelected extends undefined ? NFTData : TSelected | undefined;

interface UseLegacyNFTsConfig<TSelected>
  extends Omit<UseQueryOptions<NFTData, unknown, TSelected, [string, { address: string }]>, 'queryKey' | 'queryFn' | 'initialData'> {
  select?: (data: NFTData) => TSelected;
}

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

export function useLegacyNFTs<TSelected = undefined>({
  address,
  config,
}: {
  address: string;
  config?: UseLegacyNFTsConfig<TSelected>;
}): {
  data: UseLegacyNFTsReturnType<TSelected>;
  error: unknown;
  isInitialLoading: boolean;
} {
  const isImportedWallet = useSelector((state: AppState) => isImportedWalletSelector(state, address));

  const queryKey: [string, { address: string }] = ['nfts', { address }];

  const { data, error, isFetching } = useQuery<NFTData, unknown, TSelected, typeof queryKey>(queryKey, fetchNFTData, {
    cacheTime: isImportedWallet ? NFTS_CACHE_TIME_INTERNAL : NFTS_CACHE_TIME_EXTERNAL,
    enabled: !!address,
    placeholderData: FALLBACK_DATA,
    retry: 3,
    staleTime: NFTS_STALE_TIME,
    ...config,
  });

  return {
    data: (data ?? FALLBACK_DATA) as UseLegacyNFTsReturnType<TSelected>,
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
