import { ChainId, Pair } from '@uniswap/sdk';
import { filter, flatMap, map, toLower, uniqBy } from 'lodash';
import { useMemo } from 'react';
import {
  PAIR_GET_RESERVES_CALL_DATA,
  UNISWAP_V2_BASES,
} from '../references/uniswap';

import useAccountSettings from './useAccountSettings';

export default function useUniswapCalls(inputCurrency, outputCurrency) {
  const { chainId } = useAccountSettings();

  const bases = useMemo(() => {
    const basebase = UNISWAP_V2_BASES[chainId as ChainId] ?? [];
    return basebase;
  }, [chainId]);

  const allPairCombinations = useMemo(() => {
    if (!inputCurrency || !outputCurrency) return [];
    const combos = [
      // the direct pair
      [inputCurrency, outputCurrency],
      // token A against all bases
      ...bases.map((base): [Token | undefined, Token | undefined] => [
        inputCurrency,
        base,
      ]),
      // token B against all bases
      ...bases.map((base): [Token | undefined, Token | undefined] => [
        outputCurrency,
        base,
      ]),
      // each base against all bases
      ...flatMap(bases, (base): [Token, Token][] =>
        bases.map(otherBase => [base, otherBase])
      ),
    ];

    let validCombos = filter(
      combos,
      ([inputCurrency, outputCurrency]) =>
        inputCurrency && outputCurrency && !inputCurrency.equals(outputCurrency)
    );

    const uniqCombos = uniqBy(validCombos, ([inputCurrency, outputCurrency]) =>
      toLower(Pair.getAddress(inputCurrency, outputCurrency))
    );
    return uniqCombos;
  }, [bases, inputCurrency, outputCurrency]);

  const pairAddresses = useMemo(() => {
    return map(allPairCombinations, ([inputCurrency, outputCurrency]) =>
      toLower(Pair.getAddress(inputCurrency, outputCurrency))
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
