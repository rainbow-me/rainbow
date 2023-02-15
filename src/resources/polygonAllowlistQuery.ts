import {
  createQueryKey,
  queryClient,
  QueryConfig,
  QueryFunctionResult,
} from '@/react-query';
import { rainbowFetch } from '@/rainbow-fetch';

const POLYGON_ALLOWLIST_STALE_TIME = 600000; // 10 minutes

// ///////////////////////////////////////////////
// Query Types

export type PolygonAllowlistQueryArgs = {
  address: string;
  cursor: string;
};

// ///////////////////////////////////////////////
// Query Key

export const polygonAllowlistQueryKey = () =>
  createQueryKey('polygonAllowlist', {}, { persisterVersion: 1 });

type PolygonAllowlistQueryKey = ReturnType<typeof polygonAllowlistQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function polygonAllowlistQueryFunction() {
  return (
    await rainbowFetch(
      'https://metadata.p.rainbow.me/token-list/137-allowlist.json',
      { method: 'get' }
    )
  ).data.data.addresses;
}

type PolygonAllowlistResult = QueryFunctionResult<
  typeof polygonAllowlistQueryFunction
>;

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchPolygonAllowlist(
  config: QueryConfig<
    PolygonAllowlistResult,
    Error,
    PolygonAllowlistQueryKey
  > = {}
) {
  return await queryClient.fetchQuery(
    ['polygon-allowlist'],
    polygonAllowlistQueryFunction,
    { staleTime: POLYGON_ALLOWLIST_STALE_TIME, ...config }
  );
}
