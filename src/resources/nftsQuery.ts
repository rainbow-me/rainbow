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

export type NftsQueryArgs = {
  address: string;
  cursor: string;
};

export type NftsQueryConfigType = QueryConfig<NftsResult, Error, NftsQueryKey>;

// ///////////////////////////////////////////////
// Query Key

export const nftsQueryKey = ({ address, cursor }: NftsQueryArgs) =>
  createQueryKey('nfts', { address, cursor }, { persisterVersion: 1 });

type NftsQueryKey = ReturnType<typeof nftsQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function nftsQueryFunction({
  queryKey: [{ address, cursor }],
}: QueryFunctionArgs<typeof nftsQueryKey>) {
  const { rawNFTData, nextCursor } = await fetchRawUniqueTokens(
    address,
    cursor
  );
  return { data: rawNFTData, nextCursor };
}

type NftsResult = QueryFunctionResult<typeof nftsQueryFunction>;

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchNfts(
  { address, cursor }: NftsQueryArgs,
  config: NftsQueryConfigType = {}
) {
  return await queryClient.fetchQuery(
    nftsQueryKey({ address, cursor }),
    nftsQueryFunction,
    { staleTime: DEFAULT_STALE_TIME, ...config }
  );
}
