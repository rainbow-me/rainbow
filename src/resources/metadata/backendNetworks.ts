import { BackendNetwork } from '@/state/backendNetworks/types';
import { BACKEND_NETWORKS_QUERY } from './sharedQueries';
import { METADATA_BASE_URL } from 'react-native-dotenv';

// ///////////////////////////////////////////////
// Query Types

export interface BackendNetworksResponse {
  networks: BackendNetwork[];
}

// ///////////////////////////////////////////////
// Query Function

export async function fetchBackendNetworks(): Promise<BackendNetworksResponse> {
  console.log('URL: ', `${METADATA_BASE_URL}/v1/graph`);
  const response = await fetch(`${METADATA_BASE_URL}/v1/graph`, {
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
