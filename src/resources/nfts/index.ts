import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createQueryKey, queryClient } from '@/react-query';
import { NFT } from '@/resources/nfts/types';
import { UniqueAsset } from '@/entities/uniqueAssets';
import { useIsMounted } from '@/hooks';
import { fetchSimplehashNFTs } from '@/resources/nfts/simplehash';
import { useEffect, useReducer, useState } from 'react';
import { uniqBy } from 'lodash';
import { simplehashNFTToUniqueAsset } from '@/resources/nfts/simplehash/utils';

const NFTS_LIMIT = 2000;

export const nftsQueryKey = ({ address }: { address: string }) =>
  createQueryKey('nfts', { address }, { persisterVersion: 1 });

export const fetchLegacyNFTs = async (
  address: string
): Promise<UniqueAsset[]> => {
  let finished = false;
  let cursor: string | undefined;
  let freshNFTs: UniqueAsset[] = [];

  while (!finished) {
    // eslint-disable-next-line no-await-in-loop
    const { nfts: simplehashNFTs, nextCursor } = await fetchSimplehashNFTs(
      address,
      cursor
    );

    const newNFTs = simplehashNFTs.map(simplehashNFTToUniqueAsset);
    freshNFTs = [...newNFTs, ...freshNFTs];

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
        cachedNFTs => uniqBy([...newNFTs, ...(cachedNFTs ?? [])], 'uniqueId')
      );
    }
  }

  // once we successfully fetch all NFTs, replace all cached NFTs with fresh ones
  queryClient.setQueryData<UniqueAsset[]>(
    nftsQueryKey({ address }),
    () => freshNFTs
  );

  return freshNFTs;
};

export function useNFTs(): NFT[] {
  // normal react query where we get new NFT formatted data
  return [];
}

export function useLegacyNFTs(
  address: string
): { nfts: UniqueAsset[]; isLoading: boolean } {
  const queryClient = useQueryClient();
  const mounted = useIsMounted();

  const [cursor, setCursor] = useState<string>();
  const [isFinished, finish] = useReducer(() => true, false);
  const [freshNFTs, setFreshNFTs] = useState<UniqueAsset[]>([]);

  const queryKey = nftsQueryKey({ address });

  // listen for query udpates
  const query = useQuery<UniqueAsset[]>(queryKey, async () => [], {
    enabled: false,
    staleTime: Infinity,
  });

  const nfts = query.data ?? [];

  useEffect(() => {
    // stream in NFTs one simplehash response page at a time
    const fetchNFTs = async () => {
      const { nfts: simplehashNFTs, nextCursor } = await fetchSimplehashNFTs(
        address,
        cursor
      );

      const newNFTs = simplehashNFTs.map(simplehashNFTToUniqueAsset);
      const updatedFreshNFTs = [...newNFTs, ...freshNFTs];
      setFreshNFTs(updatedFreshNFTs);

      if (nextCursor && updatedFreshNFTs.length < NFTS_LIMIT) {
        setCursor(nextCursor);
      } else {
        finish();
      }

      // iteratively update query data with new NFTs until the limit is hit
      if (nfts.length < NFTS_LIMIT) {
        queryClient.setQueryData<UniqueAsset[]>(queryKey, cachedNFTs =>
          uniqBy([...newNFTs, ...(cachedNFTs ?? [])], 'uniqueId')
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
    if (isFinished) {
      queryClient.setQueryData<UniqueAsset[]>(queryKey, () => freshNFTs);
    }
  }, [freshNFTs, isFinished, queryClient, queryKey]);

  return { nfts, isLoading: !isFinished };
}
