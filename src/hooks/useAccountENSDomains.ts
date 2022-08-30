import { uniqBy } from 'lodash';
import { useMemo } from 'react';
import { useQuery } from 'react-query';
import useAccountProfile from './useAccountProfile';
import { prefetchENSAvatar } from './useENSAvatar';
import { EnsDomain } from '@/apollo/queries';
import { fetchAccountDomains } from '@/handlers/ens';
import { getENSDomains, setENSDomains } from '@/handlers/localstorage/ens';
import { queryClient } from '@/react-query/queryClient';

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
  const result = await fetchAccountDomains(accountAddress);
  const { domains: controlledDomains, registrations } =
    result.data?.account || {};
  const registarDomains = registrations?.map(({ domain }) => domain);

  const domains = uniqBy(
    [...(controlledDomains || []), ...(registarDomains || [])],
    'name'
  );
  return domains.map(domain => {
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

  const {
    controlledDomains,
    primaryDomain,
    nonPrimaryDomains,
  } = useMemo(() => {
    const controlledDomains = domains?.filter(
      ({ owner }) => owner?.id?.toLowerCase() === accountAddress?.toLowerCase()
    );
    return {
      controlledDomains,
      nonPrimaryDomains:
        controlledDomains?.filter(({ name }) => accountENS !== name) || [],
      primaryDomain: controlledDomains?.find(({ name }) => accountENS === name),
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
    controlledDomains,
    domains,
    isFetched,
    isLoading,
    isSuccess,
    nonPrimaryDomains,
    primaryDomain,
    uniqueDomain,
  };
}
