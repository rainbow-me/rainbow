import { Pair, TokenAmount } from '@uniswap/sdk';
import { compact } from 'lodash';
import { useMemo } from 'react';
import useMulticall from './useMulticall';
import useUniswapCalls from './useUniswapCalls';
import {
  PAIR_GET_RESERVES_FRAGMENT,
  PAIR_INTERFACE,
} from '@rainbow-me/references';

export default function useUniswapPairs() {
  const { allPairCombinations, calls } = useUniswapCalls();

  const { multicallResults } = useMulticall(
    calls,
    PAIR_INTERFACE,
    PAIR_GET_RESERVES_FRAGMENT
  );

  const { allPairs, doneLoadingReserves } = useMemo(() => {
    let doneLoadingReserves = true;
    const viablePairs = multicallResults.map((result, i) => {
      const { result: reserves, loading } = result;
      const tokenA = allPairCombinations[i][0];
      const tokenB = allPairCombinations[i][1];
      if (loading) {
        doneLoadingReserves = false;
      }

      if (loading || !reserves || !tokenA || !tokenB) return null;
      const { reserve0, reserve1 } = reserves;
      const [token0, token1] = tokenA.sortsBefore(tokenB)
        ? [tokenA, tokenB]
        : [tokenB, tokenA];
      return new Pair(
        new TokenAmount(token0, reserve0.toString()),
        new TokenAmount(token1, reserve1.toString())
      );
    });

    return {
      allPairs: compact(viablePairs),
      doneLoadingReserves,
    };
  }, [allPairCombinations, multicallResults]);

  return {
    allPairs,
    doneLoadingReserves,
  };
}
