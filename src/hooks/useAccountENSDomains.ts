import { useQuery } from 'react-query';

import useAccountSettings from './useAccountSettings';
import { EnsAccountRegistratonsData } from '@rainbow-me/apollo/queries';
import {
  fetchAccountRegistrations,
  fetchImages,
} from '@rainbow-me/handlers/ens';
import { queryClient } from '@rainbow-me/react-query/queryClient';

const queryKey = ({ accountAddress }: { accountAddress: string }) => [
  'domains',
  accountAddress,
];

export async function fetchAccountENSDomains({
  accountAddress,
}: {
  accountAddress: string;
}) {
  if (!accountAddress) return [];
  const result = await fetchAccountRegistrations(accountAddress);
  const registrations = result.data?.account?.registrations || [];
  const domains = await Promise.all(
    registrations.map(async ({ domain }) => {
      const images = await fetchImages(domain.name);
      return {
        ...domain,
        images,
      };
    })
  );
  return domains;
}

export async function prefetchAccountENSDomains({
  accountAddress,
}: {
  accountAddress: string;
}) {
  queryClient.prefetchQuery(
    queryKey({ accountAddress }),
    async () => fetchAccountENSDomains({ accountAddress }),
    { staleTime: 10000 }
  );
}

export default function useAccountENSDomains() {
  const { accountAddress } = useAccountSettings();
  return useQuery<
    EnsAccountRegistratonsData['account']['registrations'][number]['domain'][]
  >(queryKey({ accountAddress }), async () =>
    fetchAccountENSDomains({ accountAddress })
  );
}
