import { useQuery, useQueryClient } from '@tanstack/react-query';
import { uniqBy } from 'lodash';
import { useEffect, useState } from 'react';
import useAccountSettings from './useAccountSettings';
import useIsMounted from './useIsMounted';
import { parseSimplehashNFTs } from '@/parsers/uniqueTokens';
import { UniqueAsset } from '@/entities';
import { fetchEnsTokens } from '@/handlers/ens';
import {
  getUniqueTokens,
  saveUniqueTokens,
} from '@/handlers/localstorage/accountLocal';
import {
  UNIQUE_TOKENS_LIMIT_PER_PAGE,
  UNIQUE_TOKENS_LIMIT_TOTAL,
} from '@/handlers/opensea-api';
import { Network } from '@/helpers/networkTypes';
import { fetchRawUniqueTokens } from '@/handlers/simplehash';
import { fetchPolygonAllowlist } from '@/resources/polygonAllowlistQuery';
import { filterNfts } from '@/helpers/uniqueTokens';

export const uniqueTokensQueryKey = ({ address }: { address?: string }) => [
  'unique-tokens',
  address,
];

export default function useFetchUniqueTokens({
  address,
  infinite = false,
  staleTime = 10000,
}: {
  address?: string;
  infinite?: boolean;
  staleTime?: number;
}) {
  const { network } = useAccountSettings();
  const mounted = useIsMounted();

  const [shouldFetchMore, setShouldFetchMore] = useState<boolean>();
  const [cursor, setCursor] = useState<string>();

  // Get unique tokens from device storage
  const [hasStoredTokens, setHasStoredTokens] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const { hasStoredTokens } = await getStoredUniqueTokens({
          address,
          network,
        });
        setHasStoredTokens(hasStoredTokens);
        // eslint-disable-next-line no-empty
      } catch (e) {}
    })();
  }, [address, network]);

  // Make the first query to retrieve the unique tokens.
  const uniqueTokensQuery = useQuery<UniqueAsset[]>(
    uniqueTokensQueryKey({ address }),
    async () => {
      if (!address) return [];

      const { storedTokens, hasStoredTokens } = await getStoredUniqueTokens({
        address,
        network,
      });

      let uniqueTokens = storedTokens;
      if (!hasStoredTokens) {
        const [uniqueTokensResponse, polygonAllowlist] = await Promise.all([
          fetchRawUniqueTokens(address as string),
          fetchPolygonAllowlist(),
        ]);
        const { rawNFTData, nextCursor } = uniqueTokensResponse;
        setCursor(nextCursor);
        uniqueTokens = filterNfts(
          parseSimplehashNFTs(rawNFTData),
          polygonAllowlist
        );
      }

      return uniqueTokens;
    },
    {
      enabled: Boolean(address),
      onSuccess: () =>
        shouldFetchMore === undefined ? setShouldFetchMore(true) : null,
      staleTime,
    }
  );
  const uniqueTokens = uniqueTokensQuery.data;

  const queryClient = useQueryClient();
  useEffect(() => {
    if (!address) return;

    async function fetchMore({
      network,
      uniqueTokens = [],
      cursor,
    }: {
      network: Network;
      uniqueTokens?: UniqueAsset[];
      cursor?: string;
    }): Promise<UniqueAsset[]> {
      const [uniqueTokensResponse, polygonAllowlist] = await Promise.all([
        cursor
          ? fetchRawUniqueTokens(address as string, cursor)
          : fetchRawUniqueTokens(address as string),
        fetchPolygonAllowlist(),
      ]);
      const { rawNFTData, nextCursor } = uniqueTokensResponse;

      const moreUniqueTokens = filterNfts(
        parseSimplehashNFTs(rawNFTData),
        polygonAllowlist
      );

      if (!hasStoredTokens) {
        queryClient.setQueryData<UniqueAsset[]>(
          uniqueTokensQueryKey({ address }),
          tokens =>
            tokens
              ? uniqBy([...tokens, ...moreUniqueTokens], 'uniqueId')
              : moreUniqueTokens
        );
      }
      if (
        rawNFTData?.length < UNIQUE_TOKENS_LIMIT_PER_PAGE ||
        (!nextCursor && uniqueTokens?.length >= UNIQUE_TOKENS_LIMIT_TOTAL) ||
        !mounted.current
      ) {
        return uniqueTokens;
      }
      return fetchMore({
        network,
        cursor: nextCursor,
        uniqueTokens: [...uniqueTokens, ...moreUniqueTokens],
      });
    }

    // We have already fetched the first page of results – so let's fetch more!
    if (
      infinite &&
      shouldFetchMore &&
      uniqueTokens &&
      uniqueTokens.length > 0
    ) {
      setShouldFetchMore(false);
      (async () => {
        // Fetch more Ethereum tokens until all have fetched
        let tokens = await fetchMore({
          network,
          // If there are stored tokens in storage, then we want
          // to do a background refresh.
          cursor,
          uniqueTokens: hasStoredTokens ? [] : uniqueTokens,
        });

        // Fetch recently registered ENS tokens (OpenSea doesn't recognize these for a while).
        // We will fetch tokens registered in the past 48 hours to be safe.
        const ensTokens = await fetchEnsTokens({
          address,
          timeAgo: { hours: 48 },
        });
        if (ensTokens.length > 0) {
          tokens = uniqBy([...tokens, ...ensTokens], 'uniqueId');
        }

        if (hasStoredTokens) {
          queryClient.setQueryData<UniqueAsset[]>(
            uniqueTokensQueryKey({ address }),
            tokens
          );
        }

        await saveUniqueTokens(tokens, address, network);
      })();
    }
  }, [
    address,
    shouldFetchMore,
    network,
    uniqueTokens,
    queryClient,
    hasStoredTokens,
    infinite,
    mounted,
    cursor,
  ]);

  return uniqueTokensQuery;
}

async function getStoredUniqueTokens({
  address,
  network,
}: {
  address?: string;
  network: Network;
}) {
  const storedTokens = await getUniqueTokens(address, network);
  const hasStoredTokens = storedTokens && storedTokens.length > 0;
  return {
    hasStoredTokens,
    storedTokens,
  };
}
