import { useEffect } from 'react';
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
  const { network } = useAccountSettings();
  const { data: uniqueTokens, isFetched, isSuccess } = useQuery(
    ['unique-tokens', address],
    async () => {
      if (!address) return;
      const uniqueTokens = await apiGetAccountUniqueTokens(network, address, 0);
      return uniqueTokens;
    },
    { enabled: Boolean(address), staleTime: 10000 }
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
        uniqueTokens.length === page * UNIQUE_TOKENS_LIMIT_PER_PAGE &&
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
    if (isSuccess) {
      // Fetch more Ethereum tokens until all have fetched
      fetchMore({ network, page: 1, uniqueTokens });

      // Fetch Polygon tokens until all have fetched
      fetchMore({ network: Network.polygon });
    }
  });

  const tokenList = uniqueTokens
    ? buildBriefUniqueTokenList(uniqueTokens, [])
    : [];

  return {
    briefSectionsData: tokenList,
    isFetched,
  };
}
