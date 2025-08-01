import { QueryFunction, useQuery } from '@tanstack/react-query';
import { QueryConfigWithSelect, createQueryKey, queryClient } from '@/react-query';
import { SimpleHashListing } from '@/resources/nfts/simplehash/types';
import { simpleHashNFTToUniqueAsset } from '@/resources/nfts/simplehash/utils';
import { UniqueAsset } from '@/entities';
import { arcClient } from '@/graphql';
import { ChainId } from '@/state/backendNetworks/types';
import { time } from '@/utils/time';

const NFTS_STALE_TIME = time.minutes(10);
const NFTS_CACHE_TIME = time.minutes(10);

export const nftsQueryKey = ({ address }: { address: string }) => createQueryKey('legacy-nfts', { address }, { persisterVersion: 3 });

export const invalidateAddressNftsQueries = (address: string) => {
  queryClient.invalidateQueries(nftsQueryKey({ address }));
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

export interface NFTData {
  nfts: UniqueAsset[];
  nftIndexMap: Record<string, number>;
}

type NFTQueryKey = ReturnType<typeof nftsQueryKey>;

const STABLE_OBJECT = Object.freeze({});
const STABLE_ARRAY: UniqueAsset[] = [];

export const fetchNFTData: QueryFunction<NFTData, NFTQueryKey> = async ({ queryKey }) => {
  const [{ address }] = queryKey;
  const queryResponse = await arcClient.getNFTs({ walletAddress: address });

  const nfts = queryResponse?.nftsV2?.map(nft => simpleHashNFTToUniqueAsset(nft, address));

  const nftIndexMap = nfts?.reduce<Record<string, number>>((acc, nft, index) => {
    acc[nft.uniqueId.toLowerCase()] = index;
    return acc;
  }, {});

  return { nfts: nfts ?? STABLE_ARRAY, nftIndexMap: nftIndexMap ?? STABLE_OBJECT };
};

const FALLBACK_DATA: NFTData = { nfts: STABLE_ARRAY, nftIndexMap: STABLE_OBJECT };

export const useLegacyNFTs = function useLegacyNFTs<TSelected = NFTData>({
  address,
  config,
}: {
  address: string;
  config?: QueryConfigWithSelect<NFTData, unknown, TSelected, NFTQueryKey>;
}) {
  const { data, error, isLoading, isInitialLoading } = useQuery(nftsQueryKey({ address }), fetchNFTData, {
    cacheTime: NFTS_CACHE_TIME,
    enabled: !!address,
    staleTime: NFTS_STALE_TIME,
    ...config,
  });

  return {
    data: (config?.select ? data ?? config.select(FALLBACK_DATA) : data ?? FALLBACK_DATA) as TSelected,
    error,
    isLoading,
    isInitialLoading,
  };
};

const NULL_LISTING: { data: SimpleHashListing | null; error: null; isInitialLoading: false; isLoading: false } = {
  data: null,
  error: null,
  isInitialLoading: false,
  isLoading: false,
};

// Relies on SimpleHash API
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useNFTListing(_: { contractAddress: string; tokenId: string; chainId: Omit<ChainId, ChainId.goerli> }) {
  return NULL_LISTING;
  // return useQuery(
  //   nftListingQueryKey({ contractAddress, tokenId, chainId }),
  //   async () => (await fetchSimpleHashNFTListing(contractAddress, tokenId, chainId)) ?? null,
  //   {
  //     enabled: !!chainId && !!contractAddress && !!tokenId,
  //     staleTime: time.seconds(30),
  //     cacheTime: time.seconds(30),
  //   }
  // );
}
