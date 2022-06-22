import { ChainId, Pair, Token } from '@uniswap/sdk';
import { map, uniqBy } from 'lodash';
import { useMemo } from 'react';
import { getTokenForCurrency } from '../handlers/uniswap';
import useAccountSettings from './useAccountSettings';
import useSwapCurrencies from './useSwapCurrencies';

import {
  PAIR_GET_RESERVES_CALL_DATA,
  UNISWAP_V2_BASES,
} from '@rainbow-me/references';

export default function useUniswapCalls() {
  const { chainId } = useAccountSettings();
  const { inputCurrency, outputCurrency } = useSwapCurrencies();

  const inputToken: Token | null = useMemo(() => {
    if (!inputCurrency) return null;
    return getTokenForCurrency(inputCurrency, chainId);
  }, [chainId, inputCurrency]);

  const outputToken: Token | null = useMemo(() => {
    if (!outputCurrency) return null;
    return getTokenForCurrency(outputCurrency, chainId);
  }, [chainId, outputCurrency]);

  const bases = useMemo(() => {
    return UNISWAP_V2_BASES[chainId as ChainId] ?? [];
  }, [chainId]);

  const allPairCombinations = useMemo(() => {
    if (!inputToken || !outputToken) return [];
    const combos: [Token, Token][] = [
      // the direct pair
      [inputToken, outputToken],
      // token A against all bases
      ...bases.map((base): [Token, Token] => [inputToken, base]),
      // token B against all bases
      ...bases.map((base): [Token, Token] => [outputToken, base]),
      // each base against all bases
      ...bases.flatMap((base): [Token, Token][] =>
        bases.map(otherBase => [base, otherBase])
      ),
    ];

    const validCombos = combos.filter(
      ([inputToken, outputToken]) =>
        inputToken && outputToken && !inputToken.equals(outputToken)
    );

    const uniqCombos = uniqBy(validCombos, ([inputToken, outputToken]) =>
      Pair.getAddress(inputToken, outputToken)?.toLowerCase()
    );
    return uniqCombos;
  }, [bases, inputToken, outputToken]);

  const pairAddresses = useMemo(() => {
    return map(allPairCombinations, ([inputToken, outputToken]) =>
      Pair.getAddress(inputToken, outputToken)?.toLowerCase()
    );
  }, [allPairCombinations]);

  const calls = useMemo(() => {
    return map(pairAddresses, address => ({
      address,
      callData: PAIR_GET_RESERVES_CALL_DATA,
    }));
  }, [pairAddresses]);

  return {
    allPairCombinations,
    calls,
  };
}
