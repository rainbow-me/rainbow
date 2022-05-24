import { useQuery } from 'react-query';
import useAccountSettings from './useAccountSettings';
import useWallets from './useWallets';
import { fetchProfile } from '@rainbow-me/handlers/ens';
import { getProfile, saveProfile } from '@rainbow-me/handlers/localstorage/ens';
import { queryClient } from '@rainbow-me/react-query/queryClient';
import { QueryConfig, UseQueryData } from '@rainbow-me/react-query/types';

const queryKey = (name: string) => ['ens-profile', name];

const STALE_TIME = 10000;

async function fetchENSProfile({ name }: { name: string }) {
  const cachedProfile = await getProfile(name);
  if (cachedProfile) {
    queryClient.setQueryData(queryKey(name), cachedProfile);
  }
  const profile = await fetchProfile(name);
  saveProfile(name, profile);
  return profile;
}

export async function prefetchENSProfile({ name }: { name: string }) {
  queryClient.prefetchQuery(
    queryKey(name),
    async () => fetchENSProfile({ name }),
    { staleTime: STALE_TIME }
  );
}

export default function useENSProfile(
  name: string,
  config?: QueryConfig<typeof fetchProfile>
) {
  const { accountAddress } = useAccountSettings();
  const { walletNames } = useWallets();
  const { data, isLoading, isSuccess } = useQuery<
    UseQueryData<typeof fetchProfile>
  >(queryKey(name), async () => fetchENSProfile({ name }), {
    ...config,
    // Data will be stale for 10s to avoid dupe queries
    staleTime: STALE_TIME,
  });

  const isOwner =
    data?.owner?.address?.toLowerCase() === accountAddress?.toLowerCase();

  // if a ENS NFT is sent, the ETH coinAddress record doesn't change
  // if the user tries to use it to set primary name the tx will go through
  // but the name won't be set. Disabling it to avoid these cases
  const isSetNameEnabled =
    data?.coinAddresses?.ETH?.toLowerCase() === accountAddress?.toLowerCase();

  const isPrimaryName =
    walletNames?.[accountAddress]?.toLowerCase() === name?.toLowerCase();

  return {
    data,
    isLoading,
    isOwner,
    isPrimaryName,
    isSetNameEnabled,
    isSuccess,
  };
}
