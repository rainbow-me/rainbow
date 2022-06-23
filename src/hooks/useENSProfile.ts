import { useQueries } from 'react-query';
import useAccountSettings from './useAccountSettings';
import useWallets from './useWallets';
import {
  fetchCoinAddresses,
  fetchImages,
  fetchOwner,
  fetchPrimary,
  fetchRecords,
  fetchRegistration,
  fetchResolver,
} from '@rainbow-me/handlers/ens';
import { getProfile, saveProfile } from '@rainbow-me/handlers/localstorage/ens';
import { queryClient } from '@rainbow-me/react-query/queryClient';
import { ensPublicResolverAddress } from '@rainbow-me/references';

export const dataFetchers = {
  coinAddresses: fetchCoinAddresses,
  images: fetchImages,
  owner: fetchOwner,
  primary: fetchPrimary,
  records: fetchRecords,
  registration: fetchRegistration,
  resolver: fetchResolver,
} as const;
export type DataType = keyof typeof dataFetchers;

export const ensProfileQueryKey = ({
  name,
  type,
}: {
  name: string;
  type: DataType;
}) => ['ens-profile', type, name];

const STALE_TIME = 10000;

export async function fetchENSProfile({
  name,
  type,
  cacheFirst,
}: {
  name: string;
  type: DataType;
  cacheFirst?: boolean;
}) {
  const cachedData = await getProfile(type, name);

  let shouldFetch = true;
  if (cachedData) {
    queryClient.setQueryData(ensProfileQueryKey({ name, type }), cachedData);
    if (cacheFirst) shouldFetch = false;
  }
  const data = shouldFetch ? await dataFetchers[type](name) : cachedData;

  saveProfile(type, name, data);
  return data;
}

export async function prefetchENSProfile({
  name,
  cacheFirst,
  select,
}: {
  name: string;
  cacheFirst?: boolean;
  select: DataType[];
}) {
  return Promise.all(
    select.map(async type => {
      await queryClient.prefetchQuery(
        ensProfileQueryKey({ name, type }),
        async () => await fetchENSProfile({ cacheFirst, name, type }),
        { staleTime: STALE_TIME }
      );
    })
  );
}

export default function useENSProfile(
  name: string,
  { enabled = true, select }: { enabled?: boolean; select: DataType[] }
) {
  const { accountAddress } = useAccountSettings();
  const { walletNames } = useWallets();

  const queries = useQueries([
    {
      enabled: enabled && select.includes('coinAddresses'),
      queryFn: () => fetchCoinAddresses(name),
      queryKey: ensProfileQueryKey({ name, type: 'coinAddresses' }),
      staleTime: STALE_TIME,
    },
    {
      enabled: enabled && select.includes('images'),
      queryFn: () => fetchImages(name),
      queryKey: ensProfileQueryKey({ name, type: 'images' }),
      staleTime: STALE_TIME,
    },
    {
      enabled: enabled && select.includes('owner'),
      queryFn: () => fetchOwner(name),
      queryKey: ensProfileQueryKey({ name, type: 'owner' }),
      staleTime: STALE_TIME,
    },
    {
      enabled: enabled && select.includes('primary'),
      queryFn: () => fetchPrimary(name),
      queryKey: ensProfileQueryKey({ name, type: 'primary' }),
      staleTime: STALE_TIME,
    },
    {
      enabled: enabled && select.includes('records'),
      queryFn: () => fetchRecords(name),
      queryKey: ensProfileQueryKey({ name, type: 'records' }),
      staleTime: STALE_TIME,
    },
    {
      enabled: enabled && select.includes('registration'),
      queryFn: () => fetchRegistration(name),
      queryKey: ensProfileQueryKey({ name, type: 'registration' }),
      staleTime: STALE_TIME,
    },
    {
      enabled: enabled && select.includes('resolver'),
      queryFn: () => fetchResolver(name),
      queryKey: ensProfileQueryKey({ name, type: 'resolver' }),
      staleTime: STALE_TIME,
    },
  ]);

  const [
    { data: coinAddresses },
    { data: images },
    { data: owner },
    { data: primary },
    { data: records },
    { data: registration },
    { data: resolver },
  ] = queries;

  // Filter out queries that have not been specified in `select`.
  const filteredQueries = queries.filter((_, index) => {
    if (select.includes('coinAddresses') && index === 0) return true;
    if (select.includes('images') && index === 1) return true;
    if (select.includes('owner') && index === 2) return true;
    if (select.includes('primary') && index === 3) return true;
    if (select.includes('records') && index === 4) return true;
    if (select.includes('registration') && index === 5) return true;
    if (select.includes('resolver') && index === 6) return true;
    return false;
  });
  const isLoading = filteredQueries.some(query => query.isLoading);
  const isSuccess = !filteredQueries.some(query => !query.isSuccess);
  const isFetched = !filteredQueries.some(query => !query.isFetched);

  const isOwner =
    owner?.address?.toLowerCase() === accountAddress?.toLowerCase();

  // if a ENS NFT is sent, the ETH coinAddress record doesn't change
  // if the user tries to use it to set primary name the tx will go through
  // but the name won't be set. Disabling it to avoid these cases
  const isSetNameEnabled =
    coinAddresses?.ETH?.toLowerCase() === accountAddress?.toLowerCase();

  const isPrimaryName =
    walletNames?.[accountAddress]?.toLowerCase() === name?.toLowerCase();

  const resolverData = {
    address: resolver?.address,
    type: resolver?.address === ensPublicResolverAddress ? 'default' : 'custom',
  };

  return {
    data: {
      coinAddresses,
      images,
      isOwner,
      owner,
      primary,
      records,
      registrant: registration?.registrant,
      registration: registration?.registration,
      resolver: resolverData,
    },
    isFetched,
    isLoading,
    isOwner,
    isPrimaryName,
    isSetNameEnabled,
    isSuccess,
  };
}
