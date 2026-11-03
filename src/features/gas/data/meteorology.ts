import { METADATA_BASE_URL } from 'react-native-dotenv';

import { IS_TEST } from '@/env';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { time } from '@/framework/core/utils/time';
import { RainbowFetchClient } from '@/framework/data/http/rainbowFetch';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';

import { type MeteorologyLegacyResponse, type MeteorologyResponse } from '../types/gas';
import { mockMeteorologyData } from './meteorologyMock';

let client: RainbowFetchClient | undefined;

/**
 * Fetches a chain's gas market data, using the local test response when connected to Anvil.
 */
export async function fetchMeteorology(chainId: ChainId, signal?: AbortSignal): Promise<MeteorologyResponse | MeteorologyLegacyResponse> {
  if (IS_TEST && useConnectedToAnvilStore.getState().connectedToAnvil) return mockMeteorologyData;

  if (!client || client.baseURL !== METADATA_BASE_URL) {
    client = new RainbowFetchClient({
      baseURL: METADATA_BASE_URL,
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      timeout: time.seconds(30),
    });
  }

  const chainName = useBackendNetworksStore.getState().getChainsName()[chainId];
  const response = await client.get<MeteorologyResponse | MeteorologyLegacyResponse>(`/meteorology/v1/gas/${chainName}`, { signal });
  return response.data;
}
