import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createQueryKey, queryClient, QueryFunctionArgs } from '@/react-query';
import { NFT } from '@/resources/nfts/types';
import { UniqueAsset } from '@/entities/uniqueAssets';
import { useAccountSettings, useIsMounted } from '@/hooks';
import {
  getUniqueTokens,
  saveUniqueTokens,
} from '@/handlers/localstorage/accountLocal';
import { fetchSimplehashNfts } from './simplehash';
import { useEffect, useReducer, useState } from 'react';
import {
  applyENSMetadataFallbackToTokens,
  parseSimplehashNfts,
} from '@/parsers/uniqueTokens';
import { uniqBy } from 'lodash';

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

  const nftsQuery = useQuery<UniqueAsset[]>(
    nftsQueryKey({ address }),
    async () => [],
    {
      enabled: false,
      staleTime: Infinity,
    }
  );

  const nfts = nftsQuery.data ?? [];

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

      let newNfts = parseSimplehashNfts(simplehashNfts);

      // If there are any "unknown" ENS names, fallback to the ENS
      // metadata service.
      newNfts = await applyENSMetadataFallbackToTokens(newNfts);

      queryClient.setQueryData<UniqueAsset[]>(
        nftsQueryKey({ address }),
        cachedNfts => uniqBy([...newNfts, ...(cachedNfts ?? [])], 'uniqueId')
      );
    };
    if (!isFinished && mounted.current && nfts.length < NFTS_LIMIT) {
      fetchNFTs();
    }
  }, [address, cursor, isFinished, mounted, nfts.length, queryClient]);

  return nfts;
}

export function useLegacyNFT(): UniqueAsset {
  // normal react query where we get UniqueAsset formatted data as an interim step
  // @ts-ignore TODO implement
  return {};
}
