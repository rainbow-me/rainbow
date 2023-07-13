import { analyticsV2 } from '@/analytics';
import { NFT_OFFERS, useExperimentalFlag } from '@/config';
import { IS_PROD } from '@/env';
import { arcClient, arcDevClient } from '@/graphql';
import {
  GetNftOffersQuery,
  NftOffer,
  SortCriterion,
} from '@/graphql/__generated__/arc';
import { createQueryKey, queryClient } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

const graphqlClient = IS_PROD ? arcClient : arcDevClient;

export const nftOffersQueryKey = ({
  address,
  sortCriterion,
}: {
  address: string;
  sortCriterion: SortCriterion;
}) =>
  createQueryKey(
    'nftOffers',
    { address, sortCriterion },
    { persisterVersion: 1 }
  );

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
  const queryKey = nftOffersQueryKey({
    address: walletAddress,
    sortCriterion: sortBy,
  });
  const query = useQuery<GetNftOffersQuery>(
    queryKey,
    async () => await graphqlClient.getNFTOffers({ walletAddress, sortBy }),
    {
      enabled: nftOffersEnabled && !!walletAddress,
      staleTime: 60_000, // 1 minute
      cacheTime: 300_000, // 5 minutes
      refetchInterval: 300_000, // 5 minutes
    }
  );

  useEffect(() => {
    const nftOffers = query.data?.nftOffers ?? [];
    const totalUSDValue = nftOffers.reduce(
      (acc: number, offer: NftOffer) => acc + offer.grossAmount.usd,
      0
    );
    analyticsV2.identify({
      nftOffersAmount: nftOffers.length,
      nftOffersUSDValue: totalUSDValue,
    });
  }, [query.data?.nftOffers]);

  // every 1 min check for invalid offers and remove them from the cache
  useEffect(() => {
    const nftOffers = query.data?.nftOffers ?? [];
    if (nftOffers.length) {
      const interval = setInterval(() => {
        const validOffers = nftOffers.filter(
          (offer: NftOffer) =>
            !offer.validUntil || offer.validUntil * 1000 - Date.now() > 0
        );
        if (validOffers.length < nftOffers.length) {
          queryClient.setQueryData(queryKey, { nftOffers: validOffers });
        }
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [query.data?.nftOffers, queryKey]);

  return query;
}
