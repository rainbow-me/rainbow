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
} from '@rainbow-me/helpers/utilities';
import { tokenOverrides } from '@rainbow-me/references';

const assetsSelector = state => state.data.assets;
const nativeCurrencySelector = state => state.settings.nativeCurrency;
const uniswapLiquidityTokenInfoSelector = state =>
  state.uniswapLiquidity.uniswapLiquidityTokenInfo;

const transformPool = (liquidityPool, nativeCurrency) => {
  if (isEmpty(liquidityPool)) {
    return null;
  }

  const { balance, price, tokens, totalSupply } = liquidityPool;
  const balanceAmount = balance.amount;

  const percentageOwned = multiply(divide(balanceAmount, totalSupply), 100);

  const totalBalancePrice = multiply(balanceAmount, price?.value || 0);
  const totalNativeDisplay = convertAmountToNativeDisplay(
    totalBalancePrice,
    nativeCurrency
  );
  const pricePerShare = convertAmountToNativeDisplay(
    divide(totalBalancePrice, balanceAmount),
    nativeCurrency
  );

  const formattedTokens = map(tokens, token => ({
    ...token,
    ...(token.address ? tokenOverrides[toLower(token.address)] : {}),
    value: handleSignificantDecimalsWithThreshold(token.balance, 4),
  }));

  const tokenNames = join(
    map(formattedTokens, token => token.symbol),
    '-'
  );

  return {
    ...liquidityPool,
    percentageOwned,
    pricePerShare,
    tokenNames,
    tokens: formattedTokens,
    totalBalancePrice,
    totalNativeDisplay,
    uniBalance: handleSignificantDecimals(balanceAmount, 3),
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
    [({ totalBalancePrice }) => Number(totalBalancePrice)],
    ['desc']
  );

  let uniswapTotal = 0;

  if (Array.isArray(orderedUniswapPools) && orderedUniswapPools.length) {
    uniswapTotal = sumBy(orderedUniswapPools, ({ totalBalancePrice }) =>
      Number(totalBalancePrice)
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
