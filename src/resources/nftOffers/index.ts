import { arcClient } from '@/graphql';
import { GetNftOffersQuery, SortCriterion } from '@/graphql/__generated__/arc';
import { createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';

const STALE_TIME = 60000; // 1 minute

export const nftOffersQueryKey = ({
  address,
  sortCriterion,
}: {
  address: string;
  sortCriterion: SortCriterion;
}) => createQueryKey('nftOffers', { address, sortCriterion });

export function useNFTOffers({
  walletAddress,
  sortBy = SortCriterion.TopBidValue,
}: {
  walletAddress: string;
  sortBy?: SortCriterion;
}) {
  return useQuery<GetNftOffersQuery>(
    nftOffersQueryKey({ address: walletAddress, sortCriterion: sortBy }),
    async () => await arcClient.getNFTOffers({ walletAddress, sortBy }),
    {
      enabled: !!walletAddress,
      staleTime: STALE_TIME,
    }
  );
}
