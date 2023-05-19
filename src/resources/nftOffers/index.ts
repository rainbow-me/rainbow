import { NFT_OFFERS, useExperimentalFlag } from '@/config';
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
  enabled = true,
}: {
  walletAddress: string;
  sortBy?: SortCriterion;
  enabled?: boolean;
}) {
  const nftOffersEnabled = useExperimentalFlag(NFT_OFFERS);
  return useQuery<GetNftOffersQuery>(
    nftOffersQueryKey({ address: walletAddress, sortCriterion: sortBy }),
    async () => await arcClient.getNFTOffers({ walletAddress, sortBy }),
    {
      enabled: enabled && nftOffersEnabled && !!walletAddress,
      staleTime: STALE_TIME,
    }
  );
}
