import { useCallback, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { bigNumberFormat } from '../components/investment-cards/PoolValue';
import useAccountSettings from './useAccountSettings';
import useNativeCurrencyToUSD from './useNativeCurrencyToUSD';

function cutIfOver10000(value) {
  return value > 10000 ? Math.round(value) : value;
}

export default function usePoolDetails(address) {
  const { nativeCurrency } = useAccountSettings();
  const rate = useNativeCurrencyToUSD();

  const format = useCallback(
    value => bigNumberFormat(cutIfOver10000(value), nativeCurrency),
    [nativeCurrency]
  );

  const data = useSelector(
    state => state.uniswapLiquidity.poolsDetails[address]
  );
  const volume = useMemo(() => format(data?.oneDayVolumeUSD * rate), [
    data?.oneDayVolumeUSD,
    format,
    rate,
  ]);
  const nativeLiquidity = useMemo(() => format(data?.liquidity * rate), [
    data?.liquidity,
    nativeCurrency,
    rate,
  ]);

  return {
    ...data,
    nativeLiquidity,
    volume,
  };
}
