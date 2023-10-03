import { RainbowToken } from '@/entities';
import { getTestnetUniswapPairs } from '@/handlers/swap';
import { useAccountSettings } from '@/hooks';
import { Network } from '@/networks/types';
import { createQueryKey } from '@/react-query';
import { rainbowTokenList } from '@/references';
import { useQuery } from '@tanstack/react-query';

export const curatedTokensQueryKey = createQueryKey('uniswapPairs', {});

export function useCuratedTokens(): Record<string, RainbowToken> {
  const { network } = useAccountSettings();
  const query = useQuery(
    curatedTokensQueryKey,
    () =>
      // this query is not async, but rainbowTokenList receives async updates
      network === Network.mainnet
        ? rainbowTokenList.CURATED_TOKENS
        : getTestnetUniswapPairs(network),
    {
      staleTime: Infinity, // query will be invalidated & refreshed when rainbowTokenList receives updates (see App.js)
    }
  );

  // @ts-ignore getTestnetUniswapPairs has wrong type
  return query.data ?? {};
}
