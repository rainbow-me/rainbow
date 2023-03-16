import { useInfiniteQuery } from '@tanstack/react-query';
import { createQueryKey, queryClient } from '@/react-query';
import { NFT } from '@/resources/nfts/types';
import { fetchSimpleHashNFTs } from '@/resources/nfts/simplehash';
import { useEffect, useMemo } from 'react';
import {
  filterSimpleHashNFTs,
  simpleHashNFTToUniqueAsset,
} from '@/resources/nfts/simplehash/utils';
import { rainbowFetch } from '@/rainbow-fetch';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';

const NFTS_LIMIT = 2000;
const NFTS_STALE_TIME = 300000; // 5 minutes
const NFTS_CACHE_TIME_EXTERNAL = 3600000; // 1 hour
const NFTS_CACHE_TIME_INTERNAL = 604800000; // 1 week
const POLYGON_ALLOWLIST_STALE_TIME = 600000; // 10 minutes

export const nftsQueryKey = ({ address }: { address: string }) =>
  createQueryKey('nfts', { address }, { persisterVersion: 1 });

function fetchPolygonAllowlist() {
  return queryClient.fetchQuery<string[]>(
    ['polygon-allowlist'],
    async () =>
      (
        await rainbowFetch(
          'https://metadata.p.rainbow.me/token-list/137-allowlist.json',
          { method: 'get' }
        )
      ).data.data.addresses,
    { staleTime: POLYGON_ALLOWLIST_STALE_TIME }
  );
}

export function useNFTs(): NFT[] {
  // normal react query where we get new NFT formatted data
  return [];
}

export function useLegacyNFTs({ address }: { address: string }) {
  const { wallets } = useSelector((state: AppState) => state.wallets);

  const walletAddresses = useMemo(
    () =>
      wallets
        ? Object.values(wallets).flatMap(wallet =>
            wallet.addresses.map(account => account.address)
          )
        : [],
    [wallets]
  );
  const isImportedWallet = walletAddresses.includes(address);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteQuery({
    queryKey: nftsQueryKey({ address }),
    queryFn: async ({ pageParam }) => {
      const [simplehashResponse, polygonAllowlist] = await Promise.all([
        fetchSimpleHashNFTs(address, pageParam),
        fetchPolygonAllowlist(),
      ]);
      const { data, nextCursor } = simplehashResponse;
      const newNFTs = filterSimpleHashNFTs(data, polygonAllowlist).map(
        simpleHashNFTToUniqueAsset
      );
      return {
        data: newNFTs,
        nextCursor,
      };
    },
    getNextPageParam: lastPage => lastPage.nextCursor,
    keepPreviousData: true,
    staleTime: NFTS_STALE_TIME,
    cacheTime: isImportedWallet
      ? NFTS_CACHE_TIME_INTERNAL
      : NFTS_CACHE_TIME_EXTERNAL,
    enabled: !!address,
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
    isInitialLoading: !nfts.length && isFetching,
  };
}
