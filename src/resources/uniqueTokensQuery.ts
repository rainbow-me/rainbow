import {
  createQueryKey,
  queryClient,
  QueryConfig,
  QueryFunctionArgs,
  QueryFunctionResult,
} from '@/react-query';
import { fetchRawUniqueTokens } from '@/handlers/simplehash';

const DEFAULT_STALE_TIME = 10000;

// ///////////////////////////////////////////////
// Query Types

export type UniqueTokensQueryArgs = {
  address: string;
  cursor: string;
};

export type UniqueTokensQueryConfigType = QueryConfig<
  UniqueTokensResult,
  Error,
  UniqueTokensQueryKey
>;

// ///////////////////////////////////////////////
// Query Key

export const uniqueTokensQueryKey = ({
  address,
  cursor,
}: UniqueTokensQueryArgs) =>
  createQueryKey('uniqueTokens', { address, cursor }, { persisterVersion: 1 });

type UniqueTokensQueryKey = ReturnType<typeof uniqueTokensQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function uniqueTokensQueryFunction({
  queryKey: [{ address, cursor }],
}: QueryFunctionArgs<typeof uniqueTokensQueryKey>) {
  const { rawNFTData, nextCursor } = await fetchRawUniqueTokens(
    address,
    cursor
  );
  return { data: rawNFTData, nextCursor };
}

type UniqueTokensResult = QueryFunctionResult<typeof uniqueTokensQueryFunction>;

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchUniqueTokens(
  { address, cursor }: UniqueTokensQueryArgs,
  config: UniqueTokensQueryConfigType = {}
) {
  return await queryClient.fetchQuery(
    uniqueTokensQueryKey({ address, cursor }),
    uniqueTokensQueryFunction,
    { staleTime: DEFAULT_STALE_TIME, ...config }
  );
}
