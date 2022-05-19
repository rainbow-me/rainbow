import { useMemo } from 'react';
import { useQuery } from 'react-query';
import useAccountSettings from './useAccountSettings';
import { EthereumAddress } from '@rainbow-me/entities';
import { fetchProfile } from '@rainbow-me/handlers/ens';
import { getProfile, saveProfile } from '@rainbow-me/handlers/localstorage/ens';
import { queryClient } from '@rainbow-me/react-query/queryClient';
import { QueryConfig, UseQueryData } from '@rainbow-me/react-query/types';
import { isLowerCaseMatch } from '@rainbow-me/utils';

const queryKey = (name: string) => ['ens-profile', name];

const STALE_TIME = 10000;

async function fetchENSProfile({
  name,
  accountAddress,
}: {
  name: string;
  accountAddress: EthereumAddress;
}) {
  const cachedProfile = await getProfile(name);
  if (cachedProfile) {
    queryClient.setQueryData(queryKey(name), cachedProfile);
  }
  const profile = await fetchProfile(name, accountAddress);
  saveProfile(name, profile);
  return profile;
}

export async function prefetchENSProfile({
  name,
  accountAddress,
}: {
  name: string;
  accountAddress: EthereumAddress;
}) {
  queryClient.prefetchQuery(
    queryKey(name),
    async () => fetchENSProfile({ accountAddress, name }),
    { staleTime: STALE_TIME }
  );
}

export default function useENSProfile(
  name: string,
  config?: QueryConfig<typeof fetchProfile>
) {
  const { accountAddress } = useAccountSettings();
  const { data, isLoading, isSuccess } = useQuery<
    UseQueryData<typeof fetchProfile>
  >(queryKey(name), async () => fetchENSProfile({ accountAddress, name }), {
    ...config,
    // Data will be stale for 10s to avoid dupe queries
    staleTime: STALE_TIME,
  });

  const isOwner = useMemo(
    () => isLowerCaseMatch(data?.owner?.address || '', accountAddress),
    [accountAddress, data?.owner?.address]
  );

  return { data, isLoading, isOwner, isSuccess };
}
