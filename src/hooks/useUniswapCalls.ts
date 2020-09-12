import { ChainId, Pair, Token } from '@uniswap/sdk';
import { filter, flatMap, map, toLower, uniqBy } from 'lodash';
import { useMemo } from 'react';
import { getTokenForCurrency } from '../handlers/uniswap';
import {
  PAIR_GET_RESERVES_CALL_DATA,
  UNISWAP_V2_BASES,
} from '../references/uniswap';

import useAccountSettings from './useAccountSettings';

export default function useUniswapCalls(inputCurrency, outputCurrency) {
  const { chainId } = useAccountSettings();

  const inputToken: Token = useMemo(
    () => getTokenForCurrency(inputCurrency, chainId),
    [chainId, inputCurrency]
  );

  const outputToken: Token | null = useMemo(
    () => getTokenForCurrency(outputCurrency, chainId),
    [chainId, outputCurrency]
  );

  const bases = useMemo(() => {
    const basebase = UNISWAP_V2_BASES[chainId as ChainId] ?? [];
    return basebase;
  }, [chainId]);

  const allPairCombinations = useMemo(() => {
    if (!inputToken || !outputToken) return [];
    const combos = [
      // the direct pair
      [inputToken, outputToken],
      // token A against all bases
      ...bases.map((base): [Token | undefined, Token | undefined] => [
        inputToken,
        base,
      ]),
      // token B against all bases
      ...bases.map((base): [Token | undefined, Token | undefined] => [
        outputToken,
        base,
      ]),
      // each base against all bases
      ...flatMap(bases, (base): [Token, Token][] =>
        bases.map(otherBase => [base, otherBase])
      ),
    ];

    let validCombos = filter(
      combos,
      ([inputToken, outputToken]) =>
        inputToken && outputToken && !inputToken.equals(outputToken)
    );

    const uniqCombos = uniqBy(validCombos, ([inputToken, outputToken]) =>
      toLower(Pair.getAddress(inputToken, outputToken))
    );
    return uniqCombos;
  }, [bases, inputToken, outputToken]);

  const pairAddresses = useMemo(() => {
    return map(allPairCombinations, ([inputToken, outputToken]) =>
      toLower(Pair.getAddress(inputToken, outputToken))
    );
  }, [allPairCombinations]);

  const calls = useMemo(() => {
    const theCalls = PAIR_GET_RESERVES_CALL_DATA
      ? map(pairAddresses, address => ({
          address,
          callData: PAIR_GET_RESERVES_CALL_DATA,
        }))
      : [];
    return theCalls;
  }, [pairAddresses]);

  return {
    allPairCombinations,
    calls,
  };
}
