import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import useNativeCurrencyToUSD from './useNativeCurrencyToUSD';

export default function usePoolDetails(address) {
  const { nativeCurrency } = useAccountSettings();
  const rate = useNativeCurrencyToUSD();

  const data = useSelector(
    state => state.uniswapLiquidity.poolsDetails[address]
  );
  const volume = useMemo(
    () =>
      (data?.oneDayVolumeUSD * rate)
        ?.toLocaleString('en-US', {
          currency: nativeCurrency,
          style: 'currency',
        })
        .slice(0, data?.oneDayVolumeUSD * rate > 10000 ? -3 : 0),
    [data?.oneDayVolumeUSD, nativeCurrency, rate]
  );
  const nativeLiquidity = useMemo(
    () =>
      (data?.liquidity * rate)
        ?.toLocaleString('en-US', {
          currency: nativeCurrency,
          style: 'currency',
        })
        .slice(0, data?.liquidity * rate > 10000 ? -3 : 0),
    [data?.liquidity, nativeCurrency, rate]
  );

  return {
    ...data,
    nativeLiquidity,
    volume,
  };
}
