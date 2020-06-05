import { ChainId, Pair, Token, WETH } from '@uniswap/sdk2';
import { compact, flatMap, map, pick, toLower } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { UNISWAP_V2_BASES } from '../references';

export default function useUniswapPairs() {
  const {
    chainId,
    inputCurrency,
    outputCurrency,
    pairs,
    tokens,
  }: {
    chainId?: Number;
    inputCurrency?: { address: string };
    outputCurrency?: { address: string };
    pairs: Record<string, Pair>;
    tokens: Record<string, Token>;
  } = useSelector(
    ({
      settings: { chainId },
      uniswap2: { pairs, tokens },
      uniswap: { inputCurrency, outputCurrency },
    }) => ({
      chainId,
      inputCurrency,
      outputCurrency,
      pairs,
      tokens,
    })
  );

  // translating v1 tokens into v2. Probably need to fix later
  const inputToken: Token = inputCurrency
    ? tokens[inputCurrency.address]
    : WETH[ChainId.MAINNET];
  const outputToken: Token | null = outputCurrency
    ? tokens[outputCurrency.address]
    : null;

  const bases = useMemo(() => UNISWAP_V2_BASES[chainId as ChainId] ?? [], [
    chainId,
  ]);

  const allPairCombinations: [
    Token | undefined,
    Token | undefined
  ][] = useMemo(() => {
    if (!inputToken || !outputToken) return [];

    return [
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
  }, [inputToken, outputToken, bases]);

  const allPairs = useMemo(() => {
    const pairAddresses = map(
      allPairCombinations,
      ([inputToken, outputToken]) =>
        inputToken && outputToken && !inputToken.equals(outputToken)
          ? toLower(Pair.getAddress(inputToken, outputToken))
          : undefined
    );
    return pick(pairs, compact(pairAddresses));
  }, [allPairCombinations, pairs]);

  return {
    allPairs,
    inputToken,
    outputToken,
  };
}
