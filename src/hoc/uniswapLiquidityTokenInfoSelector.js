import {
  compact,
  isEmpty,
  join,
  map,
  orderBy,
  sumBy,
  toLower,
  values,
} from 'lodash';
import { createSelector } from 'reselect';
import {
  convertAmountToNativeDisplay,
  divide,
  handleSignificantDecimals,
  handleSignificantDecimalsWithThreshold,
  multiply,
} from '../helpers/utilities';
import { tokenOverrides } from '../references';

const assetsSelector = state => state.data.assets;
const nativeCurrencySelector = state => state.settings.nativeCurrency;
const uniswapLiquidityTokenInfoSelector = state =>
  state.uniswapLiquidity.uniswapLiquidityTokenInfo;

export const transformPool = (liquidityPool, nativeCurrency) => {
  if (isEmpty(liquidityPool)) {
    return null;
  }

  const {
    address,
    balance,
    price,
    symbol,
    tokens,
    totalSupply,
    type,
    uniqueId,
  } = liquidityPool;

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
    ...(token.address ? tokenOverrides[toLower(token.address)] : {}),
    value: handleSignificantDecimalsWithThreshold(token.balance, 4),
  }));

  const name = join(
    map(formattedTokens, token => token.symbol),
    '-'
  );

  return {
    ...liquidityPool,
    address,
    name,
    percentageOwned,
    pricePerShare,
    relativeChange: price?.relative_change_24h,
    symbol,
    tokens: formattedTokens,
    totalBalanceAmount,
    totalNativeDisplay,
    type,
    uniBalance: handleSignificantDecimals(balance, 3),
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
    uniswapTotal,
  };
};

export const readableUniswapSelector = createSelector(
  [nativeCurrencySelector, assetsSelector, uniswapLiquidityTokenInfoSelector],
  buildUniswapCards
);
