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
    if (nextDistribution && Date.now() / 1000 > nextDistribution) {
      query.refetch();
    }
  }, [query]);

  return query;
}
