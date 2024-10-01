import { useQuery } from '@tanstack/react-query';
import { QueryConfigWithSelect, QueryFunctionArgs, createQueryKey, queryClient } from '@/react-query';
import { BackendNetwork } from '@/chains/types';
import { BACKEND_NETWORKS_QUERY } from './sharedQueries';

// ///////////////////////////////////////////////
// Query Types

export interface BackendNetworksResponse {
  networks: BackendNetwork[];
}

// ///////////////////////////////////////////////
// Query Key

/**
 * GraphQL query to fetch backend networks
 * @see scripts/networks.js - for the build time version of this query
 */
export const GRAPHQL_QUERY = BACKEND_NETWORKS_QUERY;

export const backendNetworksQueryKey = () => createQueryKey('backendNetworks', {}, { persisterVersion: 1 });

export type BackendNetworksQueryKey = ReturnType<typeof backendNetworksQueryKey>;

// ///////////////////////////////////////////////
// Query Function

export async function fetchBackendNetworks(): Promise<BackendNetworksResponse> {
  const response = await fetch('https://metadata.p.rainbow.me/v1/graph', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: BACKEND_NETWORKS_QUERY,
      variables: { device: 'APP', includeTestnets: true },
    }),
  });

  const { data } = await response.json();

  return data as BackendNetworksResponse;
}

export async function backendNetworksQueryFunction({
  queryKey: [_key],
}: QueryFunctionArgs<typeof backendNetworksQueryKey>): Promise<BackendNetworksResponse> {
  return await fetchBackendNetworks();
}

// ///////////////////////////////////////////////
// Query Hook

export function useBackendNetworks(
  config: QueryConfigWithSelect<BackendNetworksResponse, Error, BackendNetworksResponse, BackendNetworksQueryKey> = {}
) {
  return useQuery(backendNetworksQueryKey(), backendNetworksQueryFunction, {
    ...config,
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

// ///////////////////////////////////////////////
// Prefetch Function

export async function prefetchBackendNetworks() {
  await queryClient.prefetchQuery(backendNetworksQueryKey(), backendNetworksQueryFunction);
}
