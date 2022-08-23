import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import useAccountProfile from './useAccountProfile';
import { prefetchENSAvatar } from './useENSAvatar';
import { EnsDomain } from '@rainbow-me/apollo/queries';
import { fetchAccountRegistrations } from '@rainbow-me/handlers/ens';
import {
  getENSDomains,
  setENSDomains,
} from '@rainbow-me/handlers/localstorage/ens';
import { queryClient } from '@rainbow-me/react-query/queryClient';

const queryKey = ({ accountAddress }: { accountAddress: string }) => [
  'domains',
  accountAddress,
];

const STALE_TIME = 10000;

async function fetchAccountENSDomains({
  accountAddress,
}: {
  accountAddress: string;
}) {
  const result = await fetchAccountRegistrations(accountAddress);
  const registrations = result.data?.account?.registrations || [];
  return registrations.map(({ domain }) => {
    prefetchENSAvatar(domain.name, { cacheFirst: true });
    return domain;
  });
}

async function fetchENSDomainsWithCache({
  accountAddress,
}: {
  accountAddress: string;
}) {
  const cachedDomains = await getENSDomains(accountAddress);
  if (cachedDomains)
    queryClient.setQueryData(queryKey({ accountAddress }), cachedDomains);
  const ensDomains = await fetchAccountENSDomains({ accountAddress });
  setENSDomains(accountAddress, ensDomains);
  return ensDomains;
}

export async function prefetchAccountENSDomains({
  accountAddress,
}: {
  accountAddress: string;
}) {
  queryClient.prefetchQuery(
    queryKey({ accountAddress }),
    async () => await fetchENSDomainsWithCache({ accountAddress }),
    { staleTime: STALE_TIME }
  );
}

export default function useAccountENSDomains() {
  const { accountAddress, accountENS } = useAccountProfile();

  const { data: domains, isLoading, isFetched, isSuccess } = useQuery<
    EnsDomain[]
  >(
    queryKey({ accountAddress }),
    async () => fetchENSDomainsWithCache({ accountAddress }),
    {
      enabled: Boolean(accountAddress),
    }
  );

  const { ownedDomains, primaryDomain, nonPrimaryDomains } = useMemo(() => {
    const ownedDomains = domains?.filter(
      ({ owner }) => owner?.id?.toLowerCase() === accountAddress?.toLowerCase()
    );
    return {
      nonPrimaryDomains:
        ownedDomains?.filter(({ name }) => accountENS !== name) || [],
      ownedDomains,
      primaryDomain: ownedDomains?.find(({ name }) => accountENS === name),
    };
  }, [accountAddress, accountENS, domains]);

  const uniqueDomain = useMemo(() => {
    return primaryDomain
      ? primaryDomain
      : nonPrimaryDomains?.length === 1
      ? nonPrimaryDomains?.[0]
      : null;
  }, [nonPrimaryDomains, primaryDomain]);

  return {
    domains,
    isFetched,
    isLoading,
    isSuccess,
    nonPrimaryDomains,
    ownedDomains,
    primaryDomain,
    uniqueDomain,
  };
}
