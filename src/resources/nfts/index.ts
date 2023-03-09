import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createQueryKey, queryClient, QueryFunctionArgs } from '@/react-query';
import { NFT } from '@/resources/nfts/types';
import { UniqueAsset } from '@/entities/uniqueAssets';
import { useIsMounted } from '@/hooks';
import { fetchSimplehashNfts } from '@/resources/nfts/simplehash';
import { useEffect, useReducer, useState } from 'react';
import { uniqBy } from 'lodash';
import { simplehashNFTToUniqueAsset } from '@/resources/nfts/simplehash/utils';
import { logger } from '@/logger';

const NFTS_LIMIT = 2000;

export const nftsQueryKey = ({ address }: { address?: string }) =>
  createQueryKey('nfts', { address }, { persisterVersion: 1 });

export function useNFTs(): NFT[] {
  // normal react query where we get new NFT formatted data
  return [];
}

export function useNFT(tokenId: string): NFT {
  // normal react query where we get new NFT formatted data
  // @ts-ignore TODO implement
  return {};
}

export function useLegacyNFTs(address: string): UniqueAsset[] {
  const queryClient = useQueryClient();
  const mounted = useIsMounted();

  const [cursor, setCursor] = useState<string>();
  const [isFinished, finish] = useReducer(() => true, false);

  const queryKey = nftsQueryKey({ address });

  const query = useQuery<UniqueAsset[]>(queryKey, async () => [], {
    enabled: false,
    staleTime: Infinity,
  });

  const nfts = query.data ?? [];

  useEffect(() => {
    const fetchNFTs = async () => {
      const { nfts: simplehashNfts, nextCursor } = await fetchSimplehashNfts(
        address,
        cursor
      );

      if (nextCursor) {
        setCursor(nextCursor);
      } else {
        finish();
      }

      const newNfts = simplehashNfts.map(simplehashNFTToUniqueAsset);

      queryClient.setQueryData<UniqueAsset[]>(queryKey, cachedNfts =>
        uniqBy([...newNfts, ...(cachedNfts ?? [])], 'uniqueId')
      );
    };
    if (!isFinished && mounted.current && nfts.length < NFTS_LIMIT) {
      fetchNFTs();
    }
  }, [
    address,
    cursor,
    isFinished,
    mounted,
    nfts.length,
    queryClient,
    queryKey,
  ]);

  return nfts;
}
