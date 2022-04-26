import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import useAccountSettings from './useAccountSettings';
import { EnsAccountRegistratonsData } from '@rainbow-me/apollo/queries';
import {
  fetchAccountRegistrations,
  fetchImages,
} from '@rainbow-me/handlers/ens';
import {
  getENSDomains,
  setENSDomains,
} from '@rainbow-me/handlers/localstorage/ens';
import { queryClient } from '@rainbow-me/react-query/queryClient';

const queryKey = ({ accountAddress }: { accountAddress: string }) => [
  'domains',
  accountAddress,
];

const imagesQueryKey = ({ name }: { name: string }) => ['domainImages', name];

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
      const images = await fetchAccountENSImages(domain.name);
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

async function fetchAccountENSImages(name: string) {
  return queryClient.fetchQuery(
    imagesQueryKey({ name }),
    async () => await fetchImages(name),
    {
      staleTime: 120000,
    }
  );
}

export default function useAccountENSDomains() {
  const { accountAddress } = useAccountSettings();
  const [initialENSDomains, setIinitialENSDomains] = useState<
    {
      name: string;
      owner: { id: string };
      images: { avatarUrl?: string | null; coverUrl?: string | null };
    }[]
  >();

  const { data: ensDomains } = useQuery<
    EnsAccountRegistratonsData['account']['registrations'][number]['domain'][]
  >(queryKey({ accountAddress }), async () => {
    const ensDomains = await fetchAccountENSDomains({ accountAddress });
    setENSDomains(accountAddress, ensDomains);
    setIinitialENSDomains(ensDomains);
    return ensDomains;
  });

  const getInitialDomains = useCallback(async () => {
    const initialDomains = await getENSDomains(accountAddress);
    setIinitialENSDomains(initialDomains);
  }, [accountAddress]);

  const data = useMemo(() => ensDomains ?? initialENSDomains, [
    ensDomains,
    initialENSDomains,
  ]);

  useEffect(() => {
    getInitialDomains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data,
    isLoading: !data,
    isSuccess: !!data,
  };
}
