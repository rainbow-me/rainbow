import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import useAccountSettings from './useAccountSettings';
import { getUniqueTokens } from '@rainbow-me/handlers/localstorage/accountLocal';
import {
  apiGetAccountUniqueTokens,
  UNIQUE_TOKENS_LIMIT_PER_PAGE,
  UNIQUE_TOKENS_LIMIT_TOTAL,
} from '@rainbow-me/handlers/opensea-api';
import { Network } from '@rainbow-me/helpers/networkTypes';

export default function useFetchUniqueTokens({
  address,
}: {
  address?: string;
}) {
  const [shouldFetchMore, setShouldFetchMore] = useState(false);
  const [hasStoredTokens, setHasStoredTokens] = useState(false);

  const { network } = useAccountSettings();
  const uniqueTokensQuery = useQuery(
    ['unique-tokens', address],
    async () => {
      if (!address) return;

      let storageTokens = await getUniqueTokens(address, network);

      const hasStoredTokens = storageTokens && storageTokens.length > 0;

      let uniqueTokens = storageTokens;
      if (!hasStoredTokens) {
        uniqueTokens = await apiGetAccountUniqueTokens(network, address, 0);
      }

      setShouldFetchMore(true);
      setHasStoredTokens(hasStoredTokens);

      return uniqueTokens;
    },
    {
      enabled: Boolean(address),
      staleTime: 10000,
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
      uniqueTokens?: any;
      page?: number;
    }): Promise<any> {
      if (
        uniqueTokens?.length >= page * UNIQUE_TOKENS_LIMIT_PER_PAGE &&
        uniqueTokens?.length < UNIQUE_TOKENS_LIMIT_TOTAL
      ) {
        const moreUniqueTokens = await apiGetAccountUniqueTokens(
          network,
          address as string,
          page
        );
        const concatUniqueTokens = [...uniqueTokens, ...moreUniqueTokens];
        if (!hasStoredTokens) {
          queryClient.setQueryData<any[]>(['unique-tokens', address], tokens =>
            tokens ? [...tokens, ...moreUniqueTokens] : moreUniqueTokens
          );
        }
        return fetchMore({
          network,
          page: page + 1,
          uniqueTokens: concatUniqueTokens,
        });
      }
      return uniqueTokens;
    }

    if (shouldFetchMore && uniqueTokens?.length > 0) {
      setShouldFetchMore(false);
      (async () => {
        // Fetch more Ethereum tokens until all have fetched
        const tokens = await fetchMore({
          network,
          // If there are stored tokens in storage, then we want
          // to do a background refresh.
          page: hasStoredTokens ? 0 : 1,
          uniqueTokens: hasStoredTokens ? [] : uniqueTokens,
        });

        // Fetch Polygon tokens until all have fetched
        const polygonTokens = await fetchMore({ network: Network.polygon });

        if (hasStoredTokens) {
          queryClient.setQueryData<any>(
            ['unique-tokens', address],
            [...tokens, ...polygonTokens]
          );
        }
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
