import {
  QueryClientConfig,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import { createQueryKey, queryClient } from '@/react-query';
import { NFT } from '@/resources/nfts/types';
import { UniqueAsset } from '@/entities/uniqueAssets';
import { fetchSimplehashNFTs } from '@/resources/nfts/simplehash';
import { useEffect } from 'react';
import {
  filterSimplehashNFTs,
  simplehashNFTToUniqueAsset,
} from '@/resources/nfts/simplehash/utils';
import { rainbowFetch } from '@/rainbow-fetch';

const NFTS_LIMIT = 2000;
const NFTS_STALE_TIME = 300000; // 5 minutes
const POLYGON_ALLOWLIST_STALE_TIME = 600000; // 10 minutes

export const nftsQueryKey = ({ address }: { address: string }) =>
  createQueryKey('nfts', { address }, { persisterVersion: 1 });

export const nftsStreamQueryKey = ({ address }: { address: string }) =>
  createQueryKey('nftsStream', { address }, { persisterVersion: 1 });

async function fetchPolygonAllowlist(): Promise<string[]> {
  return await queryClient.fetchQuery(
    ['polygon-allowlist'],
    async () =>
      (
        await rainbowFetch(
          'https://metadata.p.rainbow.me/token-list/137-allowlist.json',
          { method: 'get' }
        )
      ).data.data.addresses,
    {
      staleTime: POLYGON_ALLOWLIST_STALE_TIME,
    }
  );
}

function usePolygonAllowlist() {
  return useQuery<string[]>({
    queryKey: ['polygon-allowlist'],
    queryFn: async () =>
      (
        await rainbowFetch(
          'https://metadata.p.rainbow.me/token-list/137-allowlist.json',
          { method: 'get' }
        )
      ).data.data.addresses,
    staleTime: POLYGON_ALLOWLIST_STALE_TIME,
  });
}

export async function fetchLegacyNFTs({
  address,
  queryClientConfig,
}: {
  address: string;
  queryClientConfig: QueryClientConfig;
}): Promise<UniqueAsset[]> {
  return queryClient.fetchQuery(
    nftsQueryKey({ address }),
    async () => {
      let finished = false;
      let cursor: string | undefined;
      let nfts: UniqueAsset[] = [];
      while (!finished) {
        // eslint-disable-next-line no-await-in-loop
        const [simplehashResponse, polygonAllowlist] = await Promise.all([
          fetchSimplehashNFTs(address, cursor),
          fetchPolygonAllowlist(),
        ]);

        const { data: simplehashNFTs, nextCursor } = simplehashResponse;

        const newNFTs = filterSimplehashNFTs(
          simplehashNFTs,
          polygonAllowlist
        ).map(simplehashNFTToUniqueAsset);

        nfts = nfts.concat(newNFTs);

        if (nextCursor && nfts.length < NFTS_LIMIT) {
          cursor = nextCursor;
        } else {
          // eslint-disable-next-line require-atomic-updates
          finished = true;
        }
      }
      return nfts;
    },
    { staleTime: NFTS_STALE_TIME, ...queryClientConfig }
  );
}

export function useNFTs(): NFT[] {
  // normal react query where we get new NFT formatted data
  return [];
}

export function useLegacyNFTs({ address }: { address: string }) {
  const { data: polygonAllowlist } = usePolygonAllowlist();
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: nftsStreamQueryKey({ address }),
    queryFn: async ({ pageParam }) => {
      // if we haven't started streaming yet, check if we can
      // borrow cache from non-streaming query key
      if (!pageParam) {
        const cache = queryClient.getQueryData<UniqueAsset[]>(
          nftsQueryKey({ address })
        );
        return {
          data: cache,
          nextCursor: null,
        };
      }
      const { data, nextCursor } = await fetchSimplehashNFTs(
        address,
        pageParam
      );
      const newNFTs = filterSimplehashNFTs(data, polygonAllowlist).map(
        simplehashNFTToUniqueAsset
      );
      return {
        data: newNFTs,
        nextCursor,
      };
    },
    getNextPageParam: lastPage => lastPage.nextCursor,
    keepPreviousData: true,
    staleTime: NFTS_STALE_TIME,
    enabled: !!polygonAllowlist && !!address,
  });

  const nfts = data?.pages ? data.pages.flatMap(page => page.data) : [];

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && nfts.length < NFTS_LIMIT) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage, isFetchingNextPage, nfts.length]);

  return {
    data: nfts,
    error,
    isFetching,
  };
}
