import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useAccountSettings } from './index';

export default function usePoolDetails(address) {
  const { nativeCurrency } = useAccountSettings();
  const data = useSelector(
    state => state.uniswapLiquidity.poolsDetails[address]
  );
  const volume = useMemo(
    () =>
      data?.oneDayVolumeUSD
        ?.toLocaleString('en-US', {
          currency: nativeCurrency,
          style: 'currency',
        })
        .slice(0, data?.oneDayVolumeUSD > 10000 ? -3 : 0),
    [data?.oneDayVolumeUSD, nativeCurrency]
  );

  return {
    ...data,
    volume,
  };
}
