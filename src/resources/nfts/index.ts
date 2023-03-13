import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createQueryKey, queryClient } from '@/react-query';
import { NFT } from '@/resources/nfts/types';
import { UniqueAsset } from '@/entities/uniqueAssets';
import { useIsMounted } from '@/hooks';
import { fetchSimplehashNFTs } from '@/resources/nfts/simplehash';
import { useEffect, useReducer, useState } from 'react';
import { uniqBy } from 'lodash';
import { simplehashNFTToUniqueAsset } from '@/resources/nfts/simplehash/utils';
import { rainbowFetch } from '@/rainbow-fetch';
import { SimplehashChain } from './simplehash/types';

const NFTS_LIMIT = 2000;
const STALE_TIME = 600000; // 10 minutes

export const nftsQueryKey = ({ address }: { address: string }) =>
  createQueryKey('nfts', { address }, { persisterVersion: 1 });

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
      staleTime: STALE_TIME,
    }
  );
}

export async function fetchLegacyNFTs(address: string): Promise<UniqueAsset[]> {
  let finished = false;
  let cursor: string | undefined;
  let freshNFTs: UniqueAsset[] = [];

  while (!finished) {
    // eslint-disable-next-line no-await-in-loop
    const [simplehashResponse, polygonAllowlist] = await Promise.all([
      fetchSimplehashNFTs(address, cursor),
      fetchPolygonAllowlist(),
    ]);

    const { nfts: simplehashNFTs, nextCursor } = simplehashResponse;

    const newNFTs = simplehashNFTs
      .filter(nft => {
        if (nft.chain === SimplehashChain.Polygon) {
          return polygonAllowlist.includes(nft.contract_address);
        }
        return true;
      })
      .map(simplehashNFTToUniqueAsset);

    freshNFTs = freshNFTs.concat(newNFTs);

    if (nextCursor && freshNFTs.length < NFTS_LIMIT) {
      cursor = nextCursor;
    } else {
      // eslint-disable-next-line require-atomic-updates
      finished = true;
    }

    const currentNFTs =
      queryClient.getQueryData<UniqueAsset[]>(nftsQueryKey({ address })) ?? [];

    // iteratively update query data with new NFTs until the limit is hit
    if (currentNFTs.length < NFTS_LIMIT) {
      queryClient.setQueryData<UniqueAsset[]>(
        nftsQueryKey({ address }),
        cachedNFTs =>
          cachedNFTs ? uniqBy(cachedNFTs.concat(newNFTs), 'uniqueId') : newNFTs
      );
    }
  }

  // once we successfully fetch all NFTs, replace all cached NFTs with fresh ones
  queryClient.setQueryData<UniqueAsset[]>(
    nftsQueryKey({ address }),
    () => freshNFTs
  );

  return freshNFTs;
}

export function useNFTs(): NFT[] {
  // normal react query where we get new NFT formatted data
  return [];
}

export function useLegacyNFTs(
  address: string
): { nfts: UniqueAsset[]; isLoading: boolean } {
  const queryClient = useQueryClient();
  const mounted = useIsMounted();

  const queryKey = nftsQueryKey({ address });

  // listen for query udpates
  const { data, isStale } = useQuery<UniqueAsset[]>(queryKey, async () => [], {
    enabled: false,
    staleTime: STALE_TIME,
  });

  const [cursor, setCursor] = useState<string>();
  const [isFinished, finish] = useReducer(() => true, !isStale);
  const [freshNFTs, setFreshNFTs] = useState<UniqueAsset[]>([]);

  const nfts = data ?? [];

  useEffect(() => {
    // stream in NFTs one simplehash response page at a time
    const fetchNFTs = async () => {
      const [simplehashResponse, polygonAllowlist] = await Promise.all([
        fetchSimplehashNFTs(address, cursor),
        fetchPolygonAllowlist(),
      ]);

      const { nfts: simplehashNFTs, nextCursor } = simplehashResponse;

      const newNFTs = simplehashNFTs
        .filter(nft => {
          if (nft.chain === SimplehashChain.Polygon) {
            return polygonAllowlist.includes(nft.contract_address);
          }
          return true;
        })
        .map(simplehashNFTToUniqueAsset);

      const updatedFreshNFTs = freshNFTs.concat(newNFTs);
      setFreshNFTs(updatedFreshNFTs);

      if (nextCursor && updatedFreshNFTs.length < NFTS_LIMIT) {
        setCursor(nextCursor);
      } else {
        finish();
      }

      // iteratively update query data with new NFTs until the limit is hit
      if (nfts.length < NFTS_LIMIT) {
        queryClient.setQueryData<UniqueAsset[]>(queryKey, cachedNFTs =>
          cachedNFTs ? uniqBy(cachedNFTs.concat(newNFTs), 'uniqueId') : newNFTs
        );
      }
    };
    if (address && !isFinished && mounted.current) {
      fetchNFTs();
    }
  }, [
    address,
    cursor,
    freshNFTs,
    isFinished,
    mounted,
    nfts.length,
    queryClient,
    queryKey,
  ]);

  useEffect(() => {
    // once we successfully fetch all NFTs, replace all cached NFTs with fresh ones
    if (isFinished && freshNFTs.length > 0) {
      queryClient.setQueryData<UniqueAsset[]>(queryKey, () => freshNFTs);
    }
  }, [freshNFTs, isFinished, queryClient, queryKey]);

  return { nfts, isLoading: !isFinished };
}
