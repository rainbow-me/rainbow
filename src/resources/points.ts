import { POINTS, useExperimentalFlag } from '@/config';
import { metadataClient } from '@/graphql';
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
      await metadataClient.getPointsDataForWallet({
        address: walletAddress,
      }),
    {
      enabled: pointsEnabled && !!walletAddress,
      cacheTime: Infinity,
    }
  );

  return query;
}
