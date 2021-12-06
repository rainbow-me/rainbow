import { ChainId, Pair, Token } from '@uniswap/sdk';
import { filter, flatMap, map, toLower, uniqBy } from 'lodash';
import { useMemo } from 'react';
import { getTokenForCurrency } from '../handlers/uniswap';
import useAccountSettings from './useAccountSettings';
import useSwapCurrencies from './useSwapCurrencies';

import {
  PAIR_GET_RESERVES_CALL_DATA,
  UNISWAP_V2_BASES,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
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
      ...bases.map((base: any): [Token, Token] => [inputToken, base]),
      // token B against all bases
      ...bases.map((base: any): [Token, Token] => [outputToken, base]),
      // each base against all bases
      ...flatMap(bases, (base): [Token, Token][] =>
        bases.map((otherBase: any) => [base, otherBase])
      ),
    ];

    const validCombos = filter(
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
