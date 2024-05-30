import { useQuery } from '@tanstack/react-query';

import { createQueryKey, queryClient, QueryConfig, QueryFunctionArgs, QueryFunctionResult } from '@/react-query';

import { NativeCurrencyKey } from '@/entities';
import { RainbowNetworks } from '@/networks';
import { rainbowFetch } from '@/rainbow-fetch';
import { ADDYS_API_KEY } from 'react-native-dotenv';
import { AddysPositionsResponse, PositionsArgs } from './types';
import { parsePositions } from './utils';

export const buildPositionsUrl = (address: string) => {
  const networkString = RainbowNetworks.filter(network => network.enabled)
    .map(network => network.id)
    .join(',');
  return `https://addys.p.rainbow.me/v3/${networkString}/${address}/positions`;
};

const getPositions = async (address: string, currency: NativeCurrencyKey): Promise<AddysPositionsResponse> => {
  const response = await rainbowFetch(buildPositionsUrl(address), {
    method: 'get',
    params: {
      currency,
    },
    headers: {
      Authorization: `Bearer ${ADDYS_API_KEY}`,
    },
  });
  if (response.data) {
    return response.data;
  }

  // should pop a warn here
  return {};
};

// ///////////////////////////////////////////////
// Query Key

// Key used for loading the cache with data from storage
export const POSITIONS_QUERY_KEY = 'positions';

export const positionsQueryKey = ({ address, currency }: PositionsArgs) =>
  createQueryKey(POSITIONS_QUERY_KEY, { address, currency }, { persisterVersion: 1 });

type PositionsQueryKey = ReturnType<typeof positionsQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function positionsQueryFunction({ queryKey: [{ address, currency }] }: QueryFunctionArgs<typeof positionsQueryKey>) {
  const data = await getPositions(address, currency);
  return parsePositions(data, currency);
}

type PositionsResult = QueryFunctionResult<typeof positionsQueryFunction>;

// ///////////////////////////////////////////////
// Query Prefetcher (Optional)

export async function prefetchPositions(
  { address, currency }: PositionsArgs,
  config: QueryConfig<PositionsResult, Error, PositionsQueryKey> = {}
) {
  return await queryClient.prefetchQuery(positionsQueryKey({ address, currency }), positionsQueryFunction, config);
}

// ///////////////////////////////////////////////
// Query Fetcher (Optional)

export async function fetchPositions(
  { address, currency }: PositionsArgs,
  config: QueryConfig<PositionsResult, Error, PositionsQueryKey> = {}
) {
  return await queryClient.fetchQuery(positionsQueryKey({ address, currency }), positionsQueryFunction, config);
}

// ///////////////////////////////////////////////
// Query Hook

export function usePositions({ address, currency }: PositionsArgs, config: QueryConfig<PositionsResult, Error, PositionsQueryKey> = {}) {
  return useQuery(positionsQueryKey({ address, currency }), positionsQueryFunction, { ...config, enabled: !!address });
}
