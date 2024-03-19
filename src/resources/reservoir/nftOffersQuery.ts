import { analyticsV2 } from '@/analytics';
import { nftOffersSortAtom } from '@/components/nft-offers/SortMenu';
import { NFT_OFFERS, useExperimentalFlag } from '@/config';
import { arcClient } from '@/graphql';
import { GetNftOffersQuery, NftOffer, SortCriterion } from '@/graphql/__generated__/arc';
import { QueryFunctionArgs, QueryFunctionResult, createQueryKey, queryClient } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useRecoilValue } from 'recoil';

export type NFTOffersArgs = {
  walletAddress: string;
  sortBy?: SortCriterion;
};

function sortNftOffers(nftOffers: NftOffer[], sortCriterion: SortCriterion) {
  let sortedOffers;
  switch (sortCriterion) {
    case SortCriterion.TopBidValue:
      sortedOffers = nftOffers.slice().sort((a, b) => b.netAmount.usd - a.netAmount.usd);
      break;
    case SortCriterion.FloorDifferencePercentage:
      sortedOffers = nftOffers.slice().sort((a, b) => b.floorDifferencePercentage - a.floorDifferencePercentage);
      break;
    case SortCriterion.DateCreated:
      sortedOffers = nftOffers.slice().sort((a, b) => b.createdAt - a.createdAt);
      break;
    default:
      sortedOffers = nftOffers;
  }
  return sortedOffers;
}

export const nftOffersQueryKey = ({ walletAddress, sortBy = SortCriterion.TopBidValue }: NFTOffersArgs) =>
  createQueryKey('nftOffers', { walletAddress, sortBy }, { persisterVersion: 1 });

type NFTOffersQueryKey = ReturnType<typeof nftOffersQueryKey>;

async function nftOffersQueryFunction({ queryKey: [{ walletAddress, sortBy }] }: QueryFunctionArgs<typeof nftOffersQueryKey>) {
  const data = await arcClient.getNFTOffers({
    walletAddress,
    sortBy,
  });
  return data;
}

export type NftOffersResult = QueryFunctionResult<typeof nftOffersQueryFunction>;

export async function fetchNftOffers({ walletAddress, sortBy = SortCriterion.TopBidValue }: NFTOffersArgs) {
  const data = await arcClient.getNFTOffers({
    walletAddress,
    // TODO: remove sortBy once the backend supports it
    sortBy: SortCriterion.TopBidValue,
  });

  if (!data?.nftOffers) {
    return null;
  }

  const sortedOffers = sortNftOffers(data.nftOffers, sortBy);
  return { ...data, nftOffers: sortedOffers };
}

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
    walletAddress,
  });

  const query = useQuery<GetNftOffersQuery>(
    queryKey,
    async () =>
      await arcClient.getNFTOffers({
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

  const sortedOffers = sortNftOffers(query.data?.nftOffers || [], sortCriterion);

  useEffect(() => {
    const nftOffers = query.data?.nftOffers ?? [];
    const totalUSDValue = nftOffers.reduce((acc: number, offer: NftOffer) => acc + offer.grossAmount.usd, 0);
    const offerVarianceArray = nftOffers.map(offer => offer.floorDifferencePercentage / 100);
    offerVarianceArray.sort((a, b) => a - b);

    // calculate median floor difference percentage
    const middleIndex = Math.floor(offerVarianceArray.length / 2);
    let medianFloorDifferencePercentage;
    if (offerVarianceArray.length) {
      if (offerVarianceArray.length % 2 === 0) {
        medianFloorDifferencePercentage = (offerVarianceArray[middleIndex - 1] + offerVarianceArray[middleIndex]) / 2;
      } else {
        medianFloorDifferencePercentage = offerVarianceArray[middleIndex];
      }
    }

    // calculate mean floor difference percentage
    const meanFloorDifferencePercentage = offerVarianceArray.length
      ? offerVarianceArray.reduce((acc, cur) => acc + cur, 0) / offerVarianceArray.length
      : undefined;

    analyticsV2.identify({
      nftOffersAmount: nftOffers.length,
      nftOffersUSDValue: totalUSDValue,
      nftOffersMedianOfferVariance: medianFloorDifferencePercentage,
      nftOffersMeanOfferVariance: meanFloorDifferencePercentage,
    });
  }, [query.data?.nftOffers]);

  // every 1 min check for invalid offers and remove them from the cache
  useEffect(() => {
    const nftOffers = query.data?.nftOffers ?? [];
    if (nftOffers.length) {
      const interval = setInterval(() => {
        const validOffers = nftOffers.filter((offer: NftOffer) => !offer.validUntil || offer.validUntil * 1000 - Date.now() > 0);
        if (validOffers.length < nftOffers.length) {
          queryClient.setQueryData(queryKey, { nftOffers: validOffers });
        }
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [query.data?.nftOffers, queryKey]);

  return { ...query, data: { ...query.data, nftOffers: sortedOffers } };
}
