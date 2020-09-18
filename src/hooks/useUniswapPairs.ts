import { Pair, TokenAmount } from '@uniswap/sdk';
import { compact } from 'lodash';
import { useMemo } from 'react';
import {
  PAIR_GET_RESERVES_FRAGMENT,
  PAIR_INTERFACE,
} from '../references/uniswap';
import useMulticall from './useMulticall';
import useUniswapCalls from './useUniswapCalls';

export default function useUniswapPairs(inputCurrency, outputCurrency) {
  const { allPairCombinations, calls } = useUniswapCalls(
    inputCurrency,
    outputCurrency
  );

  const { multicallResults } = useMulticall(
    calls,
    PAIR_INTERFACE,
    PAIR_GET_RESERVES_FRAGMENT
    // latestBlockNumber // TODO JIN
  );

  const allPairs = useMemo(() => {
    const viablePairs = multicallResults.map((result, i) => {
      const { result: reserves, loading } = result;
      const tokenA = allPairCombinations[i][0];
      const tokenB = allPairCombinations[i][1];

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
    return compact(viablePairs);
  }, [allPairCombinations, multicallResults]);

  return {
    allPairs,
  };
}
