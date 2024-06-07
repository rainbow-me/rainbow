import { QueryFunction, useQuery } from '@tanstack/react-query';
import { QueryConfigWithSelect, createQueryKey } from '@/react-query';
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

export const nftsQueryKey = ({ address }: { address: string }) => createQueryKey('nfts', { address }, { persisterVersion: 3 });

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
