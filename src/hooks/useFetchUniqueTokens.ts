import { uniqBy } from 'lodash';
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
  UNIQUE_TOKENS_LIMIT_PER_PAGE,
  UNIQUE_TOKENS_LIMIT_TOTAL,
} from '@rainbow-me/handlers/opensea-api';
import { Network } from '@rainbow-me/helpers/networkTypes';

export const uniqueTokensQueryKey = ({ address }: { address?: string }) => [
  'unique-tokens',
  address,
];

const STALE_TIME = 10000;

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
        uniqueTokens = await apiGetAccountUniqueTokens(network, address, 0);
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
      page = 0,
    }: {
      network: Network;
      uniqueTokens?: UniqueAsset[];
      page?: number;
    }): Promise<UniqueAsset[]> {
      if (
        uniqueTokens?.length >= page * UNIQUE_TOKENS_LIMIT_PER_PAGE &&
        uniqueTokens?.length < UNIQUE_TOKENS_LIMIT_TOTAL
      ) {
        const moreUniqueTokens = await apiGetAccountUniqueTokens(
          network,
          address as string,
          page
        );
        if (!hasStoredTokens) {
          queryClient.setQueryData<UniqueAsset[]>(
            uniqueTokensQueryKey({ address }),
            tokens =>
              tokens ? [...tokens, ...moreUniqueTokens] : moreUniqueTokens
          );
        }
        return fetchMore({
          network,
          page: page + 1,
          uniqueTokens: [...uniqueTokens, ...moreUniqueTokens],
        });
      }
      return uniqueTokens;
    }

    // We have already fetched the first page of results – so let's fetch more!
    if (shouldFetchMore && uniqueTokens && uniqueTokens.length > 0) {
      setShouldFetchMore(false);
      (async () => {
        // Fetch more Ethereum tokens until all have fetched
        let tokens = await fetchMore({
          network,
          // If there are stored tokens in storage, then we want
          // to do a background refresh.
          page: hasStoredTokens ? 0 : 1,
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
      })();
    }
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
