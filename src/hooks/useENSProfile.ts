import { useQuery } from 'react-query';
import useAccountSettings from './useAccountSettings';
import { ensAddressQueryKey, fetchENSAddress } from './useENSAddress';
import { ensAvatarQueryKey, fetchENSAvatar } from './useENSAvatar';
import { ensCoverQueryKey, fetchENSCover } from './useENSCover';
import { ensOwnerQueryKey, fetchENSOwner } from './useENSOwner';
import { ensRecordsQueryKey, fetchENSRecords } from './useENSRecords';
import { ensRegistrantQueryKey, fetchENSRegistrant } from './useENSRegistrant';
import { ensResolverQueryKey, fetchENSResolver } from './useENSResolver';
import useWallets from './useWallets';
import {
  getENSProfile,
  saveENSProfile,
} from '@rainbow-me/handlers/localstorage/ens';
import { queryClient } from '@rainbow-me/react-query/queryClient';
import { QueryConfig, UseQueryData } from '@rainbow-me/react-query/types';

const queryKey = (name: string) => ['ens-profile', name];

const STALE_TIME = 10000;

async function fetchENSProfile(name: string) {
  const cachedProfile = await getENSProfile(name);
  if (cachedProfile) {
    queryClient.setQueryData(queryKey(name), cachedProfile);
  }

  const [
    address,
    avatar,
    cover,
    owner,
    { coinAddresses, records },
    { registration, registrant },
    resolver,
  ] = await Promise.all([
    queryClient.fetchQuery(ensAddressQueryKey(name), () =>
      fetchENSAddress(name)
    ),
    queryClient.fetchQuery(ensAvatarQueryKey(name), () => fetchENSAvatar(name)),
    queryClient.fetchQuery(ensCoverQueryKey(name), () => fetchENSCover(name)),
    queryClient.fetchQuery(ensOwnerQueryKey(name), () => fetchENSOwner(name)),
    queryClient.fetchQuery(ensRecordsQueryKey(name), () =>
      fetchENSRecords(name)
    ),
    queryClient.fetchQuery(ensRegistrantQueryKey(name), () =>
      fetchENSRegistrant(name)
    ),
    queryClient.fetchQuery(ensResolverQueryKey(name), () =>
      fetchENSResolver(name)
    ),
  ]);

  const profile = {
    address,
    coinAddresses,
    images: {
      avatar,
      cover,
    },
    owner,
    records,
    registrant,
    registration,
    resolver,
  };
  saveENSProfile(name, profile);
  return profile;
}

export async function prefetchENSProfile(name: string) {
  queryClient.prefetchQuery(queryKey(name), async () => fetchENSProfile(name), {
    staleTime: STALE_TIME,
  });
}

/**
 * @description Hook to fetch a whole ENS profile.
 *
 * WARNING: This will invoke several requests to the RPC. You may
 * be better off using the individual hooks (e.g. `useENSAvatar`, `useENSRecords`, etc)
 * if you do not need everything.
 */
export default function useENSProfile(
  name: string,
  config?: QueryConfig<typeof fetchENSProfile>
) {
  const { accountAddress } = useAccountSettings();
  const { walletNames } = useWallets();
  const { data, isLoading, isSuccess } = useQuery<
    UseQueryData<typeof fetchENSProfile>
  >(queryKey(name), async () => fetchENSProfile(name), {
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
