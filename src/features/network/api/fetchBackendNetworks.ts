import { METADATA_BASE_URL } from 'react-native-dotenv';

import { type BackendNetwork } from '../types/backendNetworks';
import { BACKEND_NETWORKS_QUERY } from './backendNetworksQuery';

// ///////////////////////////////////////////////
// Query Types

export interface BackendNetworksResponse {
  networks: BackendNetwork[];
}

// ///////////////////////////////////////////////
// Query Function

const BACKEND_NETWORKS_QUERY_BODY = JSON.stringify({
  query: BACKEND_NETWORKS_QUERY,
  variables: { device: 'APP', includeTestnets: true },
});

export async function fetchBackendNetworks(): Promise<BackendNetworksResponse> {
  const BASE_URL = METADATA_BASE_URL;
  const response = await fetch(`${BASE_URL}/v1/graph`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: BACKEND_NETWORKS_QUERY_BODY,
  });

  const { data }: { data: BackendNetworksResponse } = await response.json();
  return data;
}
