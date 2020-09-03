import { Pair, TokenAmount } from '@uniswap/sdk';
import { useMemo } from 'react';
import useMulticall from './useMulticall';
import useUniswapCalls from './useUniswapCalls';

export default function useUniswapPairs(inputCurrency, outputCurrency) {
  const {
    allPairCombinations,
    calls,
    contractInterface,
    fragment,
  } = useUniswapCalls(inputCurrency, outputCurrency);

  const { multicallResults } = useMulticall(
    calls,
    contractInterface,
    fragment
    // latestBlockNumber // TODO JIN
  );

  // create pair with reserve amounts
  const allPairs = useMemo(
    () =>
      multicallResults.map((result, i) => {
        const { result: reserves, loading } = result;
        const tokenA = allPairCombinations[i][0];
        const tokenB = allPairCombinations[i][1];

        if (loading || !tokenA || !tokenB) return undefined;
        if (!reserves) return null;
        const { reserve0, reserve1 } = reserves;
        const [token0, token1] = tokenA.sortsBefore(tokenB)
          ? [tokenA, tokenB]
          : [tokenB, tokenA];
        return new Pair(
          new TokenAmount(token0, reserve0.toString()),
          new TokenAmount(token1, reserve1.toString())
        );
      }),
    [allPairCombinations, multicallResults]
  );

  return {
    allPairs,
  };
}
