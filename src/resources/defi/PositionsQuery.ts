import { useQuery } from '@tanstack/react-query';

import {
  createQueryKey,
  queryClient,
  QueryConfig,
  QueryFunctionArgs,
  QueryFunctionResult,
} from '@/react-query';

import { Asset, NativeCurrencyKey } from '@/entities';
import { rainbowFetch } from '@/rainbow-fetch';
import { ADDYS_API_KEY } from 'react-native-dotenv';

export const buildPositionsUrl = (address: string) =>
  `https://addys.p.rainbow.me/v2/1/${address}/positions`;

const getPositions = async (
  address: string,
  currency: NativeCurrencyKey
): Promise<AddysPositionsResponse> => {
  console.log('FETCHING POSITIONS VIA NETWORK');
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
// Query Types

export type PositionsArgs = {
  address: string;
  currency: NativeCurrencyKey;
};

type Claimable = {
  asset: Asset;
  quantity: string;
};
type Deposit = {
  apr: string;
  apy: string;
  asset: Asset;
  quantity: string;
  total_asset: string; // what does this mean?
  underlying: Asset;
};
type Borrow = {
  apr: string;
  apy: string;
  asset: Asset;
  quantity: string;
  total_asset: string; // what does this mean?
  underlying: Asset;
};

// TODO: need to add dapp metadata once its added via BE
export type Position = {
  type: string;
  claimables: Claimable[];
  borrows: Borrow[];
  deposits: Deposit[];
};

// ///////////////////////////////////////////////
// Query Key

// Key used for loading the cache with data from storage
export const POSITIONS_QUERY_KEY = 'positions';

type AddysPositionsResponse =
  | {
      meta: Record<string, any>;
      payload: Record<string, any>;
    }
  | Record<string, never>;
const parsePositions = (data: AddysPositionsResponse): Position[] => {
  console.log('PARSING POSITIONS');
  const payload: Position[] = data.payload?.positions;

  const mappedPositions: Record<string, Position> = payload.reduce(
    (mappedPositions2, position, i) => {
      return {
        ...mappedPositions2,
        [position.type]: position,
      };
    },
    {}
  );

  return payload;
};

export const positionsQueryKey = ({ address, currency }: PositionsArgs) =>
  createQueryKey(
    POSITIONS_QUERY_KEY,
    { address, currency },
    { persisterVersion: 1 }
  );

type PositionsQueryKey = ReturnType<typeof positionsQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function positionsQueryFunction({
  queryKey: [{ address, currency }],
}: QueryFunctionArgs<typeof positionsQueryKey>) {
  console.log('FETCHING POSITIONS');
  const data = await getPositions(address, currency);
  return parsePositions(data);
}

type PositionsResult = QueryFunctionResult<typeof positionsQueryFunction>;

// ///////////////////////////////////////////////
// Query Prefetcher (Optional)

export async function prefetchPositions(
  { address, currency }: PositionsArgs,
  config: QueryConfig<PositionsResult, Error, PositionsQueryKey> = {}
) {
  return await queryClient.prefetchQuery(
    positionsQueryKey({ address, currency }),
    positionsQueryFunction,
    config
  );
}

// ///////////////////////////////////////////////
// Query Fetcher (Optional)

export async function fetchPositions(
  { address, currency }: PositionsArgs,
  config: QueryConfig<PositionsResult, Error, PositionsQueryKey> = {}
) {
  return await queryClient.fetchQuery(
    positionsQueryKey({ address, currency }),
    positionsQueryFunction,
    config
  );
}

// ///////////////////////////////////////////////
// Query Hook

export function usePositions(
  { address, currency }: PositionsArgs,
  config: QueryConfig<PositionsResult, Error, PositionsQueryKey> = {}
) {
  return useQuery(
    positionsQueryKey({ address, currency }),
    positionsQueryFunction,
    config
  );
}
