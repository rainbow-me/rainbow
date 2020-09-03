import { Interface } from '@ethersproject/abi'; // TODO JIN
import { ChainId, Pair, WETH } from '@uniswap/sdk';
import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'; // TODO JIN
import { filter, flatMap, map, toLower, uniqBy } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { UNISWAP_V2_BASES } from '../references';

const PAIR_INTERFACE = new Interface(IUniswapV2PairABI);
const fragment = PAIR_INTERFACE.getFunction('getReserves');
const callData: string | undefined = fragment
  ? PAIR_INTERFACE.encodeFunctionData(fragment)
  : undefined;

export default function useUniswapCalls(inputCurrency, outputCurrency) {
  const { chainId, tokens } = useSelector(
    ({ settings: { chainId }, uniswap2: { tokens } }) => ({
      chainId,
      tokens,
    })
  );

  const inputToken: Token = useMemo(() => {
    const inputTok =
      inputCurrency && inputCurrency.address !== 'eth'
        ? tokens[inputCurrency.address]
        : WETH[ChainId.MAINNET];
    return inputTok;
  }, [inputCurrency, tokens]);

  const outputToken: Token | null = useMemo(() => {
    const outputTok = outputCurrency
      ? outputCurrency.address === 'eth'
        ? WETH[ChainId.MAINNET]
        : tokens[outputCurrency.address]
      : null;
    return outputTok;
  }, [outputCurrency, tokens]);

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
    const theCalls =
      fragment && callData
        ? map(pairAddresses, address => ({
            address,
            callData,
          }))
        : [];
    return theCalls;
  }, [pairAddresses]);

  return {
    allPairCombinations,
    calls,
    contractInterface: PAIR_INTERFACE,
    fragment,
  };
}
