import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import useAccountSettings from './useAccountSettings';
import {
  apiGetAccountUniqueTokens,
  UNIQUE_TOKENS_LIMIT_PER_PAGE,
  UNIQUE_TOKENS_LIMIT_TOTAL,
} from '@rainbow-me/handlers/opensea-api';
import { buildBriefUniqueTokenList } from '@rainbow-me/helpers/assets';
import { Network } from '@rainbow-me/helpers/networkTypes';

export default function useExternalWalletSectionsData({
  address,
}: {
  address?: string;
}) {
  const [shouldFetchMore, setShouldFetchMore] = useState(false);
  const { network } = useAccountSettings();
  const { data: uniqueTokens, isFetched } = useQuery(
    ['unique-tokens', address],
    async () => {
      if (!address) return;
      const uniqueTokens = await apiGetAccountUniqueTokens(network, address, 0);
      setShouldFetchMore(true);
      return uniqueTokens;
    },
    {
      enabled: Boolean(address),
      staleTime: Infinity,
    }
  );

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
    }) {
      if (
        uniqueTokens.length >= page * UNIQUE_TOKENS_LIMIT_PER_PAGE &&
        uniqueTokens.length < UNIQUE_TOKENS_LIMIT_TOTAL
      ) {
        const moreUniqueTokens = await apiGetAccountUniqueTokens(
          network,
          address as string,
          page
        );
        const concatUniqueTokens = [...uniqueTokens, ...moreUniqueTokens];
        queryClient.setQueryData<any[]>(['unique-tokens', address], tokens =>
          tokens ? [...tokens, ...moreUniqueTokens] : moreUniqueTokens
        );
        await fetchMore({
          network,
          page: page + 1,
          uniqueTokens: concatUniqueTokens,
        });
      }
    }

    if (shouldFetchMore && uniqueTokens?.length > 0) {
      setShouldFetchMore(false);
      (async () => {
        // Fetch more Ethereum tokens until all have fetched
        await fetchMore({ network, page: 1, uniqueTokens });

        // Fetch Polygon tokens until all have fetched
        await fetchMore({ network: Network.polygon });
      })();
    }
  }, [address, shouldFetchMore, network, uniqueTokens, queryClient]);

  const tokenList = uniqueTokens
    ? buildBriefUniqueTokenList(uniqueTokens, [])
    : [];

  return {
    briefSectionsData: tokenList,
    isFetched,
  };
}
