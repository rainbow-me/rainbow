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
import { useAccountSettings, useWallets } from '@/hooks';

const NFTS_LIMIT = 2000;
const NFTS_REFETCH_INTERVAL = 240000; // 4 minutes
const NFTS_STALE_TIME = 300000; // 5 minutes
const NFTS_CACHE_TIME = 600000; // 10 minutes
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
  const { accountAddress } = useAccountSettings();
  const { wallets } = useWallets();

  const isSelectedWallet = accountAddress === address;
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
    // this query will automatically refresh every 4 minutes
    // this way we can minimize the amount of time the user sees partial/no data
    refetchInterval: isSelectedWallet ? NFTS_REFETCH_INTERVAL : false,
    refetchIntervalInBackground: isSelectedWallet,
    // we still need to set a stale time because unlike the refetch interval,
    // this will persist across app instances
    staleTime: NFTS_STALE_TIME,
    cacheTime: isImportedWallet ? Infinity : NFTS_CACHE_TIME,
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
