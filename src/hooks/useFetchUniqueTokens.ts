import { get, uniqBy } from 'lodash';
import qs from 'qs';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import useAccountSettings from './useAccountSettings';
import { UniqueAsset } from '@rainbow-me/entities';
import { fetchEnsTokens } from '@rainbow-me/handlers/ens';
import {
  getUniqueTokens,
  saveUniqueTokens,
} from '@rainbow-me/handlers/localstorage/accountLocal';
import {
  apiGetAccountUniqueTokens,
  UNIQUE_TOKENS_LIMIT_TOTAL,
} from '@rainbow-me/handlers/opensea-api';
import { Network } from '@rainbow-me/helpers/networkTypes';
import { parseAccountUniqueTokensV2 } from '@rainbow-me/parsers';

export const uniqueTokensQueryKey = ({ address }: { address?: string }) => [
  'unique-tokens',
  address,
];

const STALE_TIME = 10000;
let cursor: string | null = 'start';

export default function useFetchUniqueTokens({
  address,
}: {
  address?: string;
}) {
  const { network } = useAccountSettings();

  const [shouldFetchMore, setShouldFetchMore] = useState(false);

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

  // Make the first query to retrive the unique tokens.
  const uniqueTokensQuery = useQuery<UniqueAsset[]>(
    uniqueTokensQueryKey({ address }),
    async () => {
      if (!address) return;

      const { storedTokens, hasStoredTokens } = await getStoredUniqueTokens({
        address,
        network,
      });

      let uniqueTokens = storedTokens;
      if (!hasStoredTokens) {
        const res = await apiGetAccountUniqueTokens(network, address, 'start');
        const nextPage = get(res, 'data.next', null);
        cursor = (qs.parse(nextPage)?.cursor as string) || null;
        uniqueTokens = await parseAccountUniqueTokensV2(res);
      }

      setShouldFetchMore(true);

      return uniqueTokens;
    },
    {
      enabled: Boolean(address),
      staleTime: STALE_TIME,
    }
  );
  const uniqueTokens = uniqueTokensQuery.data;

  const queryClient = useQueryClient();
  useEffect(() => {
    if (!address) return;

    async function fetchMore({
      network,
      uniqueTokens = [],
      cursor = 'start',
    }: {
      network: Network;
      uniqueTokens?: UniqueAsset[];
      cursor?: any;
    }): Promise<UniqueAsset[]> {
      if (uniqueTokens?.length < UNIQUE_TOKENS_LIMIT_TOTAL && cursor !== null) {
        const res = await apiGetAccountUniqueTokens(
          network,
          address as string,
          cursor
        );
        const moreUniqueTokens: UniqueAsset[] = await parseAccountUniqueTokensV2(
          res
        );
        const nextPage = get(res, 'data.next', null);
        cursor = qs.parse(nextPage)?.cursor || null;

        if (!hasStoredTokens) {
          queryClient.setQueryData<UniqueAsset[]>(
            uniqueTokensQueryKey({ address }),
            tokens =>
              tokens ? [...tokens, ...moreUniqueTokens] : moreUniqueTokens
          );
        }
        return fetchMore({
          cursor,
          network,
          uniqueTokens: [...uniqueTokens, ...moreUniqueTokens],
        });
      }
      return uniqueTokens;
    }

    // We have already fetched the first page of results – so let's fetch more!
    (async () => {
      if (shouldFetchMore) {
        // Fetch more Ethereum tokens until all have fetched
        setShouldFetchMore(false);
        let tokens = await fetchMore({
          // If there are stored tokens in storage, then we want
          // to do a background refresh.
          cursor: hasStoredTokens ? 'start' : cursor,
          network,
          uniqueTokens: hasStoredTokens ? [] : uniqueTokens,
        });

        // Fetch Polygon tokens until all have fetched
        const polygonTokens = await fetchMore({ network: Network.polygon });
        tokens = [...tokens, ...polygonTokens];

        // Fetch recently registered ENS tokens (OpenSea doesn't recognize these for a while).
        // We will fetch tokens registered in the past 48 hours to be safe.
        const ensTokens = await fetchEnsTokens({
          address,
          timeAgo: { hours: 48 },
        });
        if (ensTokens.length > 0) {
          tokens = uniqBy([...tokens, ...ensTokens], 'id');
        }

        if (hasStoredTokens) {
          queryClient.setQueryData<UniqueAsset[]>(
            uniqueTokensQueryKey({ address }),
            tokens
          );
        }

        await saveUniqueTokens(tokens, address, network);
      }
    })();
  }, [
    address,
    shouldFetchMore,
    network,
    uniqueTokens,
    queryClient,
    hasStoredTokens,
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
