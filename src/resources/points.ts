import { useEffect } from 'react';
import { POINTS, useExperimentalFlag } from '@/config';
import { metadataPOSTClient } from '@/graphql';
import { GetPointsDataForWalletQuery } from '@/graphql/__generated__/metadata';
import config from '@/model/config';
import { createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';

export function pointsQueryKey({ address }: { address: string }) {
  return createQueryKey('points', { address }, { persisterVersion: 1 });
}

export const pointsReferralCodeQueryKey = createQueryKey(
  'pointsReferralCode',
  {}
);

export function usePointsReferralCode() {
  const query = useQuery<string>(pointsReferralCodeQueryKey, () => '', {
    enabled: false,
    staleTime: Infinity,
  });

  return query;
}

export function usePoints({ walletAddress }: { walletAddress: string }) {
  const pointsEnabled =
    (useExperimentalFlag(POINTS) || config.points_fully_enabled) &&
    config.points_enabled;
  const queryKey = pointsQueryKey({
    address: walletAddress,
  });

  const query = useQuery<GetPointsDataForWalletQuery>(
    queryKey,
    async () =>
      await metadataPOSTClient.getPointsDataForWallet({
        address: walletAddress,
      }),
    {
      enabled: pointsEnabled && !!walletAddress,
      cacheTime: Infinity,
    }
  );

  useEffect(() => {
    const nextDistribution = query?.data?.points?.meta?.distribution?.next;
    if (nextDistribution && Date.now() >= nextDistribution * 1000) {
      query.refetch();
    }
  }, [query]);

  return query;
}
