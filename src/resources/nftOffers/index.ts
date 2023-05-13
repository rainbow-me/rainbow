import { arcClient } from '@/graphql';
import { NftOffer, SortCriterion } from '@/graphql/__generated__/nfts';
import { createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';

const STALE_TIME = 600000; // 10 minutes

export const nftOffersQueryKey = ({
  address,
  sortCriterion,
}: {
  address: string;
  sortCriterion: SortCriterion;
}) => createQueryKey('nftOffers', { address, sortCriterion });

type QueryResult = {
  data: { nftOffers: NftOffer[] };
  isLoading: boolean;
  error: Error;
};

export function useNFTOffers({
  walletAddress,
  sortBy = SortCriterion.TopBidValue,
}: {
  walletAddress: string;
  sortBy?: SortCriterion;
}): QueryResult {
  return useQuery(
    nftOffersQueryKey({ address: walletAddress, sortCriterion: sortBy }),
    async () => await arcClient.getNFTOffers({ walletAddress, sortBy }),
    {
      enabled: !!walletAddress,
      // staleTime: STALE_TIME,
      staleTime: 0,
    }
  );
}
