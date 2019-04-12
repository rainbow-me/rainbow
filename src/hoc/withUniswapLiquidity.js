import {
  filter,
  get,
  isEmpty,
  isNil,
  map,
  orderBy,
  values,
} from 'lodash';
import {
  convertAmountFromBigNumber,
  convertAmountToBigNumber,
  divide,
  multiply,
  simpleConvertAmountToDisplay,
} from '@rainbow-me/rainbow-common';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompose';
import { createSelector } from 'reselect';

const mapStateToProps = ({
  prices: { prices },
  settings: { nativeCurrency },
  uniswap: { uniswap }
}) => ({
  prices,
  nativeCurrency,
  uniswap,
});

const uniswapSelector = state => state.uniswap;
const pricesSelector = state => state.prices;
const nativeCurrencySelector = state => state.nativeCurrency;

export const transformPool = (liquidityPool, balancePriceUnit, nativeCurrency) => {
  if (isEmpty(liquidityPool)) {
    return null;
  }
  const { 
    balance,
    ethBalance,
    token: {
      balance: tokenBalance,
      symbol: tokenSymbol,
    },
    totalSupply,
  } = liquidityPool;
  const percentageOwned = multiply(divide(balance, totalSupply), 100);
  const balanceRaw = multiply(ethBalance, balancePriceUnit);
  const balanceAmount = convertAmountToBigNumber(balanceRaw);
  const totalBalanceAmount = multiply(balanceAmount, 2);
  const nativeDisplay = simpleConvertAmountToDisplay(
    balanceAmount,
    nativeCurrency,
  );
  const totalNativeDisplay = simpleConvertAmountToDisplay(
    totalBalanceAmount,
    nativeCurrency,
  );
  // TODO: perhaps for future, may want to include an investment type enum
  return {
    ethBalance,
    nativeDisplay,
    percentageOwned,
    tokenBalance,
    totalBalanceAmount,
    totalNativeDisplay,
    tokenSymbol,
  }
};

const buildUniswapCards = (uniswap, prices, nativeCurrency) => {
  const assetNativePrice = get(prices, `[${nativeCurrency}]['ETH']`);
  const balancePriceUnit = convertAmountFromBigNumber(
    get(assetNativePrice, 'price.amount', 0),
  );

  const uniswapPools = map(values(uniswap), (liquidityPool) => transformPool(liquidityPool, balancePriceUnit, nativeCurrency));
  const orderedUniswapPools = orderBy(filter(uniswapPools, (x) => !isNil(x)), ['totalBalanceAmount'], ['desc']);
  console.log('UNISWAP POOLS', orderedUniswapPools);
  return { uniswap: orderedUniswapPools };
};

const readableUniswapSelector = createSelector(
  [uniswapSelector, pricesSelector, nativeCurrencySelector],
  buildUniswapCards,
);

export default Component => compose(
  connect(mapStateToProps, {}),
  withProps(readableUniswapSelector),
)(Component);
