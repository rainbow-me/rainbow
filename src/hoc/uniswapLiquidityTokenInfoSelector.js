import {
  compact,
  floor,
  get,
  isEmpty,
  map,
  orderBy,
  sumBy,
  values,
} from 'lodash';
import { createSelector } from 'reselect';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToNativeDisplay,
  divide,
  multiply,
} from '../helpers/utilities';
import { ethereumUtils } from '../utils';

const assetsSelector = state => state.data.assets;
const nativeCurrencySelector = state => state.settings.nativeCurrency;
const uniswapLiquidityTokenInfoSelector = state =>
  state.uniswap.uniswapLiquidityTokenInfo;

export const transformPool = (liquidityPool, ethPrice, nativeCurrency) => {
  if (isEmpty(liquidityPool)) {
    return null;
  }

  const {
    balance,
    ethBalance,
    token: { balance: tokenBalance, name: tokenName, symbol: tokenSymbol },
    tokenAddress,
    totalSupply,
    uniqueId,
  } = liquidityPool;

  const percentageOwned = multiply(divide(balance, totalSupply), 100);
  const {
    amount: balanceAmount,
    display: nativeDisplay,
  } = convertAmountAndPriceToNativeDisplay(
    ethBalance,
    ethPrice,
    nativeCurrency
  );
  const totalBalanceAmount = multiply(balanceAmount, 2);
  const totalNativeDisplay = convertAmountToNativeDisplay(
    totalBalanceAmount,
    nativeCurrency
  );

  return {
    ethBalance: floor(parseFloat(ethBalance), 4) || '< 0.0001',
    nativeDisplay,
    percentageOwned,
    tokenAddress,
    tokenBalance: floor(parseFloat(tokenBalance), 4) || '< 0.0001',
    tokenName,
    tokenSymbol,
    totalBalanceAmount,
    totalNativeDisplay,
    uniBalance: floor(balance, 7),
    uniqueId,
    uniTotalSupply: floor(totalSupply, 7),
  };
};

const buildUniswapCards = (
  nativeCurrency,
  assets,
  uniswapLiquidityTokenInfo
) => {
  const ethPrice = get(ethereumUtils.getAsset(assets), 'price.value', 0);

  const uniswapPools = compact(
    map(values(uniswapLiquidityTokenInfo), liquidityPool =>
      transformPool(liquidityPool, ethPrice, nativeCurrency)
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
