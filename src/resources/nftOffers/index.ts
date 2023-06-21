import { NFT_OFFERS, useExperimentalFlag } from '@/config';
import { IS_PROD } from '@/env';
import { arcClient, arcDevClient } from '@/graphql';
import { GetNftOffersQuery, SortCriterion } from '@/graphql/__generated__/arc';
import { createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';

const graphqlClient = IS_PROD ? arcClient : arcDevClient;

export const nftOffersQueryKey = ({
  address,
  sortCriterion,
}: {
  address: string;
  sortCriterion: SortCriterion;
}) => createQueryKey('nftOffers', { address, sortCriterion });

/**
 * React Query hook that returns the the most profitable `NftOffer` for each NFT owned by the given wallet address.
 * @param walletAddress The wallet address to query for.
 * @param sortBy How the offers should be sorted. Defaults to `SortCriterion.TopBidValue`.
 * @returns an NftOffer[] located at `returnValue.data.nftOffers`.
 */
export function useNFTOffers({
  walletAddress,
  sortBy = SortCriterion.TopBidValue,
}: {
  walletAddress: string;
  sortBy?: SortCriterion;
}) {
  const nftOffersEnabled = useExperimentalFlag(NFT_OFFERS);
  return useQuery<GetNftOffersQuery>(
    nftOffersQueryKey({ address: walletAddress, sortCriterion: sortBy }),
    async () => await graphqlClient.getNFTOffers({ walletAddress, sortBy }),
    {
      enabled: nftOffersEnabled && !!walletAddress,
      staleTime: 60_000, // 1 minute
      cacheTime: 300_000, // 5 minutes
      refetchInterval: 300_000, // 5 minutes
    }
  );
}
