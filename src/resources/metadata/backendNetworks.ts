import { BackendNetwork } from '@/state/backendNetworks/types';
import { BACKEND_NETWORKS_QUERY } from './sharedQueries';

// ///////////////////////////////////////////////
// Query Types

export interface BackendNetworksResponse {
  networks: BackendNetwork[];
}

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
