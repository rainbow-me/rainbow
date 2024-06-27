import { useEffect } from 'react';
import { POINTS, useExperimentalFlag } from '@/config';
import { metadataPOSTClient } from '@/graphql';
import { GetPointsDataForWalletQuery } from '@/graphql/__generated__/metadataPOST';
import { createQueryKey, queryClient } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { useRemoteConfig } from '@/model/remoteConfig';
import { IS_TEST } from '@/env';

export function pointsQueryKey({ address }: { address: string }) {
  return createQueryKey('points', { address }, { persisterVersion: 1 });
}

export const invalidatePointsQuery = (address: string) => {
  queryClient.invalidateQueries(pointsQueryKey({ address }));
};

export const pointsReferralCodeQueryKey = createQueryKey('pointsReferralCode', {});

export function usePointsReferralCode() {
  const query = useQuery<string>(pointsReferralCodeQueryKey, () => '', {
    enabled: false,
    staleTime: Infinity,
  });

  return query;
}

let nextDropTimeout: NodeJS.Timeout | undefined;
export function usePoints({ walletAddress }: { walletAddress: string }) {
  const { points_enabled } = useRemoteConfig();
  const pointsEnabled = useExperimentalFlag(POINTS) || points_enabled || IS_TEST;
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
      staleTime: 1000 * 60 * 5,
    }
  );

  useEffect(() => {
    const nextDistribution = query.data?.points?.meta.distribution.next;
    if (!nextDistribution) return;
    const nextDistributionIn = nextDistribution * 1000 - Date.now();

    nextDropTimeout ??= setTimeout(() => query.refetch(), nextDistributionIn);

    return () => {
      if (nextDropTimeout) {
        clearTimeout(nextDropTimeout);
        nextDropTimeout = undefined;
      }
    };
  }, [query]);

  return query;
}
