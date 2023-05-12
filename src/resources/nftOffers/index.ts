import { nftsClient } from '@/graphql';
import { SortCriteria } from '@/graphql/__generated__/nfts';
import { createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';

const STALE_TIME = 600000; // 10 minutes

export const nftOffersQueryKey = ({ address }: { address: string }) =>
  createQueryKey('nftOffers', { address });

export function useNFTOffers({
  walletAddress,
  sortBy,
}: {
  walletAddress: string;
  sortBy?: SortCriteria;
}) {
  return useQuery(
    nftOffersQueryKey({ address: walletAddress }),
    async () => await nftsClient.getNFTOffers({ walletAddress, sortBy }),
    {
      enabled: !!walletAddress,
      staleTime: STALE_TIME,
    }
  );
}
