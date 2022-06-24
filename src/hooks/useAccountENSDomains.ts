import { useQuery } from 'react-query';
import useAccountSettings from './useAccountSettings';
import { fetchENSAvatar } from './useENSAvatar';
import { EnsAccountRegistratonsData } from '@rainbow-me/apollo/queries';
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
  if (!accountAddress) return [];
  const result = await fetchAccountRegistrations(accountAddress);
  const registrations = result.data?.account?.registrations || [];
  const domains = await Promise.all(
    registrations.map(async ({ domain }) => {
      const avatar = await fetchENSAvatar(domain.name);
      return {
        ...domain,
        avatar,
      };
    })
  );

  return domains;
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
  const { accountAddress } = useAccountSettings();

  return useQuery<
    EnsAccountRegistratonsData['account']['registrations'][number]['domain'][]
  >(queryKey({ accountAddress }), async () =>
    fetchENSDomainsWithCache({ accountAddress })
  );
}
