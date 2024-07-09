import { useQuery } from '@tanstack/react-query';
import { metadataClient } from '@/graphql';
import { DAppStatus } from '@/graphql/__generated__/metadata';
import { QueryConfigWithSelect, QueryFunctionArgs, createQueryKey, queryClient } from '@/react-query';

import { getDappHost, getDappHostname, getHardcodedDappInformation, isValidUrl } from '@/utils/connectedApps';
import { capitalize } from 'lodash';

export interface DappMetadata {
  url: string;
  appHost: string;
  appHostName?: string;
  appName: string;
  appShortName: string;
  appLogo?: string;
  timestamp?: number;
  status?: DAppStatus;
}

// ///////////////////////////////////////////////
// Query Types

type DappMetadataArgs = {
  url?: string;
};

// ///////////////////////////////////////////////
// Query Key

const DappMetadataQueryKey = ({ url }: DappMetadataArgs) => createQueryKey('dappMetadata', { url }, { persisterVersion: 1 });

type DappMetadataQueryKey = ReturnType<typeof DappMetadataQueryKey>;

// ///////////////////////////////////////////////
// Query Function

export async function fetchDappMetadata({ url, status }: { url: string; status: boolean }) {
  const appHostName = url && isValidUrl(url) ? getDappHostname(url) : '';
  const hardcodedAppName = url && isValidUrl(url) ? getHardcodedDappInformation(appHostName || getDappHostname(url) || '')?.name || '' : '';

  const response = await metadataClient.getdApp({
    shortName: hardcodedAppName,
    url,
    status,
  });

  const appHost = url && isValidUrl(url) ? getDappHost(url) : '';
  const appName = response?.dApp?.name ? capitalize(response?.dApp?.name) : hardcodedAppName || appHost;
  const appShortName = response?.dApp?.shortName ? capitalize(response?.dApp?.shortName) : appName;
  const dappMetadata = {
    url,
    appHost,
    appHostName,
    appName,
    appShortName,
    appLogo: response?.dApp?.iconURL,
    status: response.dApp?.status,
  };
  return dappMetadata;
}

export async function dappMetadataQueryFunction({
  queryKey: [{ url }],
}: QueryFunctionArgs<typeof DappMetadataQueryKey>): Promise<DappMetadata | null> {
  if (!url) return null;
  const dappMetadata = await fetchDappMetadata({ url, status: true });
  return dappMetadata;
}

export async function prefetchDappMetadata({ url }: { url: string }) {
  queryClient.prefetchQuery(DappMetadataQueryKey({ url }), async () => fetchDappMetadata({ url, status: false }), {
    staleTime: 60000,
  });
}

export async function getDappMetadata(
  { url }: { url: string },
  config: QueryConfigWithSelect<DappMetadata, Error, DappMetadata, DappMetadataQueryKey> = {}
) {
  return await queryClient.fetchQuery(DappMetadataQueryKey({ url }), dappMetadataQueryFunction, config);
}

// ///////////////////////////////////////////////
// Query Hook

export function useDappMetadata({ url }: DappMetadataArgs) {
  return useQuery(DappMetadataQueryKey({ url }), dappMetadataQueryFunction, {
    cacheTime: 1000 * 60 * 60 * 24,
    enabled: !!url,
  });
}
