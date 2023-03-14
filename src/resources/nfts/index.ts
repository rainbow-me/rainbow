import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { createQueryKey } from '@/react-query';
import { NFT } from '@/resources/nfts/types';
import { fetchSimplehashNFTs } from '@/resources/nfts/simplehash';
import { useEffect } from 'react';
import {
  filterSimplehashNFTs,
  simplehashNFTToUniqueAsset,
} from '@/resources/nfts/simplehash/utils';
import { rainbowFetch } from '@/rainbow-fetch';
import { useAccountSettings } from '@/hooks';

const NFTS_LIMIT = 2000;
const NFTS_REFETCH_INTERVAL = 240000; // 4 minutes
const NFTS_STALE_TIME = 300000; // 5 minutes
const POLYGON_ALLOWLIST_STALE_TIME = 600000; // 10 minutes

export const nftsQueryKey = ({ address }: { address: string }) =>
  createQueryKey('nfts', { address }, { persisterVersion: 1 });

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

export function useNFTs(): NFT[] {
  // normal react query where we get new NFT formatted data
  return [];
}

export function useLegacyNFTs({ address }: { address: string }) {
  const { accountAddress } = useAccountSettings();
  const isOwner = accountAddress === address;
  const { data: polygonAllowlist } = usePolygonAllowlist();
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: nftsQueryKey({ address }),
    queryFn: async ({ pageParam }) => {
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
    // this query will automatically refresh every 4 minutes
    // this way we can minimize the amount of time the user sees partial/no data
    refetchInterval: isOwner ? NFTS_REFETCH_INTERVAL : false,
    refetchIntervalInBackground: isOwner,
    // we still need to set a stale time because unlike the refetch interval,
    // this will persist across app instances
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
