import { useQuery } from '@tanstack/react-query';

import { createQueryKey, queryClient, QueryConfig, QueryFunctionArgs, QueryFunctionResult } from '@/react-query';

import { NativeCurrencyKey } from '@/entities';
import { AddysPositionsResponse, PositionsArgs } from './types';
import { parsePositions } from './utils';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { DEFI_POSITIONS, useExperimentalFlag } from '@/config';
import { IS_TEST } from '@/env';
import { getAddysHttpClient } from '@/resources/addys/client';

const getPositions = async (address: string, currency: NativeCurrencyKey): Promise<AddysPositionsResponse> => {
  const networkString = useBackendNetworksStore.getState().getSupportedChainIds().join(',');
  const url = `/${networkString}/${address}/positions`;
  const response = await getAddysHttpClient().get<AddysPositionsResponse>(url, {
    params: {
      currency,
      enableThirdParty: 'true',
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
  createQueryKey(POSITIONS_QUERY_KEY, { address, currency }, { persisterVersion: 3 });

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
  const positionsEnabled = useExperimentalFlag(DEFI_POSITIONS);
  return useQuery(positionsQueryKey({ address, currency }), positionsQueryFunction, {
    ...config,
    enabled: !!(address && positionsEnabled && !IS_TEST),
  });
}
