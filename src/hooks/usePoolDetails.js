import { pick, toLower } from 'lodash';
import { useSelector } from 'react-redux';
import useNativeCurrencyToUSD from './useNativeCurrencyToUSD';

export default function usePoolDetails(address) {
  const currenciesRate = useNativeCurrencyToUSD();

  const pair = useSelector(
    state => state.uniswapLiquidity.poolsDetails[toLower(address)]
  );
  if (!pair) {
    return pair;
  }
  const pairAdjustedForCurrency = {
    ...pair,
    liquidity: pair.liquidity * currenciesRate,
    oneDayVolumeUSD: pair.oneDayVolumeUSD * currenciesRate,
  };
  return pick(pairAdjustedForCurrency, [
    'address',
    'annualized_fees',
    'liquidity',
    'oneDayVolumeUSD',
    'profit30d',
    'symbol',
    'tokens',
    'tokenNames',
    'type',
  ]);
}
