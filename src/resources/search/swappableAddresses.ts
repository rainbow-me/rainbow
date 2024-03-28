import { useQuery } from '@tanstack/react-query';

import { QueryConfigWithSelect, QueryFunctionArgs, QueryFunctionResult, createQueryKey, queryClient } from '@/react-query';
import { AddressOrEth } from '@/__swaps__/screens/Swap/types/assets';
import { RainbowFetchClient } from '@/rainbow-fetch';

const tokenSearchHttp = new RainbowFetchClient({
  baseURL: 'https://token-search.rainbow.me/v2',
  timeout: 10_000,
});

// ///////////////////////////////////////////////
// Query Types

export type SwappableAddressesArgs = {
  addresses: AddressOrEth[];
  fromChainId: number;
  toChainId?: number;
};

// ///////////////////////////////////////////////
// Query Key

const swappableAddressesQueryKey = ({ addresses, fromChainId, toChainId }: SwappableAddressesArgs) =>
  createQueryKey('SwappableAddresses', { addresses, fromChainId, toChainId }, { persisterVersion: 1 });

type SwappableAddressesQueryKey = ReturnType<typeof swappableAddressesQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function swappableAddressesQueryFunction({
  queryKey: [{ addresses, fromChainId, toChainId }],
}: QueryFunctionArgs<typeof swappableAddressesQueryKey>) {
  const filteredAddresses = await tokenSearchHttp.post<{
    data?: AddressOrEth[];
  }>(`/${fromChainId}`, {
    addresses,
    toChainId,
  });
  return filteredAddresses.data.data || [];
}

type SwappableAddressesResult = QueryFunctionResult<typeof swappableAddressesQueryFunction>;

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchSwappableAddresses(
  { addresses, fromChainId, toChainId }: SwappableAddressesArgs,
  config: QueryConfigWithSelect<SwappableAddressesResult, Error, SwappableAddressesResult, SwappableAddressesQueryKey> = {}
) {
  return await queryClient.fetchQuery(
    swappableAddressesQueryKey({
      addresses,
      fromChainId,
      toChainId,
    }),
    swappableAddressesQueryFunction,
    config
  );
}

// ///////////////////////////////////////////////
// Query Hook

export function useSwappableAddresses<TSelectResult = SwappableAddressesResult>(
  { addresses, fromChainId, toChainId }: SwappableAddressesArgs,
  config: QueryConfigWithSelect<SwappableAddressesResult, Error, TSelectResult, SwappableAddressesQueryKey> = {}
) {
  return useQuery(
    swappableAddressesQueryKey({
      addresses,
      fromChainId,
      toChainId,
    }),
    swappableAddressesQueryFunction,
    config
  );
}
