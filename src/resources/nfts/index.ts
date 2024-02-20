import { useQuery } from '@tanstack/react-query';
import { createQueryKey } from '@/react-query';
import { NFT } from '@/resources/nfts/types';
import { fetchSimpleHashNFTListing } from '@/resources/nfts/simplehash';
import { useMemo } from 'react';
import { simpleHashNFTToUniqueAsset } from '@/resources/nfts/simplehash/utils';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { Network } from '@/helpers';
import { UniqueAsset } from '@/entities';
import { arcClient } from '@/graphql';

const NFTS_STALE_TIME = 300000; // 5 minutes
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

export function useLegacyNFTs({ address }: { address: string }) {
  const { wallets } = useSelector((state: AppState) => state.wallets);

  const walletAddresses = useMemo(
    () => (wallets ? Object.values(wallets).flatMap(wallet => wallet.addresses.map(account => account.address)) : []),
    [wallets]
  );
  const isImportedWallet = walletAddresses.includes(address);

  const { data, error, isFetching } = useQuery({
    queryKey: nftsQueryKey({ address }),
    queryFn: async () => {
      const queryResponse = await arcClient.getNFTs({ walletAddress: address });
      const nfts = queryResponse?.nfts?.map(nft => simpleHashNFTToUniqueAsset(nft, address));
      return nfts;
    },
    staleTime: NFTS_STALE_TIME,
    retry: 3,
    cacheTime: isImportedWallet ? NFTS_CACHE_TIME_INTERNAL : NFTS_CACHE_TIME_EXTERNAL,
    enabled: !!address,
  });

  const nfts = useMemo(() => data ?? [], [data]);

  const nftsMap = useMemo(
    () =>
      nfts.reduce(
        (acc, nft) => {
          // index by both uniqueId and fullUniqueId bc why not
          acc[nft.uniqueId] = nft;
          acc[nft.fullUniqueId] = nft;
          return acc;
        },
        {} as { [key: string]: UniqueAsset }
      ),
    [nfts]
  );

  return {
    data: { nfts, nftsMap },
    error,
    isInitialLoading: !data?.length && isFetching,
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
