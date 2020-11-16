import { compact, floor, isEmpty, map, orderBy, sumBy, values } from 'lodash';
import { createSelector } from 'reselect';
import {
  convertAmountToNativeDisplay,
  divide,
  multiply,
} from '../helpers/utilities';

const assetsSelector = state => state.data.assets;
const nativeCurrencySelector = state => state.settings.nativeCurrency;
const uniswapLiquidityTokenInfoSelector = state =>
  state.uniswapLiquidity.uniswapLiquidityTokenInfo;

export const transformPool = (liquidityPool, nativeCurrency) => {
  if (isEmpty(liquidityPool)) {
    return null;
  }

  const { balance, price, tokens, totalSupply, type, uniqueId } = liquidityPool;

  const percentageOwned = multiply(divide(balance, totalSupply), 100);

  const totalBalanceAmount = multiply(balance, price?.value || 0);
  const totalNativeDisplay = convertAmountToNativeDisplay(
    totalBalanceAmount,
    nativeCurrency
  );
  const pricePerShare = convertAmountToNativeDisplay(
    divide(totalBalanceAmount, balance),
    nativeCurrency
  );

  const formattedTokens = map(tokens, token => ({
    ...token,
    balance: floor(parseFloat(token.balance), 4) || '< 0.0001',
  }));

  const tokenSymbols = map(formattedTokens, token => token.symbol);

  return {
    percentageOwned,
    pricePerShare,
    relativeChange: price?.relative_change_24h,
    tokens: formattedTokens,
    tokenSymbols,
    totalBalanceAmount,
    totalNativeDisplay,
    type,
    uniBalance: floor(balance, 7),
    uniqueId,
  };
};

const buildUniswapCards = (
  nativeCurrency,
  assets,
  uniswapLiquidityTokenInfo
) => {
  const uniswapPools = compact(
    map(values(uniswapLiquidityTokenInfo), liquidityPool =>
      transformPool(liquidityPool, nativeCurrency)
    )
  );
  const orderedUniswapPools = orderBy(
    uniswapPools,
    [({ totalBalanceAmount }) => Number(totalBalanceAmount)],
    ['desc']
  );

  let uniswapTotal = 0;

  if (Array.isArray(orderedUniswapPools) && orderedUniswapPools.length) {
    uniswapTotal = sumBy(orderedUniswapPools, ({ totalBalanceAmount }) =>
      Number(totalBalanceAmount)
    );
  }

  return {
    uniswap: orderedUniswapPools,
    uniswapTotal: convertAmountToNativeDisplay(uniswapTotal, nativeCurrency),
  };
};

export const readableUniswapSelector = createSelector(
  [nativeCurrencySelector, assetsSelector, uniswapLiquidityTokenInfoSelector],
  buildUniswapCards
);
