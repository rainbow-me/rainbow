import { ChainId } from '@/state/backendNetworks/types';

const NULL_LISTING: { data: null; error: null; isInitialLoading: false; isLoading: false } = {
  data: null,
  error: null,
  isInitialLoading: false,
  isLoading: false,
};

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
