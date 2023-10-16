import { analyticsV2 } from '@/analytics';
import { nftOffersSortAtom } from '@/components/nft-offers/SortMenu';
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
import { useEffect, useMemo } from 'react';
import { useRecoilValue } from 'recoil';

const graphqlClient = IS_PROD ? arcClient : arcDevClient;

export const nftOffersQueryKey = ({ address }: { address: string }) =>
  createQueryKey('nftOffers', { address }, { persisterVersion: 1 });

/**
 * React Query hook that returns the the most profitable `NftOffer` for each NFT owned by the given wallet address.
 * @param walletAddress The wallet address to query for.
 * @param sortBy How the offers should be sorted. Defaults to `SortCriterion.TopBidValue`.
 * @returns an NftOffer[] located at `returnValue.data.nftOffers`.
 */
export function useNFTOffers({ walletAddress }: { walletAddress: string }) {
  const nftOffersEnabled = useExperimentalFlag(NFT_OFFERS);
  const sortCriterion = useRecoilValue(nftOffersSortAtom);
  const queryKey = nftOffersQueryKey({
    address: walletAddress,
  });

  const query = useQuery<GetNftOffersQuery>(
    queryKey,
    async () =>
      await graphqlClient.getNFTOffers({
        walletAddress,
        // TODO: remove sortBy once the backend supports it
        sortBy: SortCriterion.TopBidValue,
      }),
    {
      enabled: nftOffersEnabled && !!walletAddress,
      staleTime: 60_000, // 1 minute
      cacheTime: 300_000, // 5 minutes
      refetchInterval: 300_000, // 5 minutes
    }
  );

  const sortedByValue = useMemo(
    () =>
      query.data?.nftOffers
        ?.slice()
        .sort((a, b) => b.netAmount.usd - a.netAmount.usd),
    [query.data?.nftOffers]
  );

  const sortedByFloorDifference = useMemo(
    () =>
      query.data?.nftOffers
        ?.slice()
        .sort(
          (a, b) => b.floorDifferencePercentage - a.floorDifferencePercentage
        ),
    [query.data?.nftOffers]
  );

  const sortedByDate = useMemo(
    () =>
      query.data?.nftOffers?.slice().sort((a, b) => b.createdAt - a.createdAt),
    [query.data?.nftOffers]
  );

  let sortedOffers;
  switch (sortCriterion) {
    case SortCriterion.TopBidValue:
      sortedOffers = sortedByValue;
      break;
    case SortCriterion.FloorDifferencePercentage:
      sortedOffers = sortedByFloorDifference;
      break;
    case SortCriterion.DateCreated:
      sortedOffers = sortedByDate;
      break;
    default:
      sortedOffers = query.data?.nftOffers;
  }

  useEffect(() => {
    const nftOffers = query.data?.nftOffers ?? [];
    const totalUSDValue = nftOffers.reduce(
      (acc: number, offer: NftOffer) => acc + offer.grossAmount.usd,
      0
    );
    const offerVarianceArray = nftOffers.map(
      offer => offer.floorDifferencePercentage / 100
    );
    offerVarianceArray.sort((a, b) => a - b);

    // calculate median offer variance
    const middleIndex = Math.floor(offerVarianceArray.length / 2);
    let medianVariance;
    if (offerVarianceArray.length % 2 === 0) {
      medianVariance =
        (offerVarianceArray[middleIndex - 1] +
          offerVarianceArray[middleIndex]) /
        2;
    } else {
      medianVariance = offerVarianceArray[middleIndex];
    }

    // calculate mean offer variance
    const meanVariance =
      offerVarianceArray.reduce((acc, cur) => acc + cur, 0) /
      offerVarianceArray.length;

    analyticsV2.identify({
      nftOffersAmount: nftOffers.length,
      nftOffersUSDValue: totalUSDValue,
      nftOffersMedianOfferVariance: medianVariance,
      nftOffersMeanOfferVariance: meanVariance,
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

  return { ...query, data: { ...query.data, nftOffers: sortedOffers } };
}
